import pool from '../../config/db';

// ────────────────────────────────────────────────────────────
// POST /api/meetings
// ────────────────────────────────────────────────────────────
export const createMeeting = async (
    requesterId: number,
    data: {
        title: string;
        date: string;
        time: string;
        agenda: string;
        project_id?: number | null;
        group_id?: number | null;
    }
) => {
    // Basic meeting request (status defaults to 'requested')
    const result = await pool.query(
        `INSERT INTO meetings (project_id, group_id, requested_by, title, date, time, agenda, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'requested')
         RETURNING *`,
        [data.project_id || null, data.group_id || null, requesterId, data.title, data.date, data.time, data.agenda]
    );
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// GET /api/meetings
// ────────────────────────────────────────────────────────────
export const getUserMeetings = async (userId: number, role: string) => {
    let query: string;
    let params: any[] = [];

    // Different logic based on roles - assuming 'student' means tied to their group.
    if (role === 'student') {
        query = `
            SELECT m.*, pr.full_name AS requester_name, g.group_name
            FROM meetings m
            JOIN group_members gm ON m.group_id = gm.group_id
            LEFT JOIN groups g ON m.group_id = g.id
            LEFT JOIN profiles pr ON pr.u_id = m.requested_by
            WHERE gm.student_id = $1
            ORDER BY m.date ASC, m.time ASC
        `;
        params = [userId];
    } else if (role === 'guide') {
        query = `
            SELECT m.*, pr.full_name AS requester_name, g.group_name
            FROM meetings m
            JOIN groups g ON m.group_id = g.id
            LEFT JOIN profiles pr ON pr.u_id = m.requested_by
            WHERE g.guide_id = $1
            ORDER BY m.date ASC, m.time ASC
        `;
        params = [userId];
    } else {
        // Coordinator sees all
        query = `
            SELECT m.*, pr.full_name AS requester_name, g.group_name
            FROM meetings m
            LEFT JOIN groups g ON m.group_id = g.id
            LEFT JOIN profiles pr ON pr.u_id = m.requested_by
            ORDER BY m.date ASC, m.time ASC
        `;
    }

    const result = await pool.query(query, params);
    return result.rows;
};

// ────────────────────────────────────────────────────────────
// PATCH /api/meetings/:id
// ────────────────────────────────────────────────────────────
export const updateMeeting = async (
    meetingId: number,
    data: {
        status?: 'requested' | 'upcoming' | 'completed' | 'cancelled';
        meet_link?: string;
        date?: string;
        time?: string;
        duration?: string;
        minutes?: string;
    }
) => {
    const result = await pool.query(
        `UPDATE meetings
         SET 
            status = COALESCE($1, status),
            meet_link = COALESCE($2, meet_link),
            date = COALESCE($3::date, date),
            time = COALESCE($4, time),
            duration = COALESCE($5, duration),
            minutes = COALESCE($6, minutes)
         WHERE id = $7
         RETURNING *`,
        [data.status ?? null, data.meet_link ?? null, data.date ?? null, data.time ?? null, data.duration ?? null, data.minutes ?? null, meetingId]
    );

    if (result.rows.length === 0) throw new Error('Meeting not found');
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// DELETE /api/meetings/:id
// ────────────────────────────────────────────────────────────
export const deleteMeeting = async (meetingId: number) => {
    const result = await pool.query(`DELETE FROM meetings WHERE id = $1 RETURNING id`, [meetingId]);
    if (result.rows.length === 0) throw new Error('Meeting not found');
    return { deleted: true, id: meetingId };
};
