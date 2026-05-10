import pool from './src/config/db';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        console.log('Adding account_status to users table...');
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'pending'`);
        
        // Update any existing users that are not guides to 'active' just in case
        await pool.query(`UPDATE users SET account_status = 'active' WHERE role != 'guide' AND account_status = 'pending'`);
        
        console.log('✅ Added account_status column successfully.');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};
run();
