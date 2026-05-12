import pool from '../../config/db';
import { getIO } from '../../socket';

export const getMessages = async (groupId: number) => {
    const result = await pool.query(
        `SELECT m.*, pr.full_name AS sender_name, u.role AS sender_role
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

    const msgId = result.rows[0].id;
    const msgRes = await pool.query(
        `SELECT m.*, pr.full_name AS sender_name, u.role AS sender_role
         FROM messages m
         JOIN users u ON m.sender_id = u.uid
         LEFT JOIN profiles pr ON m.sender_id = pr.u_id
         WHERE m.id = $1`,
        [msgId]
    );
    
    const message = msgRes.rows[0];

    // Broadcast via socket.io
    try {
        const io = getIO();
        io.to(`group_${groupId}`).emit('new_message', {
            id: message.id,
            group_id: message.group_id,
            groupId: message.group_id,
            sender_id: message.sender_id,
            text: message.text,
            attachmentUrl: message.attachment_url,
            attachment_url: message.attachment_url,
            senderName: message.sender_name || 'User',
            senderRole: message.sender_role?.toLowerCase(),
            createdAt: message.created_at,
            created_at: message.created_at
        });
    } catch (err) {
        console.error('Socket broadcast failed:', err);
    }

    return message;
};
