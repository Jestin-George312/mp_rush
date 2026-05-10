import pool from './src/config/db';

const checkCoordinators = async () => {
    try {
        const res = await pool.query("SELECT uid, email, role, is_deleted FROM users");
        console.log('--- ALL USERS ---');
        console.table(res.rows);

        const profiles = await pool.query("SELECT u_id, full_name FROM profiles");
        console.log('--- ALL PROFILES ---');
        console.table(profiles.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
};

checkCoordinators();
