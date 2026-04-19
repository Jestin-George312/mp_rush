-- Migration: add missing profile columns and all new tables needed by the backend modules
-- Run this script once against your PostgreSQL database.
-- All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS to be safe to re-run.

-- ─────────────────────────────────
-- 1. Extend the profiles table
-- ─────────────────────────────────
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS phone      VARCHAR(20),
    ADD COLUMN IF NOT EXISTS bio        TEXT,
    ADD COLUMN IF NOT EXISTS location   VARCHAR(255);

-- ─────────────────────────────────
-- 2. Batches (academic year / cohort)
-- ─────────────────────────────────
CREATE TABLE IF NOT EXISTS batches (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,          -- e.g. "MCA 2025-26"
    coordinator_id INTEGER REFERENCES users(uid) ON DELETE SET NULL, 
    start_year  INTEGER NOT NULL,
    end_year    INTEGER NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────
-- 3. Groups (student project teams)
-- ─────────────────────────────────
CREATE TABLE IF NOT EXISTS groups (
    id           SERIAL PRIMARY KEY,
    group_name   VARCHAR(100) NOT NULL,
    batch_id     INTEGER REFERENCES batches(id) ON DELETE SET NULL,
    guide_id     INTEGER REFERENCES users(uid)  ON DELETE SET NULL,   -- assigned guide
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Which students belong to which group (many-to-many)
CREATE TABLE IF NOT EXISTS group_members (
    group_id   INTEGER NOT NULL REFERENCES groups(id)     ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(uid)     ON DELETE CASCADE,
    PRIMARY KEY (group_id, student_id)
);

-- ─────────────────────────────────
-- 4. Projects (submitted proposals)
-- ─────────────────────────────────
DROP TYPE IF EXISTS project_status CASCADE;
CREATE TYPE project_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS projects (
    id           SERIAL PRIMARY KEY,
    group_id     INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    domain       VARCHAR(100),
    description  TEXT,
    status       project_status NOT NULL DEFAULT 'pending',
    progress     INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    submitted_by INTEGER REFERENCES users(uid) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────
-- 5. Tasks
-- ─────────────────────────────────
DROP TYPE IF EXISTS task_status CASCADE;
CREATE TYPE task_status   AS ENUM ('todo', 'inprogress', 'done');
DROP TYPE IF EXISTS task_priority CASCADE;
CREATE TYPE task_priority AS ENUM ('High', 'Medium', 'Low');

CREATE TABLE IF NOT EXISTS tasks (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    priority     task_priority NOT NULL DEFAULT 'Medium',
    status       task_status   NOT NULL DEFAULT 'todo',
    deadline     DATE,
    assigned_to  INTEGER REFERENCES users(uid) ON DELETE SET NULL,
    created_by   INTEGER REFERENCES users(uid) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────
-- 6. Documents
-- ─────────────────────────────────
DROP TYPE IF EXISTS doc_type CASCADE;
CREATE TYPE doc_type   AS ENUM ('SRS', 'Reports', 'Diagrams', 'Other');
DROP TYPE IF EXISTS doc_status CASCADE;
CREATE TYPE doc_status AS ENUM ('Pending', 'Approved', 'Rejected');

CREATE TABLE IF NOT EXISTS documents (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by  INTEGER REFERENCES users(uid) ON DELETE SET NULL,
    name         VARCHAR(255) NOT NULL,
    file_path    VARCHAR(500) NOT NULL,
    type         doc_type   NOT NULL DEFAULT 'Other',
    status       doc_status NOT NULL DEFAULT 'Pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────
-- 7. Meetings
-- ─────────────────────────────────
DROP TYPE IF EXISTS meeting_status CASCADE;
CREATE TYPE meeting_status AS ENUM ('upcoming', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS meetings (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    group_id     INTEGER REFERENCES groups(id)   ON DELETE CASCADE,
    requested_by INTEGER REFERENCES users(uid)   ON DELETE SET NULL,
    title        VARCHAR(255) NOT NULL,
    date         DATE NOT NULL,
    time         VARCHAR(10) NOT NULL,             -- stored as "HH:MM" string
    duration     VARCHAR(50) DEFAULT '30 mins',
    agenda       TEXT,
    meet_link    VARCHAR(500),
    status       meeting_status NOT NULL DEFAULT 'upcoming',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────
-- 8. Evaluations
-- ─────────────────────────────────
CREATE TABLE IF NOT EXISTS rubrics (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    created_by   INTEGER REFERENCES users(uid) ON DELETE SET NULL,
    total_score  INTEGER NOT NULL DEFAULT 0,
    criteria     JSONB NOT NULL DEFAULT '[]',   -- [{description, maxMarks}]
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluation_scores (
    id           SERIAL PRIMARY KEY,
    rubric_id    INTEGER NOT NULL REFERENCES rubrics(id)  ON DELETE CASCADE,
    group_id     INTEGER NOT NULL REFERENCES groups(id)   ON DELETE CASCADE,
    evaluated_by INTEGER REFERENCES users(uid) ON DELETE SET NULL,
    scores       JSONB NOT NULL DEFAULT '{}',  -- {criterionIndex: score}
    total        INTEGER NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────
-- 9. Messages (Chat)
-- ─────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id           SERIAL PRIMARY KEY,
    group_id     INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    sender_id    INTEGER NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    text         TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_group ON messages (group_id, created_at);
-- ─────────────────────────────────
-- 10. Departments
-- ─────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Ownership / workflow extensions
ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS coordinator_id INTEGER REFERENCES users(uid) ON DELETE SET NULL;

ALTER TABLE batches
    ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE group_members
    ADD COLUMN IF NOT EXISTS is_leader BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS review_state VARCHAR(30) NOT NULL DEFAULT 'Pending',
    ADD COLUMN IF NOT EXISTS topic_feedback TEXT,
    ADD COLUMN IF NOT EXISTS topic_reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS github_repo VARCHAR(500);

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS feedback TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by INTEGER REFERENCES users(uid) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deadline_id INTEGER;

CREATE TABLE IF NOT EXISTS deadlines (
    id           SERIAL PRIMARY KEY,
    batch_id     INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    due_date     DATE NOT NULL,
    phase        VARCHAR(100) DEFAULT 'General',
    created_by   INTEGER REFERENCES users(uid) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deadlines_batch_due_date ON deadlines (batch_id, due_date);
