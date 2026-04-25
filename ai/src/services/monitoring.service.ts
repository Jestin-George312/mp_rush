/**
 * F2 — Department-Level Progress Monitoring & Compliance
 *
 * Aggregates project progress, task completion, document compliance,
 * and deadline adherence at the department and batch level.
 */
import pool from '../config/db';

// ── Department overview (aggregated stats) ────────────────
export const getDepartmentOverview = async (deptId: number) => {
    const res = await pool.query(`
        SELECT
            d.name AS department_name,
            COUNT(DISTINCT b.id)::int AS total_batches,
            COUNT(DISTINCT g.id)::int AS total_groups,
            COUNT(DISTINCT p.id)::int AS total_projects,
            COALESCE(ROUND(AVG(p.progress)), 0)::int AS avg_progress,
            COUNT(DISTINCT CASE WHEN ap.risk_level = 'healthy' THEN p.id END)::int AS healthy_count,
            COUNT(DISTINCT CASE WHEN ap.risk_level = 'warning' THEN p.id END)::int AS warning_count,
            COUNT(DISTINCT CASE WHEN ap.risk_level IN ('at_risk', 'critical') THEN p.id END)::int AS at_risk_count,
            COALESCE(
                ROUND(100.0 * COUNT(DISTINCT CASE WHEN doc.status = 'Approved' THEN doc.id END) /
                NULLIF(COUNT(DISTINCT doc.id), 0)), 0
            )::int AS doc_approval_rate,
            COALESCE(
                ROUND(100.0 * COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) /
                NULLIF(COUNT(DISTINCT t.id), 0)), 0
            )::int AS task_completion_rate
        FROM departments d
        LEFT JOIN batches b ON b.department_id = d.id
        LEFT JOIN groups g ON g.batch_id = b.id
        LEFT JOIN projects p ON p.group_id = g.id
        LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
        LEFT JOIN documents doc ON doc.project_id = p.id
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE d.id = $1
        GROUP BY d.name
    `, [deptId]);

    return res.rows[0] || null;
};

// ── Batch-by-batch comparison within a department ─────────
export const getBatchProgressComparison = async (deptId: number) => {
    const res = await pool.query(`
        SELECT
            b.id AS batch_id,
            b.name AS batch_name,
            COUNT(DISTINCT g.id)::int AS group_count,
            COUNT(DISTINCT p.id)::int AS project_count,
            COALESCE(ROUND(AVG(p.progress)), 0)::int AS avg_progress,
            COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::int AS done_tasks,
            COUNT(DISTINCT t.id)::int AS total_tasks,
            COUNT(DISTINCT CASE WHEN doc.status = 'Approved' THEN doc.id END)::int AS approved_docs,
            COUNT(DISTINCT doc.id)::int AS total_docs,
            COUNT(DISTINCT CASE WHEN ap.risk_level IN ('at_risk', 'critical') THEN p.id END)::int AS at_risk_projects
        FROM batches b
        LEFT JOIN groups g ON g.batch_id = b.id
        LEFT JOIN projects p ON p.group_id = g.id
        LEFT JOIN tasks t ON t.project_id = p.id
        LEFT JOIN documents doc ON doc.project_id = p.id
        LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
        WHERE b.department_id = $1
        GROUP BY b.id, b.name
        ORDER BY b.name
    `, [deptId]);

    return res.rows.map((row: any) => ({
        ...row,
        task_completion_rate: row.total_tasks > 0 ? Math.round((row.done_tasks / row.total_tasks) * 100) : 0,
        doc_approval_rate: row.total_docs > 0 ? Math.round((row.approved_docs / row.total_docs) * 100) : 0,
    }));
};

// ── Per-group compliance breakdown for a batch ────────────
export const getComplianceReport = async (batchId: number) => {
    const res = await pool.query(`
        SELECT
            g.id AS group_id,
            g.group_name,
            p.title AS project_title,
            p.progress,
            pr.full_name AS guide_name,
            COUNT(DISTINCT t.id)::int AS total_tasks,
            COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END)::int AS done_tasks,
            COUNT(DISTINCT CASE WHEN t.deadline < CURRENT_DATE AND t.status != 'done' THEN t.id END)::int AS overdue_tasks,
            COUNT(DISTINCT doc.id)::int AS total_docs,
            COUNT(DISTINCT CASE WHEN doc.status = 'Approved' THEN doc.id END)::int AS approved_docs,
            COUNT(DISTINCT CASE WHEN doc.status = 'Rejected' THEN doc.id END)::int AS rejected_docs,
            COALESCE(ap.risk_score, 0) AS risk_score,
            COALESCE(ap.risk_level, 'unknown') AS risk_level
        FROM groups g
        LEFT JOIN projects p ON p.group_id = g.id
        LEFT JOIN profiles pr ON pr.u_id = g.guide_id
        LEFT JOIN tasks t ON t.project_id = p.id
        LEFT JOIN documents doc ON doc.project_id = p.id
        LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
        WHERE g.batch_id = $1
        GROUP BY g.id, g.group_name, p.title, p.progress, pr.full_name, ap.risk_score, ap.risk_level
        ORDER BY COALESCE(ap.risk_score, 0) DESC
    `, [batchId]);

    return res.rows.map((row: any) => ({
        ...row,
        task_completion_rate: row.total_tasks > 0 ? Math.round((row.done_tasks / row.total_tasks) * 100) : 0,
        compliance_score: calculateCompliance(row),
    }));
};

// ── Phase-wise progress for a batch ───────────────────────
export const getPhaseWiseProgress = async (batchId: number) => {
    const res = await pool.query(`
        SELECT
            dl.phase,
            dl.title,
            dl.due_date,
            dl.due_date < CURRENT_DATE AS is_past,
            COUNT(DISTINCT doc.id) FILTER (WHERE doc.status = 'Approved')::int AS approved,
            COUNT(DISTINCT doc.id) FILTER (WHERE doc.status = 'Pending')::int AS pending,
            COUNT(DISTINCT doc.id) FILTER (WHERE doc.status = 'Rejected')::int AS rejected,
            (SELECT COUNT(DISTINCT g.id) FROM groups g WHERE g.batch_id = $1)::int AS total_groups
        FROM deadlines dl
        LEFT JOIN documents doc ON doc.deadline_id = dl.id
        WHERE dl.batch_id = $1
        GROUP BY dl.id, dl.phase, dl.title, dl.due_date
        ORDER BY dl.due_date ASC
    `, [batchId]);

    return res.rows.map((row: any) => ({
        ...row,
        submission_rate: row.total_groups > 0 ? Math.round((row.approved / row.total_groups) * 100) : 0,
    }));
};

// ── Helper: calculate composite compliance score ──────────
function calculateCompliance(row: any): number {
    const taskScore = row.total_tasks > 0 ? (row.done_tasks / row.total_tasks) * 30 : 30;
    const docScore = row.total_docs > 0 ? (row.approved_docs / row.total_docs) * 20 : 0;
    const progressScore = (row.progress || 0) * 0.3;
    const overdueDeduction = Math.min(row.overdue_tasks * 5, 20);
    return Math.round(Math.max(0, taskScore + docScore + progressScore - overdueDeduction));
}
