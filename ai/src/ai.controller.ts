/**
 * AI Module — Controller (Request Handlers)
 * Uses generic types instead of importing express directly.
 */

// Services
import * as riskService from './services/risk.service';
import * as alertsService from './services/alerts.service';
import * as allocationService from './services/allocation.service';
import * as monitoringService from './services/monitoring.service';
import * as approvalService from './services/approval.service';
import * as analyticsService from './services/analytics.service';
import { triggerJob } from './scheduler/cron';
import { getAllConfig, updateConfig } from './engine/thresholds';
import pool from './config/db';

// ══════════════════════════════════════════════════════════
//  F3 — RISK
// ══════════════════════════════════════════════════════════
export const computeRisk = async (_req: any, res: any) => {
    try {
        const count = await riskService.computeRiskScores();
        res.json({ message: `Risk scores computed for ${count} projects` });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getAtRiskProjects = async (req: any, res: any) => {
    try {
        const deptId = req.query.deptId ? Number(req.query.deptId) : undefined;
        const batchId = req.query.batchId ? Number(req.query.batchId) : undefined;
        const data = await riskService.getAtRiskProjects(deptId, batchId);
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getGuideGroupRisks = async (req: any, res: any) => {
    try {
        const data = await riskService.getGuideGroupRisks(req.user.uid);
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getStudentRisk = async (req: any, res: any) => {
    try {
        const data = await riskService.getStudentRiskProfile(Number(req.params.studentId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getRiskTrends = async (req: any, res: any) => {
    try {
        const days = req.query.days ? Number(req.query.days) : 30;
        const data = await riskService.getRiskTrends(days);
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

// ══════════════════════════════════════════════════════════
//  F4 — ALERTS
// ══════════════════════════════════════════════════════════
export const getAlerts = async (req: any, res: any) => {
    try {
        const unread = req.query.unread === 'true';
        const data = await alertsService.getAlerts(req.user.uid, unread);
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getAlertCount = async (req: any, res: any) => {
    try {
        const count = await alertsService.getUnreadCount(req.user.uid);
        res.json({ count });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const markRead = async (req: any, res: any) => {
    try {
        await alertsService.markAlertRead(Number(req.params.id));
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const markAllReadCtrl = async (req: any, res: any) => {
    try {
        await alertsService.markAllRead(req.user.uid);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const resolveAlertCtrl = async (req: any, res: any) => {
    try {
        await alertsService.resolveAlert(Number(req.params.id));
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

// ══════════════════════════════════════════════════════════
//  F1 — ALLOCATION
// ══════════════════════════════════════════════════════════
export const suggestAllocations = async (req: any, res: any) => {
    try {
        const data = await allocationService.getSuggestedAllocations(Number(req.params.batchId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const autoAllocate = async (req: any, res: any) => {
    try {
        const data = await allocationService.autoAllocateGuides(Number(req.params.batchId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getWorkload = async (_req: any, res: any) => {
    try {
        const data = await allocationService.getWorkloadDistribution();
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

// ══════════════════════════════════════════════════════════
//  F2 — MONITORING
// ══════════════════════════════════════════════════════════
export const getDeptOverview = async (req: any, res: any) => {
    try {
        const data = await monitoringService.getDepartmentOverview(Number(req.params.deptId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getBatchComparison = async (req: any, res: any) => {
    try {
        const data = await monitoringService.getBatchProgressComparison(Number(req.params.deptId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getCompliance = async (req: any, res: any) => {
    try {
        const data = await monitoringService.getComplianceReport(Number(req.params.batchId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

// ══════════════════════════════════════════════════════════
//  F5 — APPROVAL
// ══════════════════════════════════════════════════════════
export const getEligible = async (req: any, res: any) => {
    try {
        const data = await approvalService.batchCheckApprovals(Number(req.params.batchId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const approveProject = async (req: any, res: any) => {
    try {
        const data = await approvalService.autoApproveProject(Number(req.params.projectId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const archiveProjects = async (req: any, res: any) => {
    try {
        const data = await approvalService.archiveCompletedProjects(Number(req.params.batchId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

// ══════════════════════════════════════════════════════════
//  F6 — ANALYTICS
// ══════════════════════════════════════════════════════════
export const guideEffectiveness = async (req: any, res: any) => {
    try {
        const deptId = req.query.deptId ? Number(req.query.deptId) : undefined;
        const data = await analyticsService.getGuideEffectiveness(deptId);
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const domainDist = async (req: any, res: any) => {
    try {
        const deptId = req.query.deptId ? Number(req.query.deptId) : undefined;
        const data = await analyticsService.getDomainDistribution(deptId);
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const batchHealth = async (req: any, res: any) => {
    try {
        const data = await analyticsService.getBatchHealthMatrix(Number(req.params.deptId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const forecast = async (req: any, res: any) => {
    try {
        const data = await analyticsService.getCompletionForecast(Number(req.params.batchId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const fairness = async (_req: any, res: any) => {
    try {
        const data = await analyticsService.getWorkloadFairness();
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const funnel = async (req: any, res: any) => {
    try {
        const data = await analyticsService.getSubmissionFunnel(Number(req.params.batchId));
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

// ══════════════════════════════════════════════════════════
//  F7 — CONFIG & SCHEDULER
// ══════════════════════════════════════════════════════════
export const getConfig = async (_req: any, res: any) => {
    try { res.json(getAllConfig()); }
    catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const updateConfigCtrl = async (req: any, res: any) => {
    try {
        await updateConfig(req.params.key, req.body.value);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const triggerJobCtrl = async (req: any, res: any) => {
    try {
        const msg = await triggerJob(req.params.job);
        res.json({ message: msg });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};

export const getAuditLog = async (req: any, res: any) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 50;
        const result = await pool.query(
            `SELECT * FROM ai_audit_log ORDER BY performed_at DESC LIMIT $1`, [limit]
        );
        res.json(result.rows);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
};
