import pool from '../../config/db';

// ────────────────────────────────────────────────────────────
// POST /api/evaluations/rubrics
// ────────────────────────────────────────────────────────────
export const saveRubric = async (
    coordinatorId: number,
    data: {
        name: string;
        totalScore: number;
        criteria: any[];
    }
) => {
    const result = await pool.query(
        `INSERT INTO rubrics (name, created_by, total_score, criteria)
         VALUES ($1, $2, $3, $4::jsonb)
         RETURNING *`,
        [data.name, coordinatorId, data.totalScore, JSON.stringify(data.criteria)]
    );
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// GET /api/evaluations/rubrics
// ────────────────────────────────────────────────────────────
export const getRubrics = async () => {
    const result = await pool.query(
        `SELECT r.*, p.full_name AS created_by_name
         FROM rubrics r
         LEFT JOIN profiles p ON r.created_by = p.u_id
         ORDER BY r.created_at DESC`
    );
    return result.rows;
};

// ────────────────────────────────────────────────────────────
// POST /api/evaluations/scores
// ────────────────────────────────────────────────────────────
export const submitScores = async (
    evaluatorId: number,
    data: {
        rubric_id: number;
        group_id: number;
        scores: any;
        total: number;
    }
) => {
    const result = await pool.query(
        `INSERT INTO evaluation_scores (rubric_id, group_id, evaluated_by, scores, total)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         RETURNING *`,
        [data.rubric_id, data.group_id, evaluatorId, JSON.stringify(data.scores), data.total]
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
