import pool from './config/db';

async function migrate() {
    try {
        await pool.query('ALTER TABLE documents ADD COLUMN IF NOT EXISTS marked_file_path TEXT');
        console.log('✅ marked_file_path column added to documents table');
    } catch (e: any) {
        console.error('❌ Migration failed:', e.message);
    } finally {
        await pool.end();
    }
}
migrate();
