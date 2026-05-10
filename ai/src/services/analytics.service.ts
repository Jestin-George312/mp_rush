/**
 * F6 — Data-Driven Decision Support (Analytics)
 */
import pool from '../config/db';
import { getMaxGuideLoad } from '../engine/thresholds';

export const getGuideEffectiveness = async (deptId?: number) => {
    const filter = deptId ? 'AND b.department_id = $1' : '';
    const params = deptId ? [deptId] : [];
    const res = await pool.query(`
        SELECT u.uid AS guide_id, pr.full_name AS guide_name,
               COUNT(DISTINCT g.id)::int AS total_groups,
               COALESCE(ROUND(AVG(p.progress)),0)::int AS avg_progress,
               CASE WHEN COUNT(DISTINCT t.id) > 0
                    THEN ROUND(100.0 * COUNT(DISTINCT CASE WHEN t.status='done' AND (t.deadline IS NULL OR t.deadline >= t.created_at::date) THEN t.id END) / COUNT(DISTINCT t.id))
                    ELSE 0 END::int AS on_time_ratio,
               CASE WHEN COUNT(DISTINCT doc.id) > 0
                    THEN ROUND(100.0 * COUNT(DISTINCT CASE WHEN doc.status='Approved' THEN doc.id END) / COUNT(DISTINCT doc.id))
                    ELSE 0 END::int AS approval_rate
        FROM users u
        LEFT JOIN profiles pr ON pr.u_id = u.uid
        LEFT JOIN groups g ON g.guide_id = u.uid
        LEFT JOIN batches b ON b.id = g.batch_id
        LEFT JOIN projects p ON p.group_id = g.id
        LEFT JOIN tasks t ON t.project_id = p.id
        LEFT JOIN documents doc ON doc.project_id = p.id
        WHERE u.role = 'guide'  ${filter}
        GROUP BY u.uid, pr.full_name
        ORDER BY AVG(p.progress) DESC NULLS LAST
    `, params);

    return res.rows.map((r: any) => ({
        ...r,
        effectiveness_score: Math.round(r.avg_progress * 0.4 + r.on_time_ratio * 0.3 + r.approval_rate * 0.3),
    }));
};

export const getDomainDistribution = async (deptId?: number) => {
    const filter = deptId ? 'WHERE b.department_id = $1' : '';
    const params = deptId ? [deptId] : [];
    const res = await pool.query(`
        SELECT COALESCE(p.domain, 'Unspecified') AS domain, COUNT(*)::int AS count,
               ROUND(AVG(p.progress))::int AS avg_progress
        FROM projects p
        JOIN groups g ON g.id = p.group_id
        LEFT JOIN batches b ON b.id = g.batch_id
        ${filter}
        GROUP BY p.domain ORDER BY count DESC
    `, params);
    return res.rows;
};

export const getBatchHealthMatrix = async (deptId: number) => {
    const res = await pool.query(`
        SELECT b.id AS batch_id, b.name AS batch_name,
               COALESCE(ROUND(AVG(p.progress)),0)::int AS avg_progress,
               COUNT(DISTINCT CASE WHEN ap.risk_level IN ('at_risk','critical') THEN p.id END)::int AS at_risk,
               COUNT(DISTINCT CASE WHEN ap.risk_level = 'healthy' THEN p.id END)::int AS healthy,
               COUNT(DISTINCT CASE WHEN ap.risk_level = 'warning' THEN p.id END)::int AS warning,
               CASE WHEN COUNT(DISTINCT doc.id) > 0
                    THEN ROUND(100.0 * COUNT(DISTINCT CASE WHEN doc.status='Approved' THEN doc.id END) / COUNT(DISTINCT doc.id))
                    ELSE 0 END::int AS compliance_rate
        FROM batches b
        LEFT JOIN groups g ON g.batch_id = b.id
        LEFT JOIN projects p ON p.group_id = g.id
        LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
        LEFT JOIN documents doc ON doc.project_id = p.id
        WHERE b.department_id = $1
        GROUP BY b.id, b.name ORDER BY b.name
    `, [deptId]);
    return res.rows;
};

export const getCompletionForecast = async (batchId: number) => {
    const res = await pool.query(`
        SELECT g.id AS group_id, g.group_name, p.title, p.progress, p.created_at,
               pr.full_name AS guide_name
        FROM groups g
        LEFT JOIN projects p ON p.group_id = g.id
        LEFT JOIN profiles pr ON pr.u_id = g.guide_id
        WHERE g.batch_id = $1 AND p.id IS NOT NULL
        ORDER BY p.progress DESC
    `, [batchId]);

    const finalDeadlineRes = await pool.query(`SELECT MAX(due_date) AS final FROM deadlines WHERE batch_id = $1`, [batchId]);
    const finalDeadline = finalDeadlineRes.rows[0]?.final ? new Date(finalDeadlineRes.rows[0].final) : null;

    return res.rows.map((row: any) => {
        const created = new Date(row.created_at);
        const now = new Date();
        const elapsedDays = Math.max(1, Math.floor((now.getTime() - created.getTime()) / 86400000));
        const dailyRate = row.progress / elapsedDays;
        const remaining = 100 - row.progress;
        const daysToComplete = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : null;
        const estimatedDate = daysToComplete ? new Date(now.getTime() + daysToComplete * 86400000) : null;
        const onTrack = estimatedDate && finalDeadline ? estimatedDate <= finalDeadline : null;

        return { ...row, daily_rate: Math.round(dailyRate * 100) / 100, days_to_complete: daysToComplete,
            estimated_completion: estimatedDate?.toISOString().split('T')[0] || null,
            final_deadline: finalDeadline?.toISOString().split('T')[0] || null, on_track: onTrack };
    });
};

export const getWorkloadFairness = async () => {
    const res = await pool.query(`
        SELECT u.uid AS guide_id, pr.full_name, COUNT(g.id)::int AS load
        FROM users u LEFT JOIN profiles pr ON pr.u_id = u.uid LEFT JOIN groups g ON g.guide_id = u.uid
        WHERE u.role='guide' 
        GROUP BY u.uid, pr.full_name ORDER BY load DESC
    `);
    const loads = res.rows.map((r: any) => r.load);
    const avg = loads.length ? loads.reduce((a: number, b: number) => a + b, 0) / loads.length : 0;
    const variance = loads.length ? loads.reduce((s: number, l: number) => s + (l - avg) ** 2, 0) / loads.length : 0;
    const maxLoad = getMaxGuideLoad();
    return { guides: res.rows, stats: { avg_load: Math.round(avg * 100) / 100, std_deviation: Math.round(Math.sqrt(variance) * 100) / 100,
        fairness_index: Math.round((1 - Math.sqrt(variance) / Math.max(avg, 1)) * 100) / 100, max_allowed: maxLoad.hard_cap } };
};

export const getSubmissionFunnel = async (batchId: number) => {
    const res = await pool.query(`
        SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='Pending')::int AS pending,
               COUNT(*) FILTER (WHERE status='Approved')::int AS approved, COUNT(*) FILTER (WHERE status='Rejected')::int AS rejected
        FROM documents d JOIN projects p ON p.id=d.project_id JOIN groups g ON g.id=p.group_id WHERE g.batch_id=$1
    `, [batchId]);
    return res.rows[0];
};
