import pool from './config/db';

async function findTempFaculty() {
  try {
    const studentRes = await pool.query(
      `SELECT u.uid, u.email, u.temp_guide_id, p.full_name 
       FROM users u 
       LEFT JOIN profiles p ON u.uid = p.u_id 
       WHERE u.email = 'student1@test.apms'`
    );

    if (studentRes.rows.length === 0) {
      console.log('Student1 not found.');
      return;
    }

    const student = studentRes.rows[0];
    console.log(`Student: ${student.full_name || student.email} (ID: ${student.uid})`);

    if (!student.temp_guide_id) {
      console.log('No temporary faculty assigned.');
    } else {
      const facultyRes = await pool.query(
        `SELECT u.uid, u.email, p.full_name 
         FROM users u 
         LEFT JOIN profiles p ON u.uid = p.u_id 
         WHERE u.uid = $1`,
        [student.temp_guide_id]
      );
      
      const faculty = facultyRes.rows[0];
      console.log(`Temporary Faculty: ${faculty.full_name || faculty.email} (ID: ${faculty.uid})`);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

findTempFaculty();
