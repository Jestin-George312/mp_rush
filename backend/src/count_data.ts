import pool from './config/db';

async function countData() {
  const tables = [
    'projects',
    'groups',
    'group_members',
    'group_invitations',
    'users',
    'batches',
    'batch_faculty',
    'notifications'
  ];

  console.log('--- Database Record Counts ---');
  
  try {
    for (const table of tables) {
      const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`${table.padEnd(20)}: ${res.rows[0].count}`);
    }
  } catch (err: any) {
    console.error('Error counting data:', err.message);
  } finally {
    await pool.end();
  }
}

countData();
