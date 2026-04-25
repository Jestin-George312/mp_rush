-- ═══════════════════════════════════════════════════
-- AI Engine — Database Migration
-- Run AFTER backend/migration.sql
-- Safe to re-run (uses IF NOT EXISTS / ON CONFLICT)
-- ═══════════════════════════════════════════════════

-- 1. AI Alerts
CREATE TABLE IF NOT EXISTS ai_alerts (
    id          SERIAL PRIMARY KEY,
    target_role VARCHAR(30) NOT NULL,
    target_user INTEGER REFERENCES users(uid) ON DELETE CASCADE,
    alert_type  VARCHAR(50) NOT NULL,
    severity    VARCHAR(20) NOT NULL DEFAULT 'medium',
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    ref_type    VARCHAR(30),
    ref_id      INTEGER,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_user
    ON ai_alerts (target_user, is_read, created_at DESC);

-- 2. AI Predictions / Risk Scores
CREATE TABLE IF NOT EXISTS ai_predictions (
    id           SERIAL PRIMARY KEY,
    entity_type  VARCHAR(30) NOT NULL,
    entity_id    INTEGER NOT NULL,
    risk_score   NUMERIC(5,2) NOT NULL DEFAULT 0,
    risk_level   VARCHAR(20) NOT NULL DEFAULT 'healthy',
    factors      JSONB NOT NULL DEFAULT '{}',
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entity_type, entity_id)
);

-- 3. AI Audit Log
CREATE TABLE IF NOT EXISTS ai_audit_log (
    id           SERIAL PRIMARY KEY,
    action       VARCHAR(50) NOT NULL,
    entity_type  VARCHAR(30),
    entity_id    INTEGER,
    details      JSONB NOT NULL DEFAULT '{}',
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AI Config
CREATE TABLE IF NOT EXISTS ai_config (
    key        VARCHAR(100) PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default configuration
INSERT INTO ai_config (key, value) VALUES
    ('risk_thresholds', '{"healthy": 25, "warning": 50, "at_risk": 75}'),
    ('max_guide_load', '{"default": 8, "hard_cap": 10}'),
    ('auto_approve_rules', '{"min_progress": 100, "min_docs_approved": 3, "all_tasks_done": true}'),
    ('cron_intervals', '{"risk_scoring": "0 */6 * * *", "alerts": "0 8 * * *", "predictions": "0 0 * * *"}')
ON CONFLICT (key) DO NOTHING;
