/**
 * AI Engine — Configurable Thresholds
 * Loaded from the `ai_config` table at startup and cached.
 * Falls back to defaults if the table is empty.
 */
import pool from '../config/db';
import type { RiskThresholds, MaxGuideLoad, AutoApproveRules } from '../types/ai.types';

// ── Defaults ──────────────────────────────────────────────
const DEFAULTS = {
    risk_thresholds: { healthy: 25, warning: 50, at_risk: 75 } as RiskThresholds,
    max_guide_load: { default: 8, hard_cap: 10 } as MaxGuideLoad,
    auto_approve_rules: { min_progress: 100, min_docs_approved: 3, all_tasks_done: true } as AutoApproveRules,
    cron_intervals: { risk_scoring: '0 */6 * * *', alerts: '0 8 * * *', predictions: '0 0 * * *' },
};

// ── In-memory cache ───────────────────────────────────────
let configCache: Record<string, any> = { ...DEFAULTS };

/**
 * Load all config keys from `ai_config` into memory.
 */
export const loadConfig = async (): Promise<void> => {
    try {
        const res = await pool.query('SELECT key, value FROM ai_config');
        for (const row of res.rows) {
            configCache[row.key] = row.value;
        }
        console.log('🤖 AI config loaded from database');
    } catch {
        console.warn('⚠️  ai_config table not found, using defaults');
    }
};

export const getRiskThresholds = (): RiskThresholds => configCache.risk_thresholds;
export const getMaxGuideLoad = (): MaxGuideLoad => configCache.max_guide_load;
export const getAutoApproveRules = (): AutoApproveRules => configCache.auto_approve_rules;
export const getCronIntervals = () => configCache.cron_intervals;

/**
 * Update a single config key in both DB and cache.
 */
export const updateConfig = async (key: string, value: any): Promise<void> => {
    await pool.query(
        `INSERT INTO ai_config (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, JSON.stringify(value)]
    );
    configCache[key] = value;
};

export const getAllConfig = () => ({ ...configCache });
