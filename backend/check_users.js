const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const checkUsers = async () => {
    try {
        const res = await pool.query("SELECT uid, email, role FROM users WHERE role = 'student' ORDER BY uid");
        console.log('--- ALL STUDENTS ---');
        console.table(res.rows);

        const profiles = await pool.query("SELECT u_id, full_name FROM profiles");
        console.log('--- ALL PROFILES ---');
        // console.table(profiles.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
};

checkUsers();
