import pool from './config/db';

async function listDeadlines() {
    try {
        const res = await pool.query("SELECT id, title, phase FROM deadlines");
        console.log('Deadlines:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

listDeadlines();
