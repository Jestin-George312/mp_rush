"""
AI Engine — All FastAPI Route Definitions
Organized by feature (F1–F7).
"""
from fastapi import APIRouter, Query
from typing import Optional

from services import risk_service, alerts_service, allocation_service
from services import monitoring_service, approval_service, analytics_service
from scheduler.cron import trigger_job
from config.settings import get_all_config, update_config
from config.database import query

router = APIRouter(prefix="/api/ai", tags=["AI Engine"])


# ══════════════════════════════════════════════════════════
#  F3 — RISK
# ══════════════════════════════════════════════════════════
@router.post("/risk/compute", summary="Recompute all risk scores")
def compute_risk():
    count = risk_service.compute_risk_scores()
    return {"message": f"Risk scores computed for {count} projects"}


@router.get("/risk/projects", summary="Get all at-risk projects")
def get_at_risk_projects(deptId: Optional[int] = None, batchId: Optional[int] = None):
    return risk_service.get_at_risk_projects(deptId, batchId)


@router.get("/risk/my-groups/{guide_id}", summary="Risk scores for a guide's groups")
def get_guide_risks(guide_id: int):
    return risk_service.get_guide_group_risks(guide_id)


@router.get("/risk/student/{student_id}", summary="Individual student risk profile")
def get_student_risk(student_id: int):
    return risk_service.get_student_risk_profile(student_id)


@router.get("/risk/trends", summary="Risk score trends")
def get_risk_trends(days: int = Query(30)):
    return risk_service.get_risk_trends(days)


# ══════════════════════════════════════════════════════════
#  F4 — ALERTS
# ══════════════════════════════════════════════════════════
@router.get("/alerts/{user_id}", summary="Get alerts for a user")
def get_alerts(user_id: int, unread: bool = Query(False)):
    return alerts_service.get_alerts(user_id, unread)


@router.get("/alerts/{user_id}/count", summary="Unread alert count")
def get_alert_count(user_id: int):
    return {"count": alerts_service.get_unread_count(user_id)}


@router.patch("/alerts/{alert_id}/read", summary="Mark alert as read")
def mark_read(alert_id: int):
    alerts_service.mark_alert_read(alert_id)
    return {"success": True}


@router.patch("/alerts/{user_id}/read-all", summary="Mark all alerts read")
def mark_all_read(user_id: int):
    alerts_service.mark_all_read(user_id)
    return {"success": True}


@router.patch("/alerts/{alert_id}/resolve", summary="Resolve an alert")
def resolve_alert(alert_id: int):
    alerts_service.resolve_alert(alert_id)
    return {"success": True}


# ══════════════════════════════════════════════════════════
#  F1 — ALLOCATION
# ══════════════════════════════════════════════════════════
@router.get("/allocation/suggest/{batch_id}", summary="Guide suggestions per group")
def suggest_allocations(batch_id: int):
    return allocation_service.get_suggested_allocations(batch_id)


@router.post("/allocation/auto/{batch_id}", summary="Auto-allocate guides")
def auto_allocate(batch_id: int):
    return allocation_service.auto_allocate_guides(batch_id)


@router.get("/allocation/workload", summary="Guide workload distribution")
def get_workload():
    return allocation_service.get_workload_distribution()


# ══════════════════════════════════════════════════════════
#  F2 — MONITORING
# ══════════════════════════════════════════════════════════
@router.get("/monitoring/department/{dept_id}", summary="Department overview")
def get_dept_overview(dept_id: int):
    return monitoring_service.get_department_overview(dept_id)


@router.get("/monitoring/batch-comparison/{dept_id}", summary="Batch-by-batch comparison")
def get_batch_comparison(dept_id: int):
    return monitoring_service.get_batch_progress_comparison(dept_id)


@router.get("/monitoring/compliance/{batch_id}", summary="Compliance report")
def get_compliance(batch_id: int):
    return monitoring_service.get_compliance_report(batch_id)


@router.get("/monitoring/phase-progress/{batch_id}", summary="Phase-wise progress")
def get_phase_progress(batch_id: int):
    return monitoring_service.get_phase_wise_progress(batch_id)


# ══════════════════════════════════════════════════════════
#  F5 — APPROVAL
# ══════════════════════════════════════════════════════════
@router.get("/approval/eligible/{batch_id}", summary="Auto-approval candidates")
def get_eligible(batch_id: int):
    return approval_service.batch_check_approvals(batch_id)


@router.post("/approval/approve/{project_id}", summary="Confirm auto-approval")
def approve_project(project_id: int):
    return approval_service.auto_approve_project(project_id)


@router.post("/approval/archive/{batch_id}", summary="Archive completed projects")
def archive_projects(batch_id: int):
    return approval_service.archive_completed_projects(batch_id)


@router.get("/approval/archive-summary/{batch_id}", summary="Archive summary")
def archive_summary(batch_id: int):
    return approval_service.get_archive_summary(batch_id)


# ══════════════════════════════════════════════════════════
#  F6 — ANALYTICS
# ══════════════════════════════════════════════════════════
@router.get("/analytics/guide-effectiveness", summary="Guide effectiveness ranking")
def guide_effectiveness(deptId: Optional[int] = None):
    return analytics_service.get_guide_effectiveness(deptId)


@router.get("/analytics/domain-distribution", summary="Domain distribution")
def domain_dist(deptId: Optional[int] = None):
    return analytics_service.get_domain_distribution(deptId)


@router.get("/analytics/batch-health/{dept_id}", summary="Batch health matrix")
def batch_health(dept_id: int):
    return analytics_service.get_batch_health_matrix(dept_id)


@router.get("/analytics/forecast/{batch_id}", summary="Completion forecast")
def forecast(batch_id: int):
    return analytics_service.get_completion_forecast(batch_id)


@router.get("/analytics/workload-fairness", summary="Workload fairness index")
def fairness():
    return analytics_service.get_workload_fairness()


@router.get("/analytics/submission-funnel/{batch_id}", summary="Submission funnel")
def funnel(batch_id: int):
    return analytics_service.get_submission_funnel(batch_id)


# ══════════════════════════════════════════════════════════
#  F7 — CONFIG & SCHEDULER
# ══════════════════════════════════════════════════════════
@router.get("/config", summary="View AI config")
def get_config():
    return get_all_config()


@router.patch("/config/{key}", summary="Update config key")
def update_config_endpoint(key: str, value: dict):
    update_config(key, value)
    return {"success": True}


@router.get("/audit-log", summary="View AI audit log")
def get_audit_log(limit: int = Query(50)):
    return query("SELECT * FROM ai_audit_log ORDER BY performed_at DESC LIMIT %s", (limit,))


@router.post("/scheduler/trigger/{job}", summary="Manually trigger a cron job")
def trigger_job_endpoint(job: str):
    msg = trigger_job(job)
    return {"message": msg}
