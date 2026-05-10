import pool from './src/config/db';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    try {
        // 1. Add batch_id to users (already done but safe)
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL`);

        // 2. Add 'completed' to project_status enum
        try { await pool.query(`ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'completed'`); } catch(e) { console.log('project_status completed already exists or skipped'); }

        // 3. Add 'Needs Revision' to doc_status enum
        try { await pool.query(`ALTER TYPE doc_status ADD VALUE IF NOT EXISTS 'Needs Revision'`); } catch(e) { console.log('doc_status Needs Revision already exists or skipped'); }

        // 4. Add minutes to meetings
        await pool.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS minutes TEXT`);

        // 5. Extension Requests
        await pool.query(`CREATE TABLE IF NOT EXISTS extension_requests (
            id SERIAL PRIMARY KEY, group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            deadline_id INTEGER NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
            requested_by INTEGER NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            reason TEXT NOT NULL, proposed_date DATE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            reviewed_by INTEGER REFERENCES users(uid) ON DELETE SET NULL,
            reviewed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);

        // 6. Group Deadline Overrides
        await pool.query(`CREATE TABLE IF NOT EXISTS group_deadline_overrides (
            id SERIAL PRIMARY KEY, group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            deadline_id INTEGER NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
            effective_date DATE NOT NULL,
            extension_request_id INTEGER REFERENCES extension_requests(id) ON DELETE SET NULL,
            UNIQUE(group_id, deadline_id)
        )`);

        // 7. Group Invitations
        await pool.query(`CREATE TABLE IF NOT EXISTS group_invitations (
            id SERIAL PRIMARY KEY, group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
            inviter_id INTEGER NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            invitee_id INTEGER NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(group_id, invitee_id)
        )`);

        // 8. Notifications
        await pool.query(`CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL, title VARCHAR(255) NOT NULL, message TEXT NOT NULL,
            ref_type VARCHAR(30), ref_id INTEGER, is_read BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC)`);

        // 9. Indexes
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_extension_requests_group ON extension_requests (group_id, deadline_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON group_invitations (invitee_id, status)`);

        console.log('✅ All high-priority tables created successfully.');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
};
run();
