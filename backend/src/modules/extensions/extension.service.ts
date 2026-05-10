import pool from '../../config/db';

// ── Create extension request (student) ────────────────────────
export const createExtensionRequest = async (
    studentId: number,
    data: { deadline_id: number; reason: string; proposed_date: string }
) => {
    // Find the student's group
    const groupRes = await pool.query(
        `SELECT g.id FROM group_members gm JOIN groups g ON g.id = gm.group_id WHERE gm.student_id = $1 LIMIT 1`,
        [studentId]
    );
    if (groupRes.rows.length === 0) throw new Error('Student is not in any group');
    const groupId = groupRes.rows[0].id;

    // Check deadline exists
    const dlRes = await pool.query(`SELECT id, title FROM deadlines WHERE id = $1`, [data.deadline_id]);
    if (dlRes.rows.length === 0) throw new Error('Deadline not found');

    // Prevent duplicate pending requests
    const existing = await pool.query(
        `SELECT 1 FROM extension_requests WHERE group_id = $1 AND deadline_id = $2 AND status = 'pending' LIMIT 1`,
        [groupId, data.deadline_id]
    );
    if (existing.rows.length > 0) throw new Error('A pending extension request already exists for this deadline');

    const result = await pool.query(
        `INSERT INTO extension_requests (group_id, deadline_id, requested_by, reason, proposed_date)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [groupId, data.deadline_id, studentId, data.reason, data.proposed_date]
    );
    return result.rows[0];
};

// ── Review extension request (guide) ──────────────────────────
export const reviewExtensionRequest = async (
    guideId: number,
    requestId: number,
    action: 'approved' | 'rejected'
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verify guide owns this group
        const reqRes = await client.query(
            `SELECT er.*, g.guide_id FROM extension_requests er
             JOIN groups g ON g.id = er.group_id
             WHERE er.id = $1`,
            [requestId]
        );
        if (reqRes.rows.length === 0) throw new Error('Extension request not found');
        const req = reqRes.rows[0];
        if (req.guide_id !== guideId) throw new Error('Not authorized to review this request');
        if (req.status !== 'pending') throw new Error('Request has already been reviewed');

        // Update the request
        await client.query(
            `UPDATE extension_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3`,
            [action, guideId, requestId]
        );

        // If approved, create/update group deadline override
        if (action === 'approved') {
            await client.query(
                `INSERT INTO group_deadline_overrides (group_id, deadline_id, effective_date, extension_request_id)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (group_id, deadline_id)
                 DO UPDATE SET effective_date = $3, extension_request_id = $4`,
                [req.group_id, req.deadline_id, req.proposed_date, requestId]
            );
        }

        // Create notification for the student
        await client.query(
            `INSERT INTO notifications (user_id, type, title, message, ref_type, ref_id)
             VALUES ($1, 'extension', $2, $3, 'extension', $4)`,
            [
                req.requested_by,
                `Extension ${action}`,
                action === 'approved'
                    ? `Your extension request has been approved. New deadline: ${req.proposed_date}`
                    : `Your extension request has been rejected.`,
                requestId,
            ]
        );

        await client.query('COMMIT');

        // Return the updated request
        const updated = await client.query(`SELECT * FROM extension_requests WHERE id = $1`, [requestId]);
        return updated.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// ── Get extension requests for a group ────────────────────────
export const getExtensionRequests = async (userId: number, role: string) => {
    let query: string;
    let params: any[] = [];

    if (role === 'student') {
        query = `SELECT er.*, dl.title AS deadline_title, dl.due_date AS original_date,
                        p.full_name AS requested_by_name, rp.full_name AS reviewed_by_name
                 FROM extension_requests er
                 JOIN deadlines dl ON dl.id = er.deadline_id
                 LEFT JOIN profiles p ON p.u_id = er.requested_by
                 LEFT JOIN profiles rp ON rp.u_id = er.reviewed_by
                 JOIN group_members gm ON gm.group_id = er.group_id
                 WHERE gm.student_id = $1
                 ORDER BY er.created_at DESC`;
        params = [userId];
    } else if (role === 'guide') {
        query = `SELECT er.*, dl.title AS deadline_title, dl.due_date AS original_date,
                        g.group_name, p.full_name AS requested_by_name
                 FROM extension_requests er
                 JOIN deadlines dl ON dl.id = er.deadline_id
                 JOIN groups g ON g.id = er.group_id
                 LEFT JOIN profiles p ON p.u_id = er.requested_by
                 WHERE g.guide_id = $1
                 ORDER BY er.created_at DESC`;
        params = [userId];
    } else {
        query = `SELECT er.*, dl.title AS deadline_title, dl.due_date AS original_date,
                        g.group_name, p.full_name AS requested_by_name, rp.full_name AS reviewed_by_name
                 FROM extension_requests er
                 JOIN deadlines dl ON dl.id = er.deadline_id
                 JOIN groups g ON g.id = er.group_id
                 LEFT JOIN profiles p ON p.u_id = er.requested_by
                 LEFT JOIN profiles rp ON rp.u_id = er.reviewed_by
                 ORDER BY er.created_at DESC`;
    }

    const result = await pool.query(query, params);
    return result.rows;
};
