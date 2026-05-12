import pool from './config/db';

async function checkProject() {
  try {
    const res = await pool.query(`
      SELECT p.id, p.review_state 
      FROM projects p
      JOIN group_members gm ON p.group_id = gm.group_id
      WHERE gm.student_id = 7
    `);
    console.log('Project for student1:', res.rows);
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkProject();
