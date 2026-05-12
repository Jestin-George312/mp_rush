import pool from './config/db';
async function run() {
  // Fix existing group - assign a guide from batch_faculty for batch 1
  const facultyRes = await pool.query(
    `SELECT f.faculty_id FROM batch_faculty f
     JOIN users u ON u.uid = f.faculty_id
     WHERE f.batch_id = 1 AND LOWER(u.account_status) = 'active'
     ORDER BY f.faculty_id`
  );
  console.log('Available faculty for batch 1:', facultyRes.rows);

  if (facultyRes.rows.length > 0) {
    // Use round-robin: group 10 is the first group, so assign first faculty
    const guideId = facultyRes.rows[0].faculty_id;
    
    // Set guide_id on the group
    await pool.query(`UPDATE groups SET guide_id = $1 WHERE id = 10`, [guideId]);
    console.log(`Set group 10 guide_id = ${guideId}`);

    // Set temp_guide_id on student1 (uid=7)
    await pool.query(`UPDATE users SET temp_guide_id = $1 WHERE uid = 7`, [guideId]);
    console.log(`Set student1 temp_guide_id = ${guideId}`);
  }

  // Verify
  const group = await pool.query(`SELECT id, group_name, guide_id FROM groups WHERE id = 10`);
  console.log('Group after fix:', group.rows[0]);
  
  const student = await pool.query(`SELECT uid, temp_guide_id FROM users WHERE uid = 7`);
  console.log('Student1 after fix:', student.rows[0]);

  const faculty = await pool.query(`SELECT uid, email FROM users WHERE uid = $1`, [group.rows[0]?.guide_id]);
  console.log('Assigned guide:', faculty.rows[0]);

  await pool.end();
}
run();
