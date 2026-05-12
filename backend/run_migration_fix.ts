import pool from './src/config/db';
import dotenv from 'dotenv';
dotenv.config();

const fixSchema = async () => {
    try {
        console.log('🔧 Running schema fix migration...\n');

        // 1. Add missing Google Drive columns to documents
        console.log('1. Adding drive_file_id and drive_link to documents...');
        await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS drive_file_id VARCHAR(255);`);
        await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS drive_link VARCHAR(500);`);
        console.log('   ✅ Done');

        // 2. Add missing attachment_url to messages
        console.log('2. Adding attachment_url to messages...');
        await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500);`);
        console.log('   ✅ Done');

        // 3. Add missing document versioning columns
        console.log('3. Adding parent_doc_id and version to documents...');
        await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_doc_id INTEGER REFERENCES documents(id);`);
        await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;`);
        console.log('   ✅ Done');

        // 4. Drop duplicate FK constraint on users.batch_id (if it exists)
        console.log('4. Cleaning up duplicate users.batch_id FK...');
        try {
            await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_batch_id_fkey1;`);
            console.log('   ✅ Dropped duplicate constraint');
        } catch (e: any) {
            console.log('   ⚠️ Skipped:', e.message);
        }

        console.log('\n✅ All schema fixes applied successfully!');

        // Verify the schema
        console.log('\n--- Verification ---');
        const docCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'documents' 
            ORDER BY ordinal_position
        `);
        console.log('Documents columns:', docCols.rows.map(r => r.column_name));

        const msgCols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'messages' 
            ORDER BY ordinal_position
        `);
        console.log('Messages columns:', msgCols.rows.map(r => r.column_name));

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
};

fixSchema();
