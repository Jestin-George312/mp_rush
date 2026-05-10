import pool from './src/config/db';
import dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
    try {
        console.log('Running medium-priority migrations...');

        // MF-09: Document Versioning
        await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_doc_id INTEGER REFERENCES documents(id);`);
        await pool.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;`);

        // MF-10: Document Type Enum - since we can't easily alter enum values safely, 
        // we just add the new ones. The old ones will remain but can be deprecated.
        const newTypes = ['Proposal', 'Review-1', 'Review-2', 'Final Report', 'Presentation'];
        for (const type of newTypes) {
            try {
                await pool.query(`ALTER TYPE doc_type ADD VALUE '${type}';`);
            } catch(e) { if (!String(e).includes('already exists')) throw e; }
        }

        // MF-11: Rubrics Linked to Deadlines
        await pool.query(`ALTER TABLE rubrics ADD COLUMN IF NOT EXISTS deadline_id INTEGER REFERENCES deadlines(id);`);

        // MF-12: Evaluation Feedback
        await pool.query(`ALTER TABLE evaluation_scores ADD COLUMN IF NOT EXISTS feedback TEXT;`);

        // MF-13: File Sharing in Chat
        await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500);`);

        // MF-14: Soft Delete for Admin
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;`);

        // II-07: Meeting Request Flow
        try {
            await pool.query(`ALTER TYPE meeting_status ADD VALUE 'requested';`);
        } catch(e) { if (!String(e).includes('already exists')) throw e; }

        // DM-03: Deadlines max_score and criteria
        await pool.query(`ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS max_score INTEGER;`);
        await pool.query(`ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '[]';`);

        console.log('Medium-priority migrations applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
