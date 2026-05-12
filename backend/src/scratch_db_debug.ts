import pool from './config/db';

async function run() {
    try {
        console.log("=== GROUPS ===");
        const groups = await pool.query("SELECT * FROM groups LIMIT 5");
        console.log(groups.rows);
        
        console.log("=== USERS (GUIDES) ===");
        const guides = await pool.query("SELECT uid, email, role FROM users WHERE role = 'guide' OR role = 'faculty' LIMIT 5");
        console.log(guides.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
