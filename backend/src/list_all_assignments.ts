import pool from './config/db';

async function listAllStudentsTempFaculty() {
  try {
    const res = await pool.query(
      `SELECT 
         u.uid AS student_id, 
         u.email AS student_email, 
         p.full_name AS student_name,
         u.temp_guide_id,
         f.email AS faculty_email,
         fp.full_name AS faculty_name
       FROM users u 
       LEFT JOIN profiles p ON u.uid = p.u_id 
       LEFT JOIN users f ON u.temp_guide_id = f.uid
       LEFT JOIN profiles fp ON f.uid = fp.u_id
       WHERE u.role = 'student'
       ORDER BY u.uid`
    );

    console.log('--- Student to Temporary Faculty Assignments ---');
    console.table(res.rows.map(row => ({
      'Student': row.student_name || row.student_email,
      'Temp Faculty': row.faculty_name || row.faculty_email || 'Not Assigned'
    })));

  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

listAllStudentsTempFaculty();
