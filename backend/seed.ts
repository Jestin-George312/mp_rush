import pool from './src/config/db';
import bcrypt from 'bcrypt';

const seed = async () => {
    try {
        console.log('🚀 Starting database seeding...');

        // 1. Clear existing data
        await pool.query('TRUNCATE users, profiles, departments, batches, groups, group_members, projects, tasks, documents, rubrics, evaluation_scores, messages, meetings CASCADE');
        console.log('🗑️ Database cleared.');

        const saltRounds = 10;
        const defaultPassword = await bcrypt.hash('password123', saltRounds);

        // 2. Create Users
        console.log('👤 Creating users...');
        
        // Admin
        const adminRes = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING uid",
            ['admin@sjcetpalai.ac.in', defaultPassword, 'admin']
        );
        const adminUid = adminRes.rows[0].uid;

        // Coordinators
        const sarahRes = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING uid",
            ['sarah@univ.edu', defaultPassword, 'coordinator']
        );
        const michaelRes = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING uid",
            ['michael@univ.edu', defaultPassword, 'coordinator']
        );
        const sarahUid = sarahRes.rows[0].uid;
        const michaelUid = michaelRes.rows[0].uid;

        // Guides
        const guide1Res = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING uid",
            ['guide1@sjcetpalai.ac.in', defaultPassword, 'guide']
        );
        const guide2Res = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING uid",
            ['guide2@sjcetpalai.ac.in', defaultPassword, 'guide']
        );
        const guide1Uid = guide1Res.rows[0].uid;
        const guide2Uid = guide2Res.rows[0].uid;

        // Students
        const studentEmails = [
            'student1@test.apms',
            'student2@test.apms',
            'student3@test.apms',
            'student4@test.apms',
            'student5@test.apms',
            'student6@test.apms'
        ];
        const studentUids: number[] = [];
        for (const email of studentEmails) {
            const res = await pool.query(
                "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING uid",
                [email, defaultPassword, 'student']
            );
            studentUids.push(res.rows[0].uid);
        }

        // 3. Create Profiles
        console.log('📄 Creating profiles...');
        const users = [
            { uid: adminUid, name: 'System Admin' },
            { uid: sarahUid, name: 'Dr. Sarah Johnson' },
            { uid: michaelUid, name: 'Prof. Michael Chen' },
            { uid: guide1Uid, name: 'Prof. Guide One' },
            { uid: guide2Uid, name: 'Prof. Guide Two' },
            { uid: studentUids[0], name: 'Student One' },
            { uid: studentUids[1], name: 'Student Two' },
            { uid: studentUids[2], name: 'Student Three' },
            { uid: studentUids[3], name: 'Student Four' },
            { uid: studentUids[4], name: 'Student Five' },
            { uid: studentUids[5], name: 'Student Six' },
        ];

        for (const user of users) {
            await pool.query(
                "INSERT INTO profiles (u_id, full_name, department) VALUES ($1, $2, $3)",
                [user.uid, user.name, 'Computer Applications']
            );
        }

        // 4. Create Department
        console.log('🏢 Creating department...');
        const deptRes = await pool.query(
            "INSERT INTO departments (name, coordinator_id) VALUES ($1, $2) RETURNING id",
            ['Computer Applications', sarahUid]
        );
        const deptId = deptRes.rows[0].id;

        // 5. Create Batch
        console.log('🎓 Creating batch...');
        const batchRes = await pool.query(
            "INSERT INTO batches (name, department_id, coordinator_id, start_year, end_year) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            ['MCA 2024-26', deptId, sarahUid, 2024, 2026]
        );
        const batchId = batchRes.rows[0].id;

        // 6. Create Groups
        console.log('👥 Creating groups...');
        // Group 1: Student 1 & 2
        const group1Res = await pool.query(
            "INSERT INTO groups (group_name, batch_id, guide_id) VALUES ($1, $2, $3) RETURNING id",
            ['ML Viz Team', batchId, guide1Uid]
        );
        const group1Id = group1Res.rows[0].id;

        // Group 2: Student 3 & 4
        const group2Res = await pool.query(
            "INSERT INTO groups (group_name, batch_id, guide_id) VALUES ($1, $2, $3) RETURNING id",
            ['Team Beta', batchId, guide2Uid]
        );
        const group2Id = group2Res.rows[0].id;

        // Group 3: Student 5 (Individual)
        const group3Res = await pool.query(
            "INSERT INTO groups (group_name, batch_id, guide_id) VALUES ($1, $2, $3) RETURNING id",
            ['Individual_Student5', batchId, guide1Uid]
        );
        const group3Id = group3Res.rows[0].id;

        // 7. Group Members
        console.log('🔗 Assigning group members...');
        await pool.query("INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)", [group1Id, studentUids[0], true]);
        await pool.query("INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)", [group1Id, studentUids[1], false]);
        
        await pool.query("INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)", [group2Id, studentUids[2], true]);
        await pool.query("INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)", [group2Id, studentUids[3], false]);

        await pool.query("INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)", [group3Id, studentUids[4], true]);

        // 8. Projects
        console.log('📂 Creating projects...');
        await pool.query(
            "INSERT INTO projects (group_id, title, domain, description, status, submitted_by) VALUES ($1, $2, $3, $4, $5, $6)",
            [group1Id, 'ML Vizualization', 'Machine Learning', 'ML Algorithm Vizualization project.', 'approved', studentUids[0]]
        );
        await pool.query(
            "INSERT INTO projects (group_id, title, domain, description, status, submitted_by) VALUES ($1, $2, $3, $4, $5, $6)",
            [group2Id, 'Blockchain for Supply Chain', 'Blockchain', 'Ensuring transparency in supply chains.', 'pending', studentUids[2]]
        );
        await pool.query(
            "INSERT INTO projects (group_id, title, domain, description, status, submitted_by) VALUES ($1, $2, $3, $4, $5, $6)",
            [group3Id, 'Smart Agriculture IoT', 'IoT', 'IoT based smart agriculture system.', 'pending', studentUids[4]]
        );


        console.log('✅ Seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await pool.end();
        process.exit();
    }
};

seed();
