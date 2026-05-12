import pool from './config/db';

async function fixData() {
  try {
    await pool.query("UPDATE projects SET domain = 'ML & Data Science', description = 'wewefwef' WHERE id = 9");
    console.log('Fixed existing project id 9 data');
  } catch (err: any) {
    console.error('Error fixing data:', err.message);
  } finally {
    await pool.end();
  }
}

fixData();
