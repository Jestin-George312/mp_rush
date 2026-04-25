/**
 * F1 — Guide Allocation & Workload Balancing
 *
 * Suggests optimal guide assignments for unassigned student groups
 * using a weighted scoring system that considers:
 *   - Available capacity (40%)
 *   - Domain match (30%)
 *   - Batch familiarity (20%)
 *   - Past supervision history (10%)
 */
import pool from '../config/db';
import { getMaxGuideLoad } from '../engine/thresholds';
import type { AllocationResult, GuideSuggestion } from '../types/ai.types';

// ── Get suggestions for all unassigned groups in a batch ──
export const getSuggestedAllocations = async (batchId: number): Promise<AllocationResult[]> => {
    const loadConfig = getMaxGuideLoad();

    // 1. Get unassigned groups
    const groupsRes = await pool.query(`
        SELECT g.id, g.group_name, p.domain
        FROM groups g
        LEFT JOIN projects p ON p.group_id = g.id
        WHERE g.batch_id = $1 AND g.guide_id IS NULL
        ORDER BY g.group_name
    `, [batchId]);

    if (groupsRes.rows.length === 0) return [];

    // 2. Get all available guides with their current loads
    const guidesRes = await pool.query(`
        SELECT u.uid AS guide_id, pr.full_name AS guide_name,
               COALESCE(pr.bio, '') AS specialization,
               COUNT(g.id)::int AS current_load
        FROM users u
        LEFT JOIN profiles pr ON pr.u_id = u.uid
        LEFT JOIN groups g ON g.guide_id = u.uid
        WHERE u.role = 'guide' AND u.is_deleted = FALSE
        GROUP BY u.uid, pr.full_name, pr.bio
        HAVING COUNT(g.id) < $1
        ORDER BY COUNT(g.id) ASC
    `, [loadConfig.hard_cap]);

    const guides = guidesRes.rows;

    // 3. For each guide, get batch familiarity info
    const batchGuideRes = await pool.query(`
        SELECT DISTINCT g.guide_id
        FROM groups g WHERE g.batch_id = $1 AND g.guide_id IS NOT NULL
    `, [batchId]);
    const batchFamiliarGuides = new Set(batchGuideRes.rows.map((r: any) => r.guide_id));

    // 4. Score each guide for each unassigned group
    const results: AllocationResult[] = [];

    for (const group of groupsRes.rows) {
        const suggestions: GuideSuggestion[] = [];

        for (const guide of guides) {
            const reasons: string[] = [];
            let score = 0;

            // Capacity score (weight: 40)
            const capacityScore = ((loadConfig.hard_cap - guide.current_load) / loadConfig.hard_cap) * 40;
            score += capacityScore;
            if (guide.current_load < loadConfig.default) {
                reasons.push(`Has capacity (${guide.current_load}/${loadConfig.hard_cap} groups)`);
            }

            // Domain match (weight: 30)
            if (group.domain && guide.specialization) {
                const domainLower = group.domain.toLowerCase();
                const specLower = guide.specialization.toLowerCase();
                if (specLower.includes(domainLower) || domainLower.includes(specLower)) {
                    score += 30;
                    reasons.push(`Domain match: "${group.domain}"`);
                }
            }

            // Batch familiarity (weight: 20)
            if (batchFamiliarGuides.has(guide.guide_id)) {
                score += 20;
                reasons.push('Already supervises groups in this batch');
            }

            // History bonus (weight: 10) — has supervised projects in similar domains before
            if (group.domain) {
                const historyRes = await pool.query(`
                    SELECT COUNT(*)::int AS count
                    FROM projects p
                    JOIN groups g ON g.id = p.group_id
                    WHERE g.guide_id = $1 AND LOWER(p.domain) = LOWER($2) AND p.status = 'approved'
                `, [guide.guide_id, group.domain]);
                if (historyRes.rows[0]?.count > 0) {
                    score += 10;
                    reasons.push(`Previously supervised ${historyRes.rows[0].count} project(s) in "${group.domain}"`);
                }
            }

            suggestions.push({
                guide_id: guide.guide_id,
                guide_name: guide.guide_name,
                current_load: guide.current_load,
                max_load: loadConfig.hard_cap,
                score: Math.round(score * 100) / 100,
                reasons,
            });
        }

        // Sort by score descending
        suggestions.sort((a, b) => b.score - a.score);

        results.push({
            group_id: group.id,
            group_name: group.group_name,
            suggestions: suggestions.slice(0, 5), // Top 5
        });
    }

    return results;
};

// ── Auto-allocate: assign top-scored guide to each group ──
export const autoAllocateGuides = async (batchId: number) => {
    const allocations = await getSuggestedAllocations(batchId);
    const assigned: Array<{ group_id: number; group_name: string; guide_id: number; guide_name: string }> = [];

    // Track load changes as we allocate
    const loadIncrements: Record<number, number> = {};

    for (const alloc of allocations) {
        if (alloc.suggestions.length === 0) continue;

        // Find best guide considering load increments from this batch run
        const best = alloc.suggestions.find(s => {
            const effectiveLoad = s.current_load + (loadIncrements[s.guide_id] || 0);
            return effectiveLoad < s.max_load;
        });

        if (!best) continue;

        await pool.query(`UPDATE groups SET guide_id = $1 WHERE id = $2`, [best.guide_id, alloc.group_id]);
        loadIncrements[best.guide_id] = (loadIncrements[best.guide_id] || 0) + 1;

        assigned.push({
            group_id: alloc.group_id,
            group_name: alloc.group_name,
            guide_id: best.guide_id,
            guide_name: best.guide_name,
        });
    }

    // Audit log
    await pool.query(`
        INSERT INTO ai_audit_log (action, details) VALUES ('auto_allocate_guides', $1)
    `, [JSON.stringify({ batch_id: batchId, assignments: assigned })]);

    return { assigned, total: assigned.length };
};

// ── Workload distribution stats ───────────────────────────
export const getWorkloadDistribution = async () => {
    const res = await pool.query(`
        SELECT u.uid AS guide_id, pr.full_name AS guide_name,
               COUNT(g.id)::int AS current_load,
               $1::int AS max_load
        FROM users u
        LEFT JOIN profiles pr ON pr.u_id = u.uid
        LEFT JOIN groups g ON g.guide_id = u.uid
        WHERE u.role = 'guide' AND u.is_deleted = FALSE
        GROUP BY u.uid, pr.full_name
        ORDER BY current_load DESC
    `, [getMaxGuideLoad().hard_cap]);

    const loads = res.rows.map((r: any) => r.current_load);
    const avg = loads.length > 0 ? loads.reduce((a: number, b: number) => a + b, 0) / loads.length : 0;
    const variance = loads.length > 0 ? loads.reduce((sum: number, l: number) => sum + Math.pow(l - avg, 2), 0) / loads.length : 0;
    const stdDev = Math.sqrt(variance);

    return {
        guides: res.rows,
        stats: {
            total_guides: res.rows.length,
            average_load: Math.round(avg * 100) / 100,
            std_deviation: Math.round(stdDev * 100) / 100,
            fairness_index: Math.round((1 - stdDev / Math.max(avg, 1)) * 100) / 100, // 1.0 = perfectly fair
        },
    };
};
