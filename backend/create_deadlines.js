require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432')
});

async function main() {
    const batchId = 1;
    const coordinatorId = 2;

    const deadlines = [
        { 
            title: 'Topic Submission', 
            description: 'Submit your project topic abstract for approval.', 
            due_date: '2026-05-05', 
            phase: 'Topic' 
        },
        { 
            title: 'SRS Document Submission', 
            description: 'Upload the Software Requirements Specification (SRS) PDF.', 
            due_date: '2026-05-15', 
            phase: 'SRS' 
        },
        { 
            title: 'System Design & Diagrams', 
            description: 'Upload architecture and database design diagrams.', 
            due_date: '2026-05-25', 
            phase: 'Diagrams' 
        },
        { 
            title: 'Final Project Report', 
            description: 'Upload the comprehensive final project report.', 
            due_date: '2026-06-15', 
            phase: 'Reports' 
        }
    ];

    for (const d of deadlines) {
        await pool.query(
            'INSERT INTO deadlines (batch_id, title, description, due_date, phase, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
            [batchId, d.title, d.description, d.due_date, d.phase, coordinatorId]
        );
    }

    console.log('Successfully created 4 deadlines for batch 2025-2027-regular');
    await pool.end();
}

main().catch(e => { console.error(e); pool.end(); });
