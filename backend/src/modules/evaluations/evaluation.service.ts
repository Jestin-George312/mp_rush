import pool from '../../config/db';
import * as notificationService from '../notifications/notification.service';

// ────────────────────────────────────────────────────────────
// POST /api/evaluations/rubrics
// ────────────────────────────────────────────────────────────
export const saveRubric = async (
    coordinatorId: number,
    data: { name: string; totalScore: number; criteria: any; batch_id: number; deadline_id?: number }
) => {
    const result = await pool.query(
        `INSERT INTO rubrics (created_by, name, total_score, criteria, batch_id, deadline_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [coordinatorId, data.name, data.totalScore, JSON.stringify(data.criteria), data.batch_id, data.deadline_id || null]
    );
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// GET /api/evaluations/rubrics
// ────────────────────────────────────────────────────────────
export const getRubrics = async (batchId?: number) => {
    let query = `
        SELECT r.*, p.full_name AS created_by_name
        FROM rubrics r
        LEFT JOIN profiles p ON r.created_by = p.u_id
    `;
    const params: any[] = [];
    
    if (batchId) {
        query += ` WHERE r.batch_id = $1 `;
        params.push(batchId);
    }
    
    query += ` ORDER BY r.created_at DESC`;
    
    const result = await pool.query(query, params);
    return result.rows;
};

// ────────────────────────────────────────────────────────────
// POST /api/evaluations/scores
// ────────────────────────────────────────────────────────────
export const submitScores = async (
    guideId: number,
    data: { rubric_id: number; group_id: number; scores: any; total: number; feedback?: string }
) => {
    const result = await pool.query(
        `INSERT INTO evaluation_scores (rubric_id, group_id, evaluated_by, scores, total, feedback)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (rubric_id, group_id)
         DO UPDATE SET scores = $4, total = $5, feedback = $6, evaluated_by = $3, evaluated_at = NOW()
         RETURNING *`,
        [data.rubric_id, data.group_id, guideId, JSON.stringify(data.scores), data.total, data.feedback || null]
    );

    // notify students
    await notificationService.notifyGroupMembers(
        data.group_id,
        'evaluation',
        'New Evaluation Score',
        `Your group received an evaluation score of ${data.total}. Feedback: ${data.feedback || 'None'}`,
        'evaluation',
        result.rows[0].id
    );

    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// GET /api/evaluations/scores?groupId=
// ────────────────────────────────────────────────────────────
export const getScores = async (groupId: number) => {
    const result = await pool.query(
        `SELECT s.*, r.name AS rubric_name, r.total_score AS max_score, p.full_name AS evaluator_name
         FROM evaluation_scores s
         JOIN rubrics r ON s.rubric_id = r.id
         LEFT JOIN profiles p ON s.evaluated_by = p.u_id
         WHERE s.group_id = $1
         ORDER BY s.created_at DESC`,
        [groupId]
    );
    return result.rows;
};
