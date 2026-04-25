/**
 * AI Engine — Shared Scoring Utilities
 * Pure functions used across multiple services.
 */
import type { RiskLevel, RiskThresholds } from '../types/ai.types';

/**
 * Classify a numeric risk score into a risk level.
 */
export const classifyRisk = (score: number, thresholds: RiskThresholds): RiskLevel => {
    if (score < thresholds.healthy) return 'healthy';
    if (score < thresholds.warning) return 'warning';
    if (score < thresholds.at_risk) return 'at_risk';
    return 'critical';
};

/**
 * Clamp a value between min and max.
 */
export const clamp = (value: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, value));

/**
 * Calculate the number of days between two dates.
 */
export const daysBetween = (from: Date, to: Date): number => {
    const diffMs = to.getTime() - from.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Calculate a weighted sum from factors and their weights.
 */
export const weightedScore = (factors: Record<string, number>, weights: Record<string, number>): number => {
    let total = 0;
    for (const key of Object.keys(weights)) {
        total += (factors[key] || 0) * weights[key];
    }
    return clamp(total, 0, 100);
};
