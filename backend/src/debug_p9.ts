import pool from './config/db';

async function debug() {
  try {
    const p = await pool.query('SELECT * FROM projects WHERE id = 9');
    console.log('Project:', p.rows[0]);
    
    if (p.rows[0]) {
      const g = await pool.query('SELECT * FROM groups WHERE id = $1', [p.rows[0].group_id]);
      console.log('Group:', g.rows[0]);
      
      const u = await pool.query('SELECT uid, email, temp_guide_id FROM users WHERE uid = $1', [p.rows[0].submitted_by]);
      console.log('Student User:', u.rows[0]);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

debug();
