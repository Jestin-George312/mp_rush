# APMS AI Engine — Implementation Plan

> **Project**: Academic Project Monitoring System (APMS)  
> **Module**: `ai/` (root-level standalone service)  
> **Stack**: Node.js · TypeScript · PostgreSQL (shared DB) · Express  
> **Date**: 2026-04-26

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Folder Structure](#2-folder-structure)
3. [Database Migration](#3-database-migration)
4. [Feature Implementations](#4-feature-implementations)
   - F1 — Guide Allocation & Workload Balancing
   - F2 — Department Progress Monitoring
   - F3 — At-Risk Student Identification
   - F4 — Guide Alert Generation
   - F5 — Final Submission Approval & Archival
   - F6 — Data-Driven Decision Support
   - F7 — Continuous Prediction Updates
5. [API Endpoints Summary](#5-api-endpoints-summary)
6. [Integration with Existing System](#6-integration-with-existing-system)
7. [Rollout Timeline](#7-rollout-timeline)

---

## 1. Architecture Overview

The AI Engine runs as an **internal module** mounted inside the existing Express backend — NOT a separate microservice. This avoids CORS/auth duplication and shares the same PostgreSQL connection pool.

```
┌─────────────────────────────────────────────────┐
│             Existing Backend (server.ts)         │
│                                                  │
│  Auth Middleware ─► Coordinator Module            │
│                 ─► Guide Module                   │
│                 ─► Student Module                 │
│                 ─► AI Module (NEW) ──► Scheduler  │
│                                                  │
│         All modules ──► PostgreSQL DB             │
└─────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **No external ML frameworks** — uses rule-based scoring & statistical heuristics (weighted formulas) that run directly in SQL + TypeScript. Keeps deployment simple.
- **Shared DB** — reads from existing tables (`projects`, `tasks`, `groups`, `documents`, `deadlines`) and writes to new AI-specific tables (`ai_alerts`, `ai_predictions`, `ai_audit_log`).
- **Cron-driven** — background jobs run on configurable intervals via `node-cron`.

---

## 2. Folder Structure

```
ai/
├── src/
│   ├── index.ts              # Exports: router + scheduler init
│   ├── ai.routes.ts          # All AI API routes
│   ├── ai.controller.ts      # Request handlers
│   │
│   ├── services/
│   │   ├── allocation.service.ts    # F1: Guide allocation
│   │   ├── monitoring.service.ts    # F2: Dept progress
│   │   ├── risk.service.ts          # F3: At-risk detection
│   │   ├── alerts.service.ts        # F4: Alert generation
│   │   ├── approval.service.ts      # F5: Submission approval
│   │   ├── analytics.service.ts     # F6: Decision support
│   │   └── prediction.service.ts    # F7: Continuous updates
│   │
│   ├── scheduler/
│   │   └── cron.ts                  # Cron job definitions
│   │
│   ├── engine/
│   │   ├── scoring.ts               # Shared scoring utilities
│   │   └── thresholds.ts            # Configurable thresholds
│   │
│   └── types/
│       └── ai.types.ts              # TypeScript interfaces
```

---

## 3. Database Migration

**File**: `ai/migration.sql` — Run after the existing `backend/migration.sql`.

```sql
-- AI Engine Tables

-- 1. AI Alerts (F4)
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

-- 2. AI Predictions / Risk Scores (F3, F7)
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

-- 3. AI Audit Log (F5, F6)
CREATE TABLE IF NOT EXISTS ai_audit_log (
    id          SERIAL PRIMARY KEY,
    action      VARCHAR(50) NOT NULL,
    entity_type VARCHAR(30),
    entity_id   INTEGER,
    details     JSONB NOT NULL DEFAULT '{}',
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. AI Config (F7 - tunable thresholds)
CREATE TABLE IF NOT EXISTS ai_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default thresholds
INSERT INTO ai_config (key, value) VALUES
    ('risk_thresholds', '{"healthy": 25, "warning": 50, "at_risk": 75}'),
    ('max_guide_load', '{"default": 8, "hard_cap": 10}'),
    ('auto_approve_rules', '{"min_progress": 100, "min_docs_approved": 3, "all_tasks_done": true}'),
    ('cron_intervals', '{"risk_scoring": "0 */6 * * *", "alerts": "0 8 * * *", "predictions": "0 0 * * *"}')
ON CONFLICT (key) DO NOTHING;
```

---

## 4. Feature Implementations

---

### F1 — Guide Allocation & Workload Balancing

**Purpose**: Suggest or assign guides to unassigned student groups while keeping faculty workload balanced.

**Algorithm — Weighted Load Balancer**:
```
For each unassigned group:
  1. Get all guides with current load < max_guide_load
  2. Score each guide:
     - base_score      = (max_load - current_load) * 40
     - domain_match    = guide.specialization matches project.domain ? 30 : 0
     - batch_familiarity = guide already has groups in same batch ? 20 : 0
     - history_bonus   = past successful supervisions in domain ? 10 : 0
  3. Sort by score DESC -> recommend top guide
  4. If auto_assign=true, execute UPDATE groups SET guide_id = recommended
```

**Service Functions** (`allocation.service.ts`):
- `getSuggestedAllocations(batchId)` — Returns ranked guide suggestions per unassigned group
- `autoAllocateGuides(batchId)` — Executes allocation and logs to `ai_audit_log`
- `getWorkloadDistribution()` — Returns per-guide load stats with balance metrics
- `rebalanceWorkload(deptId)` — Suggests guide swaps to improve load balance

**Data Sources**: `groups`, `users (role=guide)`, `projects`, `profiles`, `batches`

---

### F2 — Department Progress Monitoring

**Purpose**: Aggregate project progress at department level and flag compliance issues.

**Algorithm — Compliance Scoring**:
```
For each department -> batch -> group:
  1. progress_score    = project.progress (0-100)
  2. task_completion   = (done_tasks / total_tasks) * 100
  3. doc_compliance    = (approved_docs / required_docs) * 100
  4. deadline_adherence = (on_time_submissions / total_deadlines) * 100
  5. composite_score   = progress*0.3 + task*0.3 + docs*0.2 + deadlines*0.2
```

**Service Functions** (`monitoring.service.ts`):
- `getDepartmentOverview(deptId)` — Aggregated stats: avg progress, compliance rate, risk distribution
- `getBatchProgressComparison(deptId)` — Side-by-side batch metrics
- `getComplianceReport(batchId)` — Per-group compliance breakdown
- `getPhaseWiseProgress(batchId)` — Progress segmented by deadline phases

**Data Sources**: `departments`, `batches`, `projects`, `tasks`, `documents`, `deadlines`

---

### F3 — At-Risk Student Identification

**Purpose**: Detect students/groups likely to fail or miss deadlines.

**Algorithm — Multi-Factor Risk Scoring**:
```
For each active project/group:
  risk_score = 0

  // Factor 1: Overdue tasks (weight: 30)
  overdue_ratio = overdue_tasks / total_tasks
  risk_score += overdue_ratio * 30

  // Factor 2: Progress vs timeline (weight: 25)
  time_elapsed = (today - project.created_at) / (final_deadline - project.created_at)
  progress_gap = max(0, time_elapsed*100 - project.progress)
  risk_score += (progress_gap / 100) * 25

  // Factor 3: Missing documents (weight: 20)
  missed_doc_deadlines = deadlines passed without approved doc
  risk_score += min(missed_doc_deadlines * 7, 20)

  // Factor 4: No guide assigned (weight: 10)
  risk_score += (guide_id IS NULL) ? 10 : 0

  // Factor 5: No recent activity (weight: 15)
  days_inactive = days since last task/doc/meeting update
  risk_score += min(days_inactive * 1.5, 15)

  // Classify
  risk_level = score<25 ? 'healthy' : score<50 ? 'warning' : score<75 ? 'at_risk' : 'critical'
```

**Service Functions** (`risk.service.ts`):
- `computeRiskScores()` — Recalculates all risk scores -> upserts into `ai_predictions`
- `getAtRiskProjects(deptId?, batchId?)` — Returns filtered list with risk breakdown
- `getStudentRiskProfile(studentId)` — Individual risk factors
- `getRiskTrends(daysBack)` — Historical risk score changes

**Data Sources**: `projects`, `tasks`, `documents`, `deadlines`, `groups`, `group_members`, `meetings`

---

### F4 — Guide Alert Generation

**Purpose**: Proactively notify guides about issues in their supervised groups.

**Alert Triggers**:

| Trigger | Condition | Severity |
|---|---|---|
| Overdue Task | Task deadline passed, status != 'done' | `high` |
| At-Risk Group | Risk score crosses `warning` threshold | `medium` |
| Critical Risk | Risk score crosses `at_risk` threshold | `critical` |
| Deadline Approaching | Batch deadline within 3 days | `medium` |
| No Activity | No updates in 7+ days on active project | `high` |
| Document Pending | Document pending review for 5+ days | `low` |
| Unassigned Group | Group in guide's batch has no guide | `medium` |

**Service Functions** (`alerts.service.ts`):
- `generateGuideAlerts()` — Scans triggers -> creates `ai_alerts` rows (avoids duplicates)
- `generateCoordinatorAlerts()` — Department-level alerts
- `getAlerts(userId, filters?)` — Fetch alerts with read/unread filtering
- `markAlertRead(alertId)` / `markAllRead(userId)` — Read state management
- `resolveAlert(alertId)` — Mark alert as resolved

**Deduplication**: Before creating an alert, check if an unresolved alert with the same `(alert_type, ref_type, ref_id, target_user)` already exists.

---

### F5 — Final Submission Approval & Archival

**Purpose**: Automatically approve projects meeting all completion criteria and archive them.

**Auto-Approve Criteria** (ALL must be true):
1. `project.progress = 100`
2. All tasks have `status = 'done'`
3. At least N required documents have `status = 'Approved'` (configurable)
4. `project.review_state = 'Approved'` (topic was approved)
5. All batch deadlines have associated approved documents
6. No open 'Revision Requested' documents

**NOTE**: Auto-approval only **flags** projects as eligible by default. Actual approval requires coordinator confirmation unless `auto_execute` config is enabled.

**Service Functions** (`approval.service.ts`):
- `checkAutoApproval(projectId)` — Evaluates criteria -> returns `{ eligible, reasons[] }`
- `batchCheckApprovals(batchId)` — Check all projects in batch
- `autoApproveProject(projectId)` — Sets status, logs to `ai_audit_log`
- `archiveCompletedProjects(batchId)` — Marks completed projects as 'Archived'
- `getArchiveSummary(batchId)` — Stats on archived vs active

---

### F6 — Data-Driven Decision Support

**Purpose**: Provide analytical dashboards and insights for coordinators.

**Analytics Provided**:

| Metric | Computation |
|---|---|
| Guide Effectiveness | `(avg_progress * 0.4) + (on_time_ratio * 0.3) + (approval_rate * 0.3)` |
| Domain Distribution | Count of projects per domain |
| Batch Health Heatmap | Matrix: batches x metrics (progress, risk, compliance) |
| Timeline Forecast | Projected completion date based on velocity |
| Workload Fairness Index | StdDev of guide loads (lower = more fair) |
| Submission Funnel | Pending -> Reviewed -> Approved conversion rates |

**Service Functions** (`analytics.service.ts`):
- `getGuideEffectiveness(deptId?)` — Ranked guides with effectiveness scores
- `getDomainDistribution(deptId?)` — Project count by domain
- `getBatchHealthMatrix(deptId)` — Heatmap data
- `getCompletionForecast(batchId)` — Predicted completion dates
- `getWorkloadFairness()` — Fairness index + distribution
- `getSubmissionFunnel(batchId)` — Document pipeline stats

---

### F7 — Continuous Prediction Updates

**Purpose**: Keep risk scores, alerts, and forecasts fresh via scheduled background jobs.

**Cron Schedule** (configurable via `ai_config` table):

| Job | Default Schedule | Function Called |
|---|---|---|
| Risk Scoring | Every 6 hours | `risk.computeRiskScores()` |
| Alert Generation | Daily at 8 AM | `alerts.generateGuideAlerts()` + `generateCoordinatorAlerts()` |
| Auto-Approval Check | Daily at midnight | `approval.batchCheckApprovals(*)` |
| Analytics Refresh | Daily at 1 AM | `analytics.refreshCachedMetrics()` |

**Scheduler** (`scheduler/cron.ts`):
```typescript
import cron from 'node-cron';
import { computeRiskScores } from '../services/risk.service';
import { generateGuideAlerts, generateCoordinatorAlerts } from '../services/alerts.service';

export const initScheduler = async (pool: Pool) => {
    const config = await loadCronConfig(pool);

    cron.schedule(config.risk_scoring, () => computeRiskScores(pool));
    cron.schedule(config.alerts, async () => {
        await generateGuideAlerts(pool);
        await generateCoordinatorAlerts(pool);
    });

    console.log('AI Scheduler initialized');
};
```

---

## 5. API Endpoints Summary

All endpoints mounted under `/api/ai/` with `requireAuth` middleware.

### Coordinator-only endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/ai/allocation/suggest/:batchId` | Guide suggestions per group |
| `POST` | `/api/ai/allocation/auto/:batchId` | Execute auto-allocation |
| `GET` | `/api/ai/allocation/workload` | Guide workload distribution |
| `POST` | `/api/ai/allocation/rebalance/:deptId` | Suggest rebalancing |
| `GET` | `/api/ai/monitoring/department/:deptId` | Department overview |
| `GET` | `/api/ai/monitoring/batch-comparison/:deptId` | Batch comparisons |
| `GET` | `/api/ai/monitoring/compliance/:batchId` | Compliance report |
| `GET` | `/api/ai/risk/projects` | All at-risk projects |
| `GET` | `/api/ai/risk/trends` | Risk score trends |
| `GET` | `/api/ai/approval/eligible/:batchId` | Auto-approval candidates |
| `POST` | `/api/ai/approval/approve/:projectId` | Confirm auto-approval |
| `POST` | `/api/ai/approval/archive/:batchId` | Archive completed projects |
| `GET` | `/api/ai/analytics/guide-effectiveness` | Guide ranking |
| `GET` | `/api/ai/analytics/domain-distribution` | Domain stats |
| `GET` | `/api/ai/analytics/batch-health/:deptId` | Batch health matrix |
| `GET` | `/api/ai/analytics/forecast/:batchId` | Completion forecast |
| `GET` | `/api/ai/analytics/workload-fairness` | Fairness index |

### Guide endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/ai/risk/my-groups` | Risk scores for guide's groups |
| `GET` | `/api/ai/risk/student/:studentId` | Individual student risk |

### Shared endpoints (any authenticated user)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/ai/alerts` | Fetch user's alerts (`?unread=true`) |
| `PATCH` | `/api/ai/alerts/:id/read` | Mark alert read |
| `PATCH` | `/api/ai/alerts/read-all` | Mark all read |
| `PATCH` | `/api/ai/alerts/:id/resolve` | Resolve alert |
| `GET` | `/api/ai/alerts/count` | Unread alert count (for badge) |

### Admin endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/ai/config` | View AI config |
| `PATCH` | `/api/ai/config/:key` | Update threshold/schedule |
| `GET` | `/api/ai/audit-log` | View AI action log |
| `POST` | `/api/ai/scheduler/trigger/:job` | Manually trigger a cron job |

---

## 6. Integration with Existing System

### Step 1 — Install Dependency

```bash
cd backend
npm install node-cron
npm install -D @types/node-cron
```

### Step 2 — Create the AI Module Files

Create all files under `ai/src/` following the folder structure above. Each service imports the shared pool:

**Recommended approach**: The AI module exports a router factory that accepts `pool` as a parameter, or create `ai/src/config/db.ts` that re-exports the same pool configuration from `backend`.

### Step 3 — Mount AI Routes in `server.ts`

```diff
 // backend/src/server.ts
+import aiRoutes from '../../ai/src/ai.routes';
+import { initScheduler } from '../../ai/src/scheduler/cron';

 // Register Routes
 app.use('/api/coordinator', coordinatorRoutes);
+app.use('/api/ai', aiRoutes);

 // Start the server
 if (process.env.NODE_ENV !== 'test') {
   app.listen(PORT, () => {
     console.log('APMS Server running on http://localhost:${PORT}');
+    initScheduler(pool);
   });
 }
```

### Step 4 — Run AI Migration

```bash
psql -U postgres -d mp_rush -f ai/migration.sql
```

### Step 5 — Frontend Integration Points

| Existing Page | AI Integration | API Call |
|---|---|---|
| Coordinator Dashboard | Replace dummy at-risk with AI risk scores | `GET /api/ai/risk/projects` |
| Coordinator Dashboard | Add alert badge/bell icon | `GET /api/ai/alerts/count` |
| Guide Allocation Page | Show AI-suggested guide per group | `GET /api/ai/allocation/suggest/:batchId` |
| Guide Allocation Page | "Auto-Allocate" button | `POST /api/ai/allocation/auto/:batchId` |
| Guide Dashboard | Alert notification panel | `GET /api/ai/alerts` |
| Project Health Page | AI risk breakdown instead of basic overdue | `GET /api/ai/risk/projects` |
| Coordinator Analytics | New cards (guide effectiveness, forecasts) | `GET /api/ai/analytics/*` |
| Submission Audit Page | "Auto-Approve Eligible" badge | `GET /api/ai/approval/eligible/:batchId` |

### Step 6 — Enhance Existing Services (Optional Event Hooks)

Add hooks in existing services to trigger AI updates in real-time:

```typescript
// In project.service.ts -> after updateProjectProgress()
import { triggerRiskUpdate } from '../../ai/src/services/risk.service';
await triggerRiskUpdate(projectId);

// In guide.service.ts -> after reviewTopic()
import { checkAutoApproval } from '../../ai/src/services/approval.service';
await checkAutoApproval(projectId);
```

---

## 7. Rollout Timeline

| Phase | Features | Duration | Milestone |
|---|---|---|---|
| **Phase 1** | F3 (Risk Scoring) + F4 (Alerts) | 3-4 days | Risk scores visible, guides receive alerts |
| **Phase 2** | F1 (Guide Allocation) + F2 (Monitoring) | 3-4 days | Auto-suggest guides, dept progress dashboards |
| **Phase 3** | F5 (Auto-Approval) + F6 (Analytics) | 3-4 days | Submission approval workflow, analytics |
| **Phase 4** | F7 (Scheduler) + Polish | 2-3 days | Cron jobs active, threshold tuning, testing |

**Total estimated effort**: 12-15 days

**NOTE**: Phase 1 is the critical path — F3 and F4 are the most impactful features and provide the data foundation for all subsequent phases. Start here.

---

## Quick Start Checklist

- [ ] Run `ai/migration.sql` against the database (`psql -U postgres -d mp_rush -f ai/migration.sql`)
- [x] Create `ai/` folder structure with all service files
- [x] Implement F3 (`risk.service.ts`) — multi-factor risk scoring engine
- [x] Implement F4 (`alerts.service.ts`) — guide & coordinator alert generation
- [x] Implement F1 (`allocation.service.ts`) — weighted guide allocation
- [x] Implement F2 (`monitoring.service.ts`) — department progress monitoring
- [x] Implement F5 (`approval.service.ts`) — auto-approval & archival
- [x] Implement F6 (`analytics.service.ts`) — decision support analytics
- [x] Implement F7 (`scheduler/cron.ts`) — continuous prediction scheduler
- [x] Mount `/api/ai` routes in `server.ts`
- [x] Install `node-cron` + `@types/node-cron` dependency
- [ ] Wire frontend alert badge to `/api/ai/alerts/count`
- [ ] Replace coordinator dashboard at-risk data with `/api/ai/risk/projects`
- [ ] Test all endpoints and tune thresholds via `ai_config`
