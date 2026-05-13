import pool from '../backend/src/config/db';

async function seedRealData() {
    try {
        console.log('Connecting to db...');
        
        // 1. Find a guide
        const guideRes = await pool.query(`SELECT uid FROM users WHERE role = 'guide' LIMIT 1`);
        if (guideRes.rows.length === 0) {
            console.log('No guide found');
            process.exit(1);
        }
        const guideId = guideRes.rows[0].uid;
        console.log('Found guideId:', guideId);

        // 2. Find a batch assigned to this guide
        let batchRes = await pool.query(`SELECT batch_id FROM batch_faculty WHERE faculty_id = $1 LIMIT 1`, [guideId]);
        let batchId: number;
        if (batchRes.rows.length === 0) {
            // Check if any batch exists
            const anyBatch = await pool.query(`SELECT id FROM batches LIMIT 1`);
            if (anyBatch.rows.length === 0) {
                // Create a batch
                const newBatch = await pool.query(`
                    INSERT INTO batches (name, start_year, end_year, is_active)
                    VALUES ('MCA 2025-26', 2025, 2026, true)
                    RETURNING id
                `);
                batchId = newBatch.rows[0].id;
            } else {
                batchId = anyBatch.rows[0].id;
            }
            // Assign guide to batch
            await pool.query(`
                INSERT INTO batch_faculty (batch_id, faculty_id) 
                VALUES ($1, $2) 
                ON CONFLICT DO NOTHING
            `, [batchId, guideId]);
        } else {
            batchId = batchRes.rows[0].batch_id;
        }
        console.log('Using batchId:', batchId);

        // 3. Create deadlines for this batch
        const deadlineRes = await pool.query(`
            INSERT INTO deadlines (batch_id, title, description, due_date, phase)
            VALUES 
            ($1, 'System Architecture Document', 'Submit the detailed architecture design.', CURRENT_DATE + INTERVAL '10 days', 'Phase 1'),
            ($1, 'Mid-Term Review Presentation', 'Slides for the mid-term review.', CURRENT_DATE + INTERVAL '25 days', 'Phase 2')
            RETURNING id, title
        `, [batchId]);
        console.log('Inserted deadlines:', deadlineRes.rows);

        // 4. Ensure there is a group assigned to this guide in this batch
        let groupRes = await pool.query(`SELECT id, group_name FROM groups WHERE guide_id = $1 AND batch_id = $2 LIMIT 1`, [guideId, batchId]);
        let groupId: number;
        if (groupRes.rows.length === 0) {
            const newGroup = await pool.query(`
                INSERT INTO groups (group_name, batch_id, guide_id)
                VALUES ('Real Data Group A', $1, $2)
                RETURNING id, group_name
            `, [batchId, guideId]);
            groupId = newGroup.rows[0].id;
        } else {
            groupId = groupRes.rows[0].id;
        }
        console.log('Using groupId:', groupId);

        // 5. Find a student to be the requester (or create one)
        let studentRes = await pool.query(`
            SELECT u.uid FROM users u
            JOIN group_members gm ON gm.student_id = u.uid
            WHERE gm.group_id = $1 LIMIT 1
        `, [groupId]);
        
        let studentId: number;
        if (studentRes.rows.length === 0) {
            // Find any student
            const anyStudent = await pool.query(`SELECT uid FROM users WHERE role = 'student' LIMIT 1`);
            if (anyStudent.rows.length === 0) {
                console.log('No student found to associate with group');
                process.exit(1);
            }
            studentId = anyStudent.rows[0].uid;
            // Add student to group
            await pool.query(`
                INSERT INTO group_members (group_id, student_id, is_leader)
                VALUES ($1, $2, true)
                ON CONFLICT DO NOTHING
            `, [groupId, studentId]);
        } else {
            studentId = studentRes.rows[0].uid;
        }
        console.log('Using studentId:', studentId);

        // 6. Create an extension request for the first deadline
        const dlId = deadlineRes.rows[0].id;
        await pool.query(`
            INSERT INTO extension_requests (group_id, deadline_id, requested_by, reason, proposed_date, status)
            VALUES ($1, $2, $3, 'Need more time due to cloud deployment delays.', CURRENT_DATE + INTERVAL '15 days', 'pending')
        `, [groupId, dlId, studentId]);
        console.log('Inserted extension request for group');

        console.log('Data successfully inserted');
    } catch (err) {
        console.error('Error inserting data:', err);
    } finally {
        process.exit(0);
    }
}

seedRealData();
