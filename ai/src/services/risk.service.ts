/**
 * F3 — At-Risk Student / Project Identification
 *
 * Multi-factor risk scoring engine that evaluates every active project
 * and writes results to the `ai_predictions` table.
 *
 * Factors (total weight = 100):
 *   1. Overdue tasks          — 30
 *   2. Progress vs timeline   — 25
 *   3. Missing documents      — 20
 *   4. No guide assigned      — 10
 *   5. Inactivity             — 15
 */
import pool from '../config/db';
import { classifyRisk, clamp } from '../engine/scoring';
import { getRiskThresholds } from '../engine/thresholds';
import type { RiskPrediction, RiskFactors } from '../types/ai.types';

// ── Core: compute risk for every active project ───────────
export const computeRiskScores = async (): Promise<number> => {
    const thresholds = getRiskThresholds();

    // Pull all active projects with their group + guide info
    const projectsRes = await pool.query(`
        SELECT
            p.id          AS project_id,
            p.progress,
            p.created_at,
            p.review_state,
            g.id          AS group_id,
            g.guide_id,
            b.id          AS batch_id
        FROM projects p
        JOIN groups g ON g.id = p.group_id
        LEFT JOIN batches b ON b.id = g.batch_id
        WHERE p.status != 'rejected'
    `);

    let updated = 0;

    for (const proj of projectsRes.rows) {
        const factors = await computeFactors(proj);
        const score = clamp(
            factors.overdue_tasks + factors.progress_gap +
            factors.missing_docs + factors.no_guide + factors.inactivity,
            0, 100
        );
        const level = classifyRisk(score, thresholds);

        // Upsert into ai_predictions
        await pool.query(`
            INSERT INTO ai_predictions (entity_type, entity_id, risk_score, risk_level, factors, predicted_at)
            VALUES ('project', $1, $2, $3, $4, NOW())
            ON CONFLICT (entity_type, entity_id)
            DO UPDATE SET risk_score = $2, risk_level = $3, factors = $4, predicted_at = NOW()
        `, [proj.project_id, score, level, JSON.stringify(factors)]);

        updated++;
    }

    // Log the batch run
    await pool.query(`
        INSERT INTO ai_audit_log (action, details, performed_at)
        VALUES ('risk_scoring_batch', $1, NOW())
    `, [JSON.stringify({ projects_scored: updated })]);

    return updated;
};

// ── Compute individual factor scores ──────────────────────
async function computeFactors(proj: any): Promise<RiskFactors> {
    // Factor 1: Overdue tasks (weight 30)
    const taskRes = await pool.query(`
        SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE deadline < CURRENT_DATE AND status != 'done')::int AS overdue
        FROM tasks
        WHERE project_id = $1
    `, [proj.project_id]);
    const totalTasks = taskRes.rows[0]?.total || 0;
    const overdueTasks = taskRes.rows[0]?.overdue || 0;
    const overdueRatio = totalTasks > 0 ? overdueTasks / totalTasks : 0;
    const overdue_tasks = clamp(overdueRatio * 30, 0, 30);

    // Factor 2: Progress vs timeline (weight 25)
    const finalDeadlineRes = await pool.query(`
        SELECT MAX(due_date) AS final_deadline
        FROM deadlines
        WHERE batch_id = $1
    `, [proj.batch_id]);
    const finalDeadline = finalDeadlineRes.rows[0]?.final_deadline;
    let progress_gap = 0;
    if (finalDeadline) {
        const created = new Date(proj.created_at);
        const deadline = new Date(finalDeadline);
        const now = new Date();
        const totalSpan = Math.max(deadline.getTime() - created.getTime(), 1);
        const elapsed = now.getTime() - created.getTime();
        const timeElapsedPct = Math.min((elapsed / totalSpan) * 100, 100);
        const gap = Math.max(0, timeElapsedPct - (proj.progress || 0));
        progress_gap = clamp((gap / 100) * 25, 0, 25);
    }

    // Factor 3: Missing documents (weight 20)
    const docRes = await pool.query(`
        SELECT COUNT(*)::int AS missed
        FROM deadlines dl
        LEFT JOIN documents d ON d.deadline_id = dl.id AND d.project_id = $1 AND d.status = 'Approved'
        WHERE dl.batch_id = $2 AND dl.due_date < CURRENT_DATE AND d.id IS NULL
    `, [proj.project_id, proj.batch_id]);
    const missedDocs = docRes.rows[0]?.missed || 0;
    const missing_docs = clamp(missedDocs * 7, 0, 20);

    // Factor 4: No guide assigned (weight 10)
    const no_guide = proj.guide_id ? 0 : 10;

    // Factor 5: Inactivity (weight 15)
    const activityRes = await pool.query(`
        SELECT MAX(latest) AS last_active FROM (
            SELECT MAX(created_at) AS latest FROM tasks     WHERE project_id = $1
            UNION ALL
            SELECT MAX(created_at) AS latest FROM documents WHERE project_id = $1
            UNION ALL
            SELECT MAX(created_at) AS latest FROM meetings  WHERE project_id = $1
            UNION ALL
            SELECT $2::timestamptz AS latest  -- project updated_at fallback
        ) sub
    `, [proj.project_id, proj.created_at]);
    const lastActive = activityRes.rows[0]?.last_active ? new Date(activityRes.rows[0].last_active) : new Date(proj.created_at);
    const daysInactive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    const inactivity = clamp(daysInactive * 1.5, 0, 15);

    return { overdue_tasks, progress_gap, missing_docs, no_guide, inactivity };
}

// ── Trigger risk update for a single project ──────────────
export const triggerRiskUpdate = async (projectId: number): Promise<void> => {
    const projRes = await pool.query(`
        SELECT p.id AS project_id, p.progress, p.created_at, p.review_state,
               g.id AS group_id, g.guide_id, b.id AS batch_id
        FROM projects p
        JOIN groups g ON g.id = p.group_id
        LEFT JOIN batches b ON b.id = g.batch_id
        WHERE p.id = $1
    `, [projectId]);
    if (projRes.rows.length === 0) return;

    const proj = projRes.rows[0];
    const thresholds = getRiskThresholds();
    const factors = await computeFactors(proj);
    const score = clamp(
        factors.overdue_tasks + factors.progress_gap +
        factors.missing_docs + factors.no_guide + factors.inactivity,
        0, 100
    );
    const level = classifyRisk(score, thresholds);

    await pool.query(`
        INSERT INTO ai_predictions (entity_type, entity_id, risk_score, risk_level, factors, predicted_at)
        VALUES ('project', $1, $2, $3, $4, NOW())
        ON CONFLICT (entity_type, entity_id)
        DO UPDATE SET risk_score = $2, risk_level = $3, factors = $4, predicted_at = NOW()
    `, [projectId, score, level, JSON.stringify(factors)]);
};

// ── Query: get at-risk projects (with optional filters) ───
export const getAtRiskProjects = async (deptId?: number, batchId?: number) => {
    const conditions: string[] = [];
    const params: any[] = [];

    if (deptId) {
        params.push(deptId);
        conditions.push(`b.department_id = $${params.length}`);
    }
    if (batchId) {
        params.push(batchId);
        conditions.push(`b.id = $${params.length}`);
    }

    const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

    const res = await pool.query(`
        SELECT
            ap.entity_id AS project_id,
            ap.risk_score,
            ap.risk_level,
            ap.factors,
            ap.predicted_at,
            p.title,
            p.progress,
            g.group_name,
            g.guide_id,
            gp.full_name AS guide_name,
            b.name AS batch_name
        FROM ai_predictions ap
        JOIN projects p ON p.id = ap.entity_id AND ap.entity_type = 'project'
        JOIN groups g ON g.id = p.group_id
        LEFT JOIN batches b ON b.id = g.batch_id
        LEFT JOIN profiles gp ON gp.u_id = g.guide_id
        WHERE ap.risk_level != 'healthy' ${where}
        ORDER BY ap.risk_score DESC
    `, params);

    return res.rows;
};

// ── Query: individual student risk profile ────────────────
export const getStudentRiskProfile = async (studentId: number) => {
    const res = await pool.query(`
        SELECT
            ap.risk_score,
            ap.risk_level,
            ap.factors,
            p.id AS project_id,
            p.title,
            p.progress,
            g.group_name
        FROM group_members gm
        JOIN groups g ON g.id = gm.group_id
        JOIN projects p ON p.group_id = g.id
        LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
        WHERE gm.student_id = $1
    `, [studentId]);

    return res.rows;
};

// ── Query: risk scores for a guide's groups ───────────────
export const getGuideGroupRisks = async (guideId: number) => {
    const res = await pool.query(`
        SELECT
            ap.entity_id AS project_id,
            ap.risk_score,
            ap.risk_level,
            ap.factors,
            p.title,
            p.progress,
            g.id AS group_id,
            g.group_name
        FROM groups g
        JOIN projects p ON p.group_id = g.id
        LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
        WHERE g.guide_id = $1
        ORDER BY ap.risk_score DESC NULLS LAST
    `, [guideId]);

    return res.rows;
};

// ── Query: risk trends over time ──────────────────────────
export const getRiskTrends = async (daysBack: number = 30) => {
    // Since we overwrite predictions, we track trends via audit log
    const res = await pool.query(`
        SELECT
            DATE(performed_at) AS date,
            (details->>'projects_scored')::int AS projects_scored
        FROM ai_audit_log
        WHERE action = 'risk_scoring_batch'
          AND performed_at >= CURRENT_DATE - $1::int
        ORDER BY performed_at ASC
    `, [daysBack]);

    // Also get current distribution
    const distRes = await pool.query(`
        SELECT
            risk_level,
            COUNT(*)::int AS count,
            ROUND(AVG(risk_score), 2) AS avg_score
        FROM ai_predictions
        WHERE entity_type = 'project'
        GROUP BY risk_level
        ORDER BY avg_score DESC
    `);

    return {
        history: res.rows,
        distribution: distRes.rows,
    };
};
