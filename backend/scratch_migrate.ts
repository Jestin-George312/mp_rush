import pool from './src/config/db';

async function migrate() {
    try {
        console.log('Adding unique constraint to documents table...');
        await pool.query('ALTER TABLE documents ADD CONSTRAINT unique_project_document_name UNIQUE (project_id, name);');
        console.log('Constraint added successfully.');
    } catch (err: any) {
        if (err.code === '42710') {
            console.log('Constraint already exists.');
        } else {
            console.error('Migration failed:', err.message);
        }
    } finally {
        process.exit();
    }
}

migrate();
