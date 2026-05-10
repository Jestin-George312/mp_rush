import pool from '../../config/db';
import bcrypt from 'bcrypt';

export const deleteCoordinator = async (coordinatorId: number) => {
    const result = await pool.query(
        `DELETE FROM users WHERE uid = $1 AND role = 'coordinator' RETURNING *`,
        [coordinatorId]
    );
    if (result.rows.length === 0) throw new Error('Coordinator not found');

    // Also unassign from any department
    await pool.query(`UPDATE departments SET coordinator_id = NULL WHERE coordinator_id = $1`, [coordinatorId]);

    return { deleted: true, id: coordinatorId };
};

export const getAllDepartments = async () => {
    const result = await pool.query(`
        SELECT d.*, p.full_name AS coordinator_name
        FROM departments d
        LEFT JOIN profiles p ON d.coordinator_id = p.u_id
        ORDER BY d.created_at DESC
    `);
    return result.rows;
};

export const createDepartment = async (name: string) => {
    const result = await pool.query(
        'INSERT INTO departments (name, coordinator_id) VALUES ($1, NULL) RETURNING *',
        [name]
    );
    return result.rows[0];
};

export const deleteDepartment = async (id: number) => {
    await pool.query('DELETE FROM departments WHERE id = $1', [id]);
};

// --- Coordinator Management ---

export const createCoordinator = async (data: { name: string; email: string; password_hash: string }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Create User
        const userResult = await client.query(
            `INSERT INTO users (email, password_hash, auth_provider, role) 
             VALUES ($1, $2, 'local', 'coordinator') 
             RETURNING uid, email, role`,
            [data.email, data.password_hash]
        );
        const user = userResult.rows[0];

        // 2. Create Profile
        await client.query(
            `INSERT INTO profiles (u_id, full_name) 
             VALUES ($1, $2)`,
            [user.uid, data.name]
        );

        await client.query('COMMIT');
        return user;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const listCoordinators = async () => {
    const query = `
        SELECT u.uid, u.email, u.role, p.full_name as name
        FROM users u
        LEFT JOIN profiles p ON u.uid = p.u_id
        WHERE LOWER(u.role::TEXT) = 'coordinator' 
    `;
    const result = await pool.query(query);
    return result.rows;
};

// --- Department Assignment ---

export const assignCoordinatorToDepartment = async (departmentId: number, coordinatorId: number | null) => {
    const result = await pool.query(
        `UPDATE departments SET coordinator_id = $1 WHERE id = $2 RETURNING *`,
        [coordinatorId, departmentId]
    );
    return result.rows[0];
};

export const listBatchesWithCoordinators = async () => {
    const query = `
        SELECT b.*, d.name AS department_name, u.email as coordinator_email, p.full_name as coordinator_name
        FROM batches b
        LEFT JOIN departments d ON b.department_id = d.id
        LEFT JOIN users u ON d.coordinator_id = u.uid
        LEFT JOIN profiles p ON u.uid = p.u_id
        ORDER BY b.start_year DESC
    `;
    const result = await pool.query(query);
    return result.rows;
};
