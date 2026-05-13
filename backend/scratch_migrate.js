const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mp_one',
  password: 'root',
  port: 5432,
});

async function migrate() {
    try {
        console.log('Adding unique constraint to documents table...');
        await pool.query('ALTER TABLE documents ADD CONSTRAINT unique_project_document_name UNIQUE (project_id, name);');
        console.log('Constraint added successfully.');
    } catch (err) {
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
