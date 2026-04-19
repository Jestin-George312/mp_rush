import pool from '../../config/db';
import { UPLOAD_URL_PREFIX } from '../../config/storage';

// ────────────────────────────────────────────────────────────
// GET /api/users/profile
// ────────────────────────────────────────────────────────────
/**
 * Fetch the authenticated user's combined profile.
 * Joins `users` and `profiles` tables.
 */
export const getUserProfile = async (userId: number) => {
    const query = `
        SELECT
            u.uid,
            u.email,
            u.role,
            u.auth_provider,
            p.full_name,
            p.profile_img,
            p.department,
            p.phone,
            p.bio,
            p.location
        FROM users u
        LEFT JOIN profiles p ON u.uid = p.u_id
        WHERE u.uid = $1 AND u.is_deleted = FALSE
    `;
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) throw new Error('User not found');
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// PATCH /api/users/profile
// ────────────────────────────────────────────────────────────
/**
 * Update editable profile fields.
 * Only updates the `profiles` table — email/role cannot be changed here.
 */
export const updateUserProfile = async (
    userId: number,
    fields: {
        full_name?: string;
        department?: string;
        phone?: string;
        bio?: string;
        location?: string;
    }
) => {
    const { full_name, department, phone, bio, location } = fields;

    const query = `
        UPDATE profiles
        SET
            full_name   = COALESCE($1, full_name),
            department  = COALESCE($2, department),
            phone       = COALESCE($3, phone),
            bio         = COALESCE($4, bio),
            location    = COALESCE($5, location)
        WHERE u_id = $6
        RETURNING *
    `;
    const result = await pool.query(query, [
        full_name ?? null,
        department ?? null,
        phone ?? null,
        bio ?? null,
        location ?? null,
        userId,
    ]);

    if (result.rows.length === 0) throw new Error('Profile not found');
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// POST /api/users/profile/photo
// ────────────────────────────────────────────────────────────
/**
 * Update the stored profile image path after a successful file upload.
 */
export const updateProfilePhoto = async (userId: number, filename: string) => {
    const imageUrl = `${UPLOAD_URL_PREFIX}/${filename}`;

    const result = await pool.query(
        'UPDATE profiles SET profile_img = $1 WHERE u_id = $2 RETURNING profile_img',
        [imageUrl, userId]
    );
    if (result.rows.length === 0) throw new Error('Profile not found');
    return result.rows[0];
};
