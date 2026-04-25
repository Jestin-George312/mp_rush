/**
 * F5 — Final Submission Approval & Archival
 */
import pool from '../config/db';
import { getAutoApproveRules } from '../engine/thresholds';
import type { ApprovalCheck } from '../types/ai.types';

export const checkAutoApproval = async (projectId: number): Promise<ApprovalCheck> => {
    const rules = getAutoApproveRules();
    const reasons: string[] = [];
    const projRes = await pool.query(`SELECT id, progress, status, review_state FROM projects WHERE id = $1`, [projectId]);
    if (projRes.rows.length === 0) {
        return { project_id: projectId, eligible: false, reasons: ['Project not found'],
            criteria: { progress_complete: false, all_tasks_done: false, min_docs_approved: false, topic_approved: false, no_pending_revisions: false }};
    }
    const project = projRes.rows[0];

    const progress_complete = project.progress >= rules.min_progress;
    if (!progress_complete) reasons.push(`Progress ${project.progress}%, need ${rules.min_progress}%`);

    const taskRes = await pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='done')::int AS done FROM tasks WHERE project_id=$1`, [projectId]);
    const all_tasks_done = taskRes.rows[0]?.total === 0 || taskRes.rows[0]?.done === taskRes.rows[0]?.total;
    if (!all_tasks_done) reasons.push(`${taskRes.rows[0]?.total - taskRes.rows[0]?.done} task(s) incomplete`);

    const docRes = await pool.query(`SELECT COUNT(*)::int AS approved FROM documents WHERE project_id=$1 AND status='Approved'`, [projectId]);
    const min_docs_approved = (docRes.rows[0]?.approved || 0) >= rules.min_docs_approved;
    if (!min_docs_approved) reasons.push(`${docRes.rows[0]?.approved||0} doc(s) approved, need ${rules.min_docs_approved}`);

    const topic_approved = project.review_state === 'Approved';
    if (!topic_approved) reasons.push(`Topic state "${project.review_state}", needs "Approved"`);

    const pendingRes = await pool.query(`SELECT COUNT(*)::int AS count FROM documents WHERE project_id=$1 AND status IN ('Pending','Rejected')`, [projectId]);
    const no_pending_revisions = (pendingRes.rows[0]?.count || 0) === 0;
    if (!no_pending_revisions) reasons.push(`${pendingRes.rows[0]?.count} doc(s) pending/rejected`);

    const eligible = progress_complete && all_tasks_done && min_docs_approved && topic_approved && no_pending_revisions;
    return { project_id: projectId, eligible, reasons: eligible ? ['All criteria met'] : reasons,
        criteria: { progress_complete, all_tasks_done, min_docs_approved, topic_approved, no_pending_revisions }};
};

export const batchCheckApprovals = async (batchId?: number) => {
    const filter = batchId ? 'AND b.id = $1' : '';
    const params = batchId ? [batchId] : [];
    const res = await pool.query(`SELECT p.id FROM projects p JOIN groups g ON g.id=p.group_id LEFT JOIN batches b ON b.id=g.batch_id WHERE p.status!='rejected' ${filter}`, params);
    const results: ApprovalCheck[] = [];
    for (const row of res.rows) results.push(await checkAutoApproval(row.id));
    return { total_checked: results.length, eligible: results.filter(r => r.eligible), not_eligible: results.filter(r => !r.eligible) };
};

export const autoApproveProject = async (projectId: number) => {
    const check = await checkAutoApproval(projectId);
    if (!check.eligible) return { success: false, message: 'Not eligible', reasons: check.reasons };
    await pool.query(`UPDATE projects SET status='approved', updated_at=NOW() WHERE id=$1`, [projectId]);
    await pool.query(`INSERT INTO ai_audit_log (action, entity_type, entity_id, details) VALUES ('auto_approve','project',$1,$2)`, [projectId, JSON.stringify(check.criteria)]);
    return { success: true, message: 'Project auto-approved', project_id: projectId };
};

export const archiveCompletedProjects = async (batchId: number) => {
    const res = await pool.query(`UPDATE projects p SET review_state='Archived', updated_at=NOW() FROM groups g WHERE g.id=p.group_id AND g.batch_id=$1 AND p.status='approved' AND p.progress=100 AND p.review_state!='Archived' RETURNING p.id, p.title`, [batchId]);
    if (res.rows.length > 0) await pool.query(`INSERT INTO ai_audit_log (action, details) VALUES ('archive_projects', $1)`, [JSON.stringify({ batch_id: batchId, archived: res.rows })]);
    return { archived_count: res.rows.length, projects: res.rows };
};

export const getArchiveSummary = async (batchId: number) => {
    const res = await pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE review_state='Archived')::int AS archived, COUNT(*) FILTER (WHERE status='approved' AND review_state!='Archived')::int AS completed, COUNT(*) FILTER (WHERE status='pending')::int AS in_progress FROM projects p JOIN groups g ON g.id=p.group_id WHERE g.batch_id=$1`, [batchId]);
    return res.rows[0];
};
