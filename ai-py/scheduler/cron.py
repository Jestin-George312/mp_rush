"""
F7 — Continuous Prediction Updates via APScheduler
"""
from apscheduler.schedulers.background import BackgroundScheduler
from services.risk_service import compute_risk_scores
from services.alerts_service import generate_guide_alerts, generate_coordinator_alerts
from services.approval_service import batch_check_approvals

_scheduler: BackgroundScheduler | None = None


def _run_risk_scoring():
    print("🤖 [CRON] Running risk scoring...")
    try:
        count = compute_risk_scores()
        print(f"🤖 [CRON] Risk scoring complete — {count} projects scored")
    except Exception as e:
        print(f"🤖 [CRON] Risk scoring failed: {e}")


def _run_alerts():
    print("🤖 [CRON] Generating alerts...")
    try:
        g = generate_guide_alerts()
        c = generate_coordinator_alerts()
        print(f"🤖 [CRON] Alerts generated — guide: {g}, coordinator: {c}")
    except Exception as e:
        print(f"🤖 [CRON] Alert generation failed: {e}")


def _run_approvals():
    print("🤖 [CRON] Checking auto-approvals...")
    try:
        result = batch_check_approvals()
        print(f"🤖 [CRON] Approval check — {len(result['eligible'])} eligible of {result['total_checked']}")
    except Exception as e:
        print(f"🤖 [CRON] Approval check failed: {e}")


def init_scheduler():
    global _scheduler
    _scheduler = BackgroundScheduler()

    # Risk scoring — every 6 hours
    _scheduler.add_job(_run_risk_scoring, "interval", hours=6, id="risk_scoring")

    # Alert generation — daily at 8 AM
    _scheduler.add_job(_run_alerts, "cron", hour=8, id="alerts")

    # Auto-approval check — daily at midnight
    _scheduler.add_job(_run_approvals, "cron", hour=0, id="predictions")

    _scheduler.start()
    print("🤖 AI Scheduler initialized (APScheduler)")


def trigger_job(job_name: str) -> str:
    if job_name == "risk_scoring":
        count = compute_risk_scores()
        return f"Risk scoring complete — {count} projects scored"
    elif job_name == "alerts":
        g = generate_guide_alerts()
        c = generate_coordinator_alerts()
        return f"Alerts generated — guide: {g}, coordinator: {c}"
    elif job_name == "predictions":
        r = batch_check_approvals()
        return f"Approval check — {len(r['eligible'])} eligible of {r['total_checked']}"
    else:
        raise ValueError(f"Unknown job: {job_name}")


def stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown()
        print("🤖 Scheduler stopped")
        _scheduler = None
