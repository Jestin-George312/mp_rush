import pool from './config/db';

async function listProjects() {
  try {
    const res = await pool.query('SELECT * FROM projects');
    console.log('--- Projects Table Data ---');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err: any) {
    console.error('Error fetching projects:', err.message);
  } finally {
    await pool.end();
  }
}

listProjects();
