import fs from 'fs';
import path from 'path';
import pool from './src/config/db';

const runMigration = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf-8');
        console.log('Running migration...');
        await pool.query(sql);
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
        process.exit();
    }
};

runMigration();
