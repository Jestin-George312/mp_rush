/**
 * F7 — Cron Scheduler for Continuous Prediction Updates
 * Uses dynamic require to resolve node-cron from backend's node_modules.
 */
import * as path from 'path';
const cron = require(require.resolve('node-cron', {
    paths: [path.resolve(__dirname, '../../../backend/node_modules')]
}));

import { computeRiskScores } from '../services/risk.service';
import { generateGuideAlerts, generateCoordinatorAlerts } from '../services/alerts.service';
import { batchCheckApprovals } from '../services/approval.service';
import { getCronIntervals, loadConfig } from '../engine/thresholds';

let scheduledJobs: Record<string, any> = {};

export const initScheduler = async () => {
    await loadConfig();
    const intervals = getCronIntervals();

    // Risk scoring — every 6 hours by default
    scheduledJobs['risk_scoring'] = cron.schedule(intervals.risk_scoring, async () => {
        console.log('🤖 [CRON] Running risk scoring...');
        try {
            const count = await computeRiskScores();
            console.log(`🤖 [CRON] Risk scoring complete — ${count} projects scored`);
        } catch (err) { console.error('🤖 [CRON] Risk scoring failed:', err); }
    });

    // Alert generation — daily at 8 AM by default
    scheduledJobs['alerts'] = cron.schedule(intervals.alerts, async () => {
        console.log('🤖 [CRON] Generating alerts...');
        try {
            const guideCount = await generateGuideAlerts();
            const coordCount = await generateCoordinatorAlerts();
            console.log(`🤖 [CRON] Alerts generated — guide: ${guideCount}, coordinator: ${coordCount}`);
        } catch (err) { console.error('🤖 [CRON] Alert generation failed:', err); }
    });

    // Auto-approval check — daily at midnight by default
    scheduledJobs['predictions'] = cron.schedule(intervals.predictions, async () => {
        console.log('🤖 [CRON] Checking auto-approvals...');
        try {
            const result = await batchCheckApprovals();
            console.log(`🤖 [CRON] Approval check — ${result.eligible.length} eligible of ${result.total_checked}`);
        } catch (err) { console.error('🤖 [CRON] Approval check failed:', err); }
    });

    console.log('🤖 AI Scheduler initialized with intervals:', intervals);
};

/**
 * Manually trigger a specific job
 */
export const triggerJob = async (jobName: string): Promise<string> => {
    switch (jobName) {
        case 'risk_scoring': {
            const count = await computeRiskScores();
            return `Risk scoring complete — ${count} projects scored`;
        }
        case 'alerts': {
            const g = await generateGuideAlerts();
            const c = await generateCoordinatorAlerts();
            return `Alerts generated — guide: ${g}, coordinator: ${c}`;
        }
        case 'predictions': {
            const r = await batchCheckApprovals();
            return `Approval check — ${r.eligible.length} eligible of ${r.total_checked}`;
        }
        default:
            throw new Error(`Unknown job: ${jobName}`);
    }
};

export const stopScheduler = () => {
    for (const [name, job] of Object.entries(scheduledJobs)) {
        (job as any).stop();
        console.log(`🤖 Stopped cron job: ${name}`);
    }
    scheduledJobs = {};
};
