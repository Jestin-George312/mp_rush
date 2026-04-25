/**
 * AI Module — Type Definitions
 */

// ── Risk Scoring ──────────────────────────────────────────
export type RiskLevel = 'healthy' | 'warning' | 'at_risk' | 'critical';

export interface RiskFactors {
    overdue_tasks: number;
    progress_gap: number;
    missing_docs: number;
    no_guide: number;
    inactivity: number;
}

export interface RiskPrediction {
    entity_type: 'project' | 'student' | 'group';
    entity_id: number;
    risk_score: number;
    risk_level: RiskLevel;
    factors: RiskFactors;
}

// ── Alerts ────────────────────────────────────────────────
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertType = 'at_risk' | 'overdue' | 'workload' | 'compliance' | 'deadline' | 'inactivity' | 'pending_review' | 'unassigned';
export type AlertTargetRole = 'guide' | 'coordinator' | 'student';
export type AlertRefType = 'project' | 'group' | 'student' | 'deadline' | 'document';

export interface AIAlert {
    id?: number;
    target_role: AlertTargetRole;
    target_user: number;
    alert_type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    ref_type?: AlertRefType;
    ref_id?: number;
    is_read?: boolean;
    is_resolved?: boolean;
}

// ── Allocation ────────────────────────────────────────────
export interface GuideSuggestion {
    guide_id: number;
    guide_name: string;
    current_load: number;
    max_load: number;
    score: number;
    reasons: string[];
}

export interface AllocationResult {
    group_id: number;
    group_name: string;
    suggestions: GuideSuggestion[];
}

// ── Approval ──────────────────────────────────────────────
export interface ApprovalCheck {
    project_id: number;
    eligible: boolean;
    reasons: string[];
    criteria: {
        progress_complete: boolean;
        all_tasks_done: boolean;
        min_docs_approved: boolean;
        topic_approved: boolean;
        no_pending_revisions: boolean;
    };
}

// ── Analytics ─────────────────────────────────────────────
export interface GuideEffectiveness {
    guide_id: number;
    guide_name: string;
    total_groups: number;
    avg_progress: number;
    on_time_ratio: number;
    approval_rate: number;
    effectiveness_score: number;
}

export interface BatchHealth {
    batch_id: number;
    batch_name: string;
    avg_progress: number;
    at_risk_count: number;
    healthy_count: number;
    compliance_rate: number;
}

// ── Config ────────────────────────────────────────────────
export interface RiskThresholds {
    healthy: number;
    warning: number;
    at_risk: number;
}

export interface MaxGuideLoad {
    default: number;
    hard_cap: number;
}

export interface AutoApproveRules {
    min_progress: number;
    min_docs_approved: number;
    all_tasks_done: boolean;
}
