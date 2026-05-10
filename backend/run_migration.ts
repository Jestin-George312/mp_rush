import pool from './src/config/db';
import dotenv from 'dotenv';

dotenv.config();

const runMigration = async () => {
    try {
        console.log('Running high-priority migrations...');

        // 1. Add batch_id to users
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL;`);
        
        // 2. Add 'completed' to project_status enum (catch if already exists)
        try {
            await pool.query(`ALTER TYPE project_status ADD VALUE 'completed';`);
        } catch(e) { if (!String(e).includes('already exists')) throw e; }

        // 3. Add 'Needs Revision' to doc_status enum
        try {
            await pool.query(`ALTER TYPE doc_status ADD VALUE 'Needs Revision';`);
        } catch(e) { if (!String(e).includes('already exists')) throw e; }

        // 4. Add minutes to meetings
        await pool.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS minutes TEXT;`);

        // 5. Create new tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS extension_requests (
                id             SERIAL       PRIMARY KEY,
                group_id       INTEGER      NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                deadline_id    INTEGER      NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
                requested_by   INTEGER      NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
                reason         TEXT         NOT NULL,
                proposed_date  DATE         NOT NULL,
                status         VARCHAR(20)  NOT NULL DEFAULT 'pending',
                reviewed_by    INTEGER      REFERENCES users(uid) ON DELETE SET NULL,
                reviewed_at    TIMESTAMPTZ,
                created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS group_deadline_overrides (
                id                    SERIAL    PRIMARY KEY,
                group_id              INTEGER   NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                deadline_id           INTEGER   NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
                effective_date        DATE      NOT NULL,
                extension_request_id  INTEGER   REFERENCES extension_requests(id) ON DELETE SET NULL,
                UNIQUE(group_id, deadline_id)
            );

            CREATE TABLE IF NOT EXISTS group_invitations (
                id          SERIAL       PRIMARY KEY,
                group_id    INTEGER      NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
                inviter_id  INTEGER      NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
                invitee_id  INTEGER      NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
                status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
                created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                UNIQUE(group_id, invitee_id)
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id          SERIAL       PRIMARY KEY,
                user_id     INTEGER      NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
                type        VARCHAR(50)  NOT NULL,
                title       VARCHAR(255) NOT NULL,
                message     TEXT         NOT NULL,
                ref_type    VARCHAR(30),
                ref_id      INTEGER,
                is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
                created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_extension_requests_group ON extension_requests (group_id, deadline_id);
            CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON group_invitations (invitee_id, status);
        `);

        console.log('Migrations applied successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
