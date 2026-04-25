/**
 * AI Module — Route Definitions (Factory Pattern)
 *
 * Exports a factory function instead of importing express directly,
 * since the ai/ folder is outside backend/node_modules scope.
 */
import * as ctrl from './ai.controller';

export function createAiRoutes(deps: {
    Router: any;
    requireAuth: any;
    requireRoles: (roles: string[]) => any;
}) {
    const { Router, requireAuth, requireRoles } = deps;
    const router = Router();

    // ── All routes require authentication ─────────────────────
    router.use(requireAuth);

    // ══════════════════════════════════════════════════════════
    //  SHARED (any authenticated user)
    // ══════════════════════════════════════════════════════════
    // F4 — Alerts
    router.get('/alerts', ctrl.getAlerts);
    router.get('/alerts/count', ctrl.getAlertCount);
    router.patch('/alerts/:id/read', ctrl.markRead);
    router.patch('/alerts/read-all', ctrl.markAllReadCtrl);
    router.patch('/alerts/:id/resolve', ctrl.resolveAlertCtrl);

    // ══════════════════════════════════════════════════════════
    //  GUIDE
    // ══════════════════════════════════════════════════════════
    router.get('/risk/my-groups',
        requireRoles(['guide', 'Guide']),
        ctrl.getGuideGroupRisks
    );
    router.get('/risk/student/:studentId',
        requireRoles(['guide', 'Guide', 'coordinator', 'Coordinator', 'admin', 'Admin']),
        ctrl.getStudentRisk
    );

    // ══════════════════════════════════════════════════════════
    //  COORDINATOR (+ Admin)
    // ══════════════════════════════════════════════════════════
    const coordOnly = requireRoles(['coordinator', 'Coordinator', 'admin', 'Admin']);

    // F1 — Allocation
    router.get('/allocation/suggest/:batchId', coordOnly, ctrl.suggestAllocations);
    router.post('/allocation/auto/:batchId', coordOnly, ctrl.autoAllocate);
    router.get('/allocation/workload', coordOnly, ctrl.getWorkload);

    // F2 — Monitoring
    router.get('/monitoring/department/:deptId', coordOnly, ctrl.getDeptOverview);
    router.get('/monitoring/batch-comparison/:deptId', coordOnly, ctrl.getBatchComparison);
    router.get('/monitoring/compliance/:batchId', coordOnly, ctrl.getCompliance);

    // F3 — Risk
    router.get('/risk/projects', coordOnly, ctrl.getAtRiskProjects);
    router.get('/risk/trends', coordOnly, ctrl.getRiskTrends);
    router.post('/risk/compute', coordOnly, ctrl.computeRisk);

    // F5 — Approval
    router.get('/approval/eligible/:batchId', coordOnly, ctrl.getEligible);
    router.post('/approval/approve/:projectId', coordOnly, ctrl.approveProject);
    router.post('/approval/archive/:batchId', coordOnly, ctrl.archiveProjects);

    // F6 — Analytics
    router.get('/analytics/guide-effectiveness', coordOnly, ctrl.guideEffectiveness);
    router.get('/analytics/domain-distribution', coordOnly, ctrl.domainDist);
    router.get('/analytics/batch-health/:deptId', coordOnly, ctrl.batchHealth);
    router.get('/analytics/forecast/:batchId', coordOnly, ctrl.forecast);
    router.get('/analytics/workload-fairness', coordOnly, ctrl.fairness);
    router.get('/analytics/submission-funnel/:batchId', coordOnly, ctrl.funnel);

    // ══════════════════════════════════════════════════════════
    //  ADMIN
    // ══════════════════════════════════════════════════════════
    const adminOnly = requireRoles(['admin', 'Admin']);

    // F7 — Config & Scheduler
    router.get('/config', adminOnly, ctrl.getConfig);
    router.patch('/config/:key', adminOnly, ctrl.updateConfigCtrl);
    router.get('/audit-log', adminOnly, ctrl.getAuditLog);
    router.post('/scheduler/trigger/:job', adminOnly, ctrl.triggerJobCtrl);

    return router;
}
