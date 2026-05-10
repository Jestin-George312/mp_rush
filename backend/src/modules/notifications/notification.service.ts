import pool from '../../config/db';

// ── Create a notification ─────────────────────────────────────
export const createNotification = async (data: {
    user_id: number;
    type: string;
    title: string;
    message: string;
    ref_type?: string;
    ref_id?: number;
}) => {
    const result = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, ref_type, ref_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [data.user_id, data.type, data.title, data.message, data.ref_type || null, data.ref_id || null]
    );
    return result.rows[0];
};

// ── Bulk-create notifications for group members ───────────────
export const notifyGroupMembers = async (
    groupId: number,
    type: string,
    title: string,
    message: string,
    refType?: string,
    refId?: number
) => {
    const members = await pool.query(
        `SELECT student_id FROM group_members WHERE group_id = $1`,
        [groupId]
    );
    const notifications = [];
    for (const m of members.rows) {
        const n = await createNotification({
            user_id: m.student_id,
            type,
            title,
            message,
            ref_type: refType,
            ref_id: refId,
        });
        notifications.push(n);
    }
    return notifications;
};

// ── Get user's notifications ──────────────────────────────────
export const getUserNotifications = async (userId: number, unreadOnly: boolean = false) => {
    const filter = unreadOnly ? 'AND is_read = FALSE' : '';
    const result = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = $1 ${filter}
         ORDER BY created_at DESC
         LIMIT 100`,
        [userId]
    );
    return result.rows;
};

// ── Get unread count ──────────────────────────────────────────
export const getUnreadCount = async (userId: number) => {
    const result = await pool.query(
        `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
    );
    return result.rows[0]?.count || 0;
};

// ── Mark single notification as read ──────────────────────────
export const markAsRead = async (notificationId: number, userId: number) => {
    await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
        [notificationId, userId]
    );
};

// ── Mark all as read ──────────────────────────────────────────
export const markAllAsRead = async (userId: number) => {
    await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
        [userId]
    );
};
