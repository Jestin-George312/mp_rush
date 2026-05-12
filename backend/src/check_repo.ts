import pool from './config/db';

async function checkRepo() {
  try {
    const res = await pool.query(`SELECT id, title, github_repo FROM projects WHERE github_repo IS NOT NULL`);
    console.log('Projects with repos:', res.rows);
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkRepo();
