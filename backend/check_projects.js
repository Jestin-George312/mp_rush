require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432')
});

async function main() {
    const res = await pool.query('SELECT * FROM projects');
    console.log('=== PROJECTS ===');
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}

main().catch(e => { console.error(e); pool.end(); });
