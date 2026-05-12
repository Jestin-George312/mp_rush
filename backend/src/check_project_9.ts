import pool from './config/db';

async function checkProjectGuide() {
  try {
    const res = await pool.query(`
      SELECT p.id, p.title, g.id as group_id, g.guide_id, u.temp_guide_id 
      FROM projects p
      JOIN groups g ON p.group_id = g.id
      JOIN group_members gm ON g.id = gm.group_id
      JOIN users u ON gm.student_id = u.uid
      WHERE p.id = 9
    `);
    console.log('Project 9 Status:', res.rows);
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkProjectGuide();
