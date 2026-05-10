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
    const groups = await pool.query('SELECT * FROM groups');
    console.log('=== GROUPS ===');
    console.log(JSON.stringify(groups.rows, null, 2));

    const members = await pool.query('SELECT * FROM group_members');
    console.log('\n=== GROUP MEMBERS ===');
    console.log(JSON.stringify(members.rows, null, 2));

    await pool.end();
}

main().catch(e => { console.error(e); pool.end(); });
