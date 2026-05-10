import pool from '../../config/db';

export const getMessages = async (groupId: number) => {
    const result = await pool.query(
        `SELECT m.*, pr.full_name AS sender_name, pr.profile_img AS sender_picture, u.role AS sender_role
         FROM messages m
         JOIN users u ON m.sender_id = u.uid
         LEFT JOIN profiles pr ON m.sender_id = pr.u_id
         WHERE m.group_id = $1
         ORDER BY m.created_at ASC`,
        [groupId]
    );
    return result.rows;
};

export const sendMessage = async (groupId: number, senderId: number, text: string, attachmentUrl?: string) => {
    const result = await pool.query(
        `INSERT INTO messages (group_id, sender_id, text, attachment_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [groupId, senderId, text, attachmentUrl || null]
    );

    // Fetch the inserted message with profile details to return to the client
    const msgId = result.rows[0].id;
    const msgRes = await pool.query(
        `SELECT m.*, pr.full_name AS sender_name, pr.profile_img AS sender_picture, u.role AS sender_role
         FROM messages m
         JOIN users u ON m.sender_id = u.uid
         LEFT JOIN profiles pr ON m.sender_id = pr.u_id
         WHERE m.id = $1`,
        [msgId]
    );
    return msgRes.rows[0];
};
