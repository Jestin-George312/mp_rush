import bcrypt from 'bcrypt';
import pool from '../config/db';

async function seedUsers() {
    try {
        console.log('Connecting and starting seed...');
        const salt = await bcrypt.genSalt(10);
        const credentials: any[] = [];

        // Generate 10 students
        for (let i = 1; i <= 10; i++) {
            const email = `student${i}@test.com`;
            const password = `Student123!`;
            const passwordHash = await bcrypt.hash(password, salt);
            const role = 'student';
            const fullName = `Test Student ${i}`;
            const department = 'MCA';

            const userRes = await pool.query(
                `INSERT INTO users (email, password_hash, auth_provider, role) VALUES ($1, $2, 'local', $3) ON CONFLICT (email) DO NOTHING RETURNING uid`,
                [email, passwordHash, role]
            );

            if (userRes.rows.length > 0) {
                const uid = userRes.rows[0].uid;
                await pool.query(
                    `INSERT INTO profiles (u_id, full_name, department) VALUES ($1, $2, $3) ON CONFLICT (u_id) DO NOTHING`,
                    [uid, fullName, department]
                );
                credentials.push({ role, email, password, fullName });
            }
        }

        // Generate 2 guides
        for (let i = 1; i <= 2; i++) {
            const email = `guide${i}@test.com`;
            const password = `Guide123!`;
            const passwordHash = await bcrypt.hash(password, salt);
            const role = 'guide';
            const fullName = `Test Guide ${i}`;
            const department = 'MCA';

            const userRes = await pool.query(
                `INSERT INTO users (email, password_hash, auth_provider, role) VALUES ($1, $2, 'local', $3) ON CONFLICT (email) DO NOTHING RETURNING uid`,
                [email, passwordHash, role]
            );

            if (userRes.rows.length > 0) {
                const uid = userRes.rows[0].uid;
                await pool.query(
                    `INSERT INTO profiles (u_id, full_name, department) VALUES ($1, $2, $3) ON CONFLICT (u_id) DO NOTHING`,
                    [uid, fullName, department]
                );
                credentials.push({ role, email, password, fullName });
            }
        }

        // Generate 1 coordinator
        const coordEmail = `coordinator@test.com`;
        const coordPassword = `Coord123!`;
        const coordPasswordHash = await bcrypt.hash(coordPassword, salt);
        const coordRole = 'coordinator';
        const coordFullName = `Test Coordinator`;

        const userRes = await pool.query(
            `INSERT INTO users (email, password_hash, auth_provider, role) VALUES ($1, $2, 'local', $3) ON CONFLICT (email) DO NOTHING RETURNING uid`,
            [coordEmail, coordPasswordHash, coordRole]
        );

        if (userRes.rows.length > 0) {
            const uid = userRes.rows[0].uid;
            await pool.query(
                `INSERT INTO profiles (u_id, full_name, department) VALUES ($1, $2, $3) ON CONFLICT (u_id) DO NOTHING`,
                [uid, coordFullName, 'MCA']
            );
            credentials.push({ role: coordRole, email: coordEmail, password: coordPassword, fullName: coordFullName });
        }

        console.log('--- CREDENTIALS GENERATED ---');
        console.table(credentials);
        console.log('-----------------------------');
    } catch (err) {
        console.error('Error seeding users:', err);
    } finally {
        pool.end();
        console.log('Seeding finished.');
    }
}

seedUsers();
