const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const initTopics = async () => {
    try {
        console.log('🚀 Initializing topics...');

        // Clear existing groups and projects to start fresh as per request
        await pool.query('DELETE FROM group_members');
        await pool.query('DELETE FROM projects');
        await pool.query('DELETE FROM groups');
        
        const studentsRes = await pool.query("SELECT uid, email FROM users WHERE role = 'student' ORDER BY uid");
        const students = studentsRes.rows;
        
        const batchRes = await pool.query("SELECT id FROM batches LIMIT 1");
        if (batchRes.rows.length === 0) {
            console.error('No batch found. Please run seed first.');
            return;
        }
        const batchId = batchRes.rows[0].id;

        // 1. Student 1 and 2 as a group
        const s1 = students.find(s => s.email.includes('student1'));
        const s2 = students.find(s => s.email.includes('student2'));
        
        if (s1 && s2) {
            const group1Res = await pool.query(
                "INSERT INTO groups (group_name, batch_id) VALUES ($1, $2) RETURNING id",
                ['ML Viz Team', batchId]
            );
            const g1Id = group1Res.rows[0].id;
            await pool.query("INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)", [g1Id, s1.uid, true]);
            await pool.query("INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)", [g1Id, s2.uid, false]);
            
            await pool.query(
                "INSERT INTO projects (group_id, title, description, status, submitted_by) VALUES ($1, $2, $3, $4, $5)",
                [g1Id, 'ML Vizualization', 'Machine Learning Algorithms Visualization project.', 'pending', s1.uid]
            );
            console.log('✅ Created group for Student 1 & 2: ML Vizualization');
        }

        // 2. Student 3 and 4 as a group
        const s3 = students.find(s => s.email.includes('student3'));
        const s4 = students.find(s => s.email.includes('student4'));
        
        if (s3 && s4) {
            const group2Res = await pool.query(
                "INSERT INTO groups (group_name, batch_id) VALUES ($1, $2) RETURNING id",
                ['Team Beta', batchId]
            );
            const g2Id = group2Res.rows[0].id;
            await pool.query("INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)", [g2Id, s3.uid, true]);
            await pool.query("INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)", [g2Id, s4.uid, false]);
            
            await pool.query(
                "INSERT INTO projects (group_id, title, description, status, submitted_by) VALUES ($1, $2, $3, $4, $5)",
                [g2Id, 'Autonomous Drone Navigation', 'Research and implementation of drone navigation systems.', 'pending', s3.uid]
            );
            console.log('✅ Created group for Student 3 & 4');
        }

        // 3. Remaining students as individual
        const groupedUids = [s1?.uid, s2?.uid, s3?.uid, s4?.uid];
        const remainingStudents = students.filter(s => !groupedUids.includes(s.uid));

        for (const student of remainingStudents) {
            const groupName = `Individual_${student.email.split('@')[0]}`;
            const groupRes = await pool.query(
                "INSERT INTO groups (group_name, batch_id) VALUES ($1, $2) RETURNING id",
                [groupName, batchId]
            );
            const gId = groupRes.rows[0].id;
            await pool.query("INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)", [gId, student.uid, true]);
            
            await pool.query(
                "INSERT INTO projects (group_id, title, description, status, submitted_by) VALUES ($1, $2, $3, $4, $5)",
                [gId, `Project of ${student.email.split('@')[0]}`, 'Individual project submission.', 'pending', student.uid]
            );
            console.log(`✅ Created individual group for ${student.email}`);
        }

        console.log('🎉 All topics initialized successfully!');
    } catch (error) {
        console.error('❌ Failed to initialize topics:', error);
    } finally {
        await pool.end();
    }
};

initTopics();
