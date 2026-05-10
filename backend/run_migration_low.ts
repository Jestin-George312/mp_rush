import pool from './src/config/db';
import dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
    try {
        console.log('Running low-priority migrations...');

        // MF-18: oauth_id column
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);`);

        // DM-05: Remove redundant batches.coordinator_id
        await pool.query(`ALTER TABLE batches DROP COLUMN IF EXISTS coordinator_id;`);

        console.log('Low-priority migrations applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
