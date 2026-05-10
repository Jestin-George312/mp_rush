import pool from './src/config/db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
    try {
        // Fix: add missing columns to users table
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS temp_guide_id INTEGER REFERENCES users(uid) ON DELETE SET NULL`);
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL`);
        console.log('✅ Missing columns added to users table.');

        // Fix: add missing columns to batches table
        await pool.query(`ALTER TABLE batches ADD COLUMN IF NOT EXISTS topic_submission_start TIMESTAMPTZ`);
        await pool.query(`ALTER TABLE batches ADD COLUMN IF NOT EXISTS topic_submission_end TIMESTAMPTZ`);
        await pool.query(`ALTER TABLE batches ADD COLUMN IF NOT EXISTS project_type_mode VARCHAR(20) NOT NULL DEFAULT 'mixed'`);
        console.log('✅ Missing columns added to batches table.');

        // Fix: add missing columns to rubrics table
        await pool.query(`ALTER TABLE rubrics ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE`);
        await pool.query(`ALTER TABLE rubrics ADD COLUMN IF NOT EXISTS deadline_id INTEGER REFERENCES deadlines(id) ON DELETE SET NULL`);
        console.log('✅ Missing columns added to rubrics table.');

        // Seed admin user
        const email = 'admin@test.apms';
        const password = 'pass123';
        const passwordHash = await bcrypt.hash(password, 10);

        const existing = await pool.query(`SELECT uid FROM users WHERE email = $1`, [email]);
        if (existing.rows.length > 0) {
            console.log('⚠️  Admin user already exists (uid:', existing.rows[0].uid, ')');
        } else {
            const res = await pool.query(
                `INSERT INTO users (email, password_hash, auth_provider, role) VALUES ($1, $2, 'local', 'admin') RETURNING uid`,
                [email, passwordHash]
            );
            const uid = res.rows[0].uid;
            await pool.query(
                `INSERT INTO profiles (u_id, full_name) VALUES ($1, $2) ON CONFLICT (u_id) DO NOTHING`,
                [uid, 'System Admin']
            );
            console.log('✅ Admin user created (uid:', uid, ')');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
};

seedAdmin();
