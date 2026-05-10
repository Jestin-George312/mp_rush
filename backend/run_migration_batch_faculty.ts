import pool from './src/config/db';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        console.log('Creating batch_faculty table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS batch_faculty (
                batch_id INT REFERENCES batches(id) ON DELETE CASCADE,
                faculty_id INT REFERENCES users(uid) ON DELETE CASCADE,
                PRIMARY KEY (batch_id, faculty_id)
            )
        `);
        console.log('✅ batch_faculty table created successfully.');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};
run();
