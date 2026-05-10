import pool from './src/config/db';
import dotenv from 'dotenv';

dotenv.config();

const runMigrationV3 = async () => {
    try {
        console.log('Running V3 migrations (Submission Window & Project Modes)...');

        // 1. Update batches table
        await pool.query(`
            ALTER TABLE batches 
            ADD COLUMN IF NOT EXISTS topic_submission_start TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS topic_submission_end TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS project_type_mode VARCHAR(20) NOT NULL DEFAULT 'mixed';
        `);

        // 2. Update users table for temporary guide allocation
        await pool.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS temp_guide_id INTEGER REFERENCES users(uid) ON DELETE SET NULL;
        `);

        console.log('V3 Migrations applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('V3 Migration failed:', err);
        process.exit(1);
    }
};

runMigrationV3();
