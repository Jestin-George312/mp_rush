/**
 * F4 — Guide & Coordinator Alert Generation
 *
 * Scans the system for actionable conditions and creates alerts
 * in the `ai_alerts` table. Includes deduplication to avoid spam.
 *
 * Alert Triggers:
 *   - Overdue tasks
 *   - At-risk groups (from ai_predictions)
 *   - Approaching deadlines (within 3 days)
 *   - Inactive projects (7+ days)
 *   - Pending document reviews (5+ days)
 *   - Unassigned groups
 */
import pool from '../config/db';
import type { AIAlert } from '../types/ai.types';

// ── Deduplication helper ──────────────────────────────────
async function alertExists(alert: AIAlert): Promise<boolean> {
    const res = await pool.query(`
        SELECT 1 FROM ai_alerts
        WHERE alert_type = $1 AND ref_type = $2 AND ref_id = $3
          AND target_user = $4 AND is_resolved = FALSE
        LIMIT 1
    `, [alert.alert_type, alert.ref_type || null, alert.ref_id || null, alert.target_user]);
    return res.rows.length > 0;
}

// ── Insert a single alert (with dedup) ────────────────────
async function createAlert(alert: AIAlert): Promise<boolean> {
    if (await alertExists(alert)) return false;

    await pool.query(`
        INSERT INTO ai_alerts (target_role, target_user, alert_type, severity, title, message, ref_type, ref_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
        alert.target_role, alert.target_user, alert.alert_type,
        alert.severity, alert.title, alert.message,
        alert.ref_type || null, alert.ref_id || null
    ]);
    return true;
}

// ══════════════════════════════════════════════════════════
//  GUIDE ALERTS
// ══════════════════════════════════════════════════════════
export const generateGuideAlerts = async (): Promise<number> => {
    let created = 0;

    // 1. Overdue tasks in guide's groups
    const overdueRes = await pool.query(`
        SELECT g.guide_id, g.id AS group_id, g.group_name,
               t.id AS task_id, t.title AS task_title,
               CURRENT_DATE - t.deadline AS days_overdue
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        JOIN groups g ON g.id = p.group_id
        WHERE t.deadline < CURRENT_DATE AND t.status != 'done'
          AND g.guide_id IS NOT NULL
        ORDER BY days_overdue DESC
    `);
    for (const row of overdueRes.rows) {
        const ok = await createAlert({
            target_role: 'guide',
            target_user: row.guide_id,
            alert_type: 'overdue',
            severity: row.days_overdue > 7 ? 'critical' : 'high',
            title: `Overdue task in ${row.group_name}`,
            message: `Task "${row.task_title}" is ${row.days_overdue} day(s) overdue.`,
            ref_type: 'group',
            ref_id: row.group_id,
        });
        if (ok) created++;
    }

    // 2. At-risk groups (from ai_predictions)
    const riskRes = await pool.query(`
        SELECT ap.entity_id AS project_id, ap.risk_level, ap.risk_score,
               p.title, g.guide_id, g.id AS group_id, g.group_name
        FROM ai_predictions ap
        JOIN projects p ON p.id = ap.entity_id AND ap.entity_type = 'project'
        JOIN groups g ON g.id = p.group_id
        WHERE ap.risk_level IN ('at_risk', 'critical') AND g.guide_id IS NOT NULL
    `);
    for (const row of riskRes.rows) {
        const ok = await createAlert({
            target_role: 'guide',
            target_user: row.guide_id,
            alert_type: 'at_risk',
            severity: row.risk_level === 'critical' ? 'critical' : 'high',
            title: `${row.group_name} is ${row.risk_level.replace('_', ' ')}`,
            message: `Project "${row.title}" has a risk score of ${row.risk_score}. Immediate attention needed.`,
            ref_type: 'project',
            ref_id: row.project_id,
        });
        if (ok) created++;
    }

    // 3. Approaching deadlines (within 3 days)
    const deadlineRes = await pool.query(`
        SELECT dl.id, dl.title, dl.due_date,
               dl.due_date - CURRENT_DATE AS days_left,
               g.guide_id, g.group_name, b.name AS batch_name
        FROM deadlines dl
        JOIN batches b ON b.id = dl.batch_id
        JOIN groups g ON g.batch_id = b.id AND g.guide_id IS NOT NULL
        WHERE dl.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 3
    `);
    for (const row of deadlineRes.rows) {
        const ok = await createAlert({
            target_role: 'guide',
            target_user: row.guide_id,
            alert_type: 'deadline',
            severity: row.days_left <= 1 ? 'high' : 'medium',
            title: `Deadline approaching: ${row.title}`,
            message: `"${row.title}" for ${row.batch_name} is due in ${row.days_left} day(s).`,
            ref_type: 'deadline',
            ref_id: row.id,
        });
        if (ok) created++;
    }

    // 4. Inactive projects (7+ days)
    const inactiveRes = await pool.query(`
        SELECT g.guide_id, g.id AS group_id, g.group_name, p.id AS project_id, p.title,
               GREATEST(
                   p.updated_at,
                   COALESCE((SELECT MAX(created_at) FROM tasks WHERE project_id = p.id), p.created_at),
                   COALESCE((SELECT MAX(created_at) FROM documents WHERE project_id = p.id), p.created_at)
               ) AS last_activity
        FROM projects p
        JOIN groups g ON g.id = p.group_id
        WHERE g.guide_id IS NOT NULL AND p.status != 'rejected'
        HAVING GREATEST(
            p.updated_at,
            COALESCE((SELECT MAX(created_at) FROM tasks WHERE project_id = p.id), p.created_at),
            COALESCE((SELECT MAX(created_at) FROM documents WHERE project_id = p.id), p.created_at)
        ) < CURRENT_DATE - 7
    `);
    for (const row of inactiveRes.rows) {
        const ok = await createAlert({
            target_role: 'guide',
            target_user: row.guide_id,
            alert_type: 'inactivity',
            severity: 'high',
            title: `No activity in ${row.group_name}`,
            message: `Project "${row.title}" has had no activity for 7+ days.`,
            ref_type: 'project',
            ref_id: row.project_id,
        });
        if (ok) created++;
    }

    // 5. Documents pending review for 5+ days
    const pendingDocRes = await pool.query(`
        SELECT d.id AS doc_id, d.name AS doc_name, d.created_at,
               CURRENT_DATE - d.created_at::date AS days_pending,
               g.guide_id, g.group_name
        FROM documents d
        JOIN projects p ON p.id = d.project_id
        JOIN groups g ON g.id = p.group_id
        WHERE d.status = 'Pending' AND g.guide_id IS NOT NULL
          AND d.created_at::date <= CURRENT_DATE - 5
    `);
    for (const row of pendingDocRes.rows) {
        const ok = await createAlert({
            target_role: 'guide',
            target_user: row.guide_id,
            alert_type: 'pending_review',
            severity: 'low',
            title: `Document awaiting review`,
            message: `"${row.doc_name}" from ${row.group_name} has been pending for ${row.days_pending} days.`,
            ref_type: 'document',
            ref_id: row.doc_id,
        });
        if (ok) created++;
    }

    // Log
    await pool.query(`
        INSERT INTO ai_audit_log (action, details) VALUES ('generate_guide_alerts', $1)
    `, [JSON.stringify({ alerts_created: created })]);

    return created;
};

// ══════════════════════════════════════════════════════════
//  COORDINATOR ALERTS
// ══════════════════════════════════════════════════════════
export const generateCoordinatorAlerts = async (): Promise<number> => {
    let created = 0;

    // Get all coordinators
    const coordRes = await pool.query(`
        SELECT u.uid, d.id AS dept_id FROM users u
        JOIN departments d ON d.coordinator_id = u.uid
        WHERE u.role = 'coordinator' 
    `);

    for (const coord of coordRes.rows) {
        // 1. Unassigned groups in coordinator's department
        const unassignedRes = await pool.query(`
            SELECT g.id, g.group_name, b.name AS batch_name
            FROM groups g
            JOIN batches b ON b.id = g.batch_id
            WHERE g.guide_id IS NULL AND b.department_id = $1
        `, [coord.dept_id]);
        for (const row of unassignedRes.rows) {
            const ok = await createAlert({
                target_role: 'coordinator',
                target_user: coord.uid,
                alert_type: 'unassigned',
                severity: 'medium',
                title: `Unassigned group: ${row.group_name}`,
                message: `Group "${row.group_name}" in batch "${row.batch_name}" has no assigned guide.`,
                ref_type: 'group',
                ref_id: row.id,
            });
            if (ok) created++;
        }

        // 2. High workload guides
        const loadRes = await pool.query(`
            SELECT u.uid AS guide_id, p.full_name, COUNT(g.id)::int AS load
            FROM users u
            LEFT JOIN profiles p ON p.u_id = u.uid
            LEFT JOIN groups g ON g.guide_id = u.uid
            WHERE u.role = 'guide' 
            GROUP BY u.uid, p.full_name
            HAVING COUNT(g.id) >= 8
        `);
        for (const row of loadRes.rows) {
            const ok = await createAlert({
                target_role: 'coordinator',
                target_user: coord.uid,
                alert_type: 'workload',
                severity: row.load >= 10 ? 'critical' : 'high',
                title: `Guide overloaded: ${row.full_name}`,
                message: `${row.full_name} is supervising ${row.load} groups (limit: 10).`,
                ref_type: 'group',
                ref_id: row.guide_id,
            });
            if (ok) created++;
        }

        // 3. Department-level critical risk count
        const criticalRes = await pool.query(`
            SELECT COUNT(*)::int AS count
            FROM ai_predictions ap
            JOIN projects p ON p.id = ap.entity_id AND ap.entity_type = 'project'
            JOIN groups g ON g.id = p.group_id
            JOIN batches b ON b.id = g.batch_id
            WHERE b.department_id = $1 AND ap.risk_level = 'critical'
        `, [coord.dept_id]);
        if (criticalRes.rows[0]?.count > 0) {
            const ok = await createAlert({
                target_role: 'coordinator',
                target_user: coord.uid,
                alert_type: 'at_risk',
                severity: 'critical',
                title: `${criticalRes.rows[0].count} critical-risk projects`,
                message: `Your department has ${criticalRes.rows[0].count} project(s) at critical risk level. Review immediately.`,
                ref_type: 'project',
                ref_id: 0,
            });
            if (ok) created++;
        }
    }

    await pool.query(`
        INSERT INTO ai_audit_log (action, details) VALUES ('generate_coordinator_alerts', $1)
    `, [JSON.stringify({ alerts_created: created })]);

    return created;
};

// ══════════════════════════════════════════════════════════
//  QUERY & MANAGE ALERTS
// ══════════════════════════════════════════════════════════

export const getAlerts = async (userId: number, unreadOnly: boolean = false) => {
    const filter = unreadOnly ? 'AND is_read = FALSE' : '';
    const res = await pool.query(`
        SELECT * FROM ai_alerts
        WHERE target_user = $1 ${filter}
        ORDER BY created_at DESC
        LIMIT 100
    `, [userId]);
    return res.rows;
};

export const getUnreadCount = async (userId: number): Promise<number> => {
    const res = await pool.query(`
        SELECT COUNT(*)::int AS count FROM ai_alerts
        WHERE target_user = $1 AND is_read = FALSE
    `, [userId]);
    return res.rows[0]?.count || 0;
};

export const markAlertRead = async (alertId: number) => {
    await pool.query(`UPDATE ai_alerts SET is_read = TRUE WHERE id = $1`, [alertId]);
};

export const markAllRead = async (userId: number) => {
    await pool.query(`UPDATE ai_alerts SET is_read = TRUE WHERE target_user = $1 AND is_read = FALSE`, [userId]);
};

export const resolveAlert = async (alertId: number) => {
    await pool.query(`UPDATE ai_alerts SET is_resolved = TRUE, is_read = TRUE WHERE id = $1`, [alertId]);
};
