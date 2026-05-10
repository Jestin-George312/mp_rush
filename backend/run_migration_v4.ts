import pool from './src/config/db';
import dotenv from 'dotenv';

dotenv.config();

const runMigrationV4 = async () => {
    try {
        console.log('Running V4 migrations (Rubrics & Evaluation Criteria)...');

        // 1. Update rubrics table
        await pool.query(`
            ALTER TABLE rubrics 
            ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
            ADD COLUMN IF NOT EXISTS deadline_id INTEGER REFERENCES deadlines(id) ON DELETE SET NULL;
        `);

        console.log('V4 Migrations applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('V4 Migration failed:', err);
        process.exit(1);
    }
};

runMigrationV4();
