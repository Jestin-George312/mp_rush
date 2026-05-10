-- ═══════════════════════════════════════════════════════════════
-- APMS High-Priority Migration
-- Run AFTER backend/migration.sql AND ai-py/migration.sql
-- Safe to re-run (uses IF NOT EXISTS / DO $$ guards)
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Add batch_id to users table (MF-08 / DM-01) ──────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='batch_id') THEN
        ALTER TABLE users ADD COLUMN batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ─── 2. Add 'completed' to project_status enum (DM-02 / MF-17) ──
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'project_status')) THEN
        ALTER TYPE project_status ADD VALUE 'completed';
    END IF;
END $$;

-- ─── 3. Add 'Needs Revision' to doc_status enum (II-02) ──────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Needs Revision' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'doc_status')) THEN
        ALTER TYPE doc_status ADD VALUE 'Needs Revision';
    END IF;
END $$;

-- ─── 4. Add minutes column to meetings (MF-05) ───────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetings' AND column_name='minutes') THEN
        ALTER TABLE meetings ADD COLUMN minutes TEXT;
    END IF;
END $$;

-- ─── 5. Extension Requests table (MF-03) ─────────────────────
CREATE TABLE IF NOT EXISTS extension_requests (
    id             SERIAL       PRIMARY KEY,
    group_id       INTEGER      NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    deadline_id    INTEGER      NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
    requested_by   INTEGER      NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    reason         TEXT         NOT NULL,
    proposed_date  DATE         NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
    reviewed_by    INTEGER      REFERENCES users(uid) ON DELETE SET NULL,
    reviewed_at    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── 6. Group Deadline Overrides (MF-03) ─────────────────────
CREATE TABLE IF NOT EXISTS group_deadline_overrides (
    id                    SERIAL    PRIMARY KEY,
    group_id              INTEGER   NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    deadline_id           INTEGER   NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
    effective_date        DATE      NOT NULL,
    extension_request_id  INTEGER   REFERENCES extension_requests(id) ON DELETE SET NULL,
    UNIQUE(group_id, deadline_id)
);

-- ─── 7. Group Invitations table (MF-04) ──────────────────────
CREATE TABLE IF NOT EXISTS group_invitations (
    id          SERIAL       PRIMARY KEY,
    group_id    INTEGER      NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    inviter_id  INTEGER      NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    invitee_id  INTEGER      NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending',   -- pending | accepted | declined
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, invitee_id)
);

-- ─── 8. Notifications table (MF-07) ──────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id          SERIAL       PRIMARY KEY,
    user_id     INTEGER      NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    type        VARCHAR(50)  NOT NULL,  -- topic_reviewed | doc_reviewed | evaluation | invitation | extension | general
    title       VARCHAR(255) NOT NULL,
    message     TEXT         NOT NULL,
    ref_type    VARCHAR(30),            -- project | document | group | evaluation | extension
    ref_id      INTEGER,
    is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);

-- ─── 9. Indexes for new tables ───────────────────────────────
CREATE INDEX IF NOT EXISTS idx_extension_requests_group ON extension_requests (group_id, deadline_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON group_invitations (invitee_id, status);
