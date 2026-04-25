"""
F6 — Data-Driven Decision Support (Analytics)
"""
import math
from datetime import datetime, timezone
from config.database import query
from config.settings import get_max_guide_load


def get_guide_effectiveness(dept_id: int = None) -> list:
    filt = "AND b.department_id = %s" if dept_id else ""
    params = (dept_id,) if dept_id else None
    rows = query(
        f"""SELECT u.uid AS guide_id, pr.full_name AS guide_name,
                   COUNT(DISTINCT g.id)::int AS total_groups,
                   COALESCE(ROUND(AVG(p.progress)),0)::int AS avg_progress,
                   CASE WHEN COUNT(DISTINCT t.id) > 0
                        THEN ROUND(100.0 * COUNT(DISTINCT CASE WHEN t.status='done' AND (t.deadline IS NULL OR t.deadline >= t.created_at::date) THEN t.id END) / COUNT(DISTINCT t.id))
                        ELSE 0 END::int AS on_time_ratio,
                   CASE WHEN COUNT(DISTINCT doc.id) > 0
                        THEN ROUND(100.0 * COUNT(DISTINCT CASE WHEN doc.status='Approved' THEN doc.id END) / COUNT(DISTINCT doc.id))
                        ELSE 0 END::int AS approval_rate
            FROM users u LEFT JOIN profiles pr ON pr.u_id = u.uid
            LEFT JOIN groups g ON g.guide_id = u.uid
            LEFT JOIN batches b ON b.id = g.batch_id
            LEFT JOIN projects p ON p.group_id = g.id
            LEFT JOIN tasks t ON t.project_id = p.id
            LEFT JOIN documents doc ON doc.project_id = p.id
            WHERE u.role = 'guide' AND u.is_deleted = FALSE {filt}
            GROUP BY u.uid, pr.full_name ORDER BY AVG(p.progress) DESC NULLS LAST""",
        params,
    )
    for r in rows:
        r["effectiveness_score"] = round(r["avg_progress"] * 0.4 + r["on_time_ratio"] * 0.3 + r["approval_rate"] * 0.3)
    return rows


def get_domain_distribution(dept_id: int = None) -> list:
    filt = "WHERE b.department_id = %s" if dept_id else ""
    params = (dept_id,) if dept_id else None
    return query(
        f"""SELECT COALESCE(p.domain, 'Unspecified') AS domain, COUNT(*)::int AS count,
                   ROUND(AVG(p.progress))::int AS avg_progress
            FROM projects p JOIN groups g ON g.id = p.group_id LEFT JOIN batches b ON b.id = g.batch_id
            {filt} GROUP BY p.domain ORDER BY count DESC""",
        params,
    )


def get_batch_health_matrix(dept_id: int) -> list:
    return query(
        """SELECT b.id AS batch_id, b.name AS batch_name,
                  COALESCE(ROUND(AVG(p.progress)),0)::int AS avg_progress,
                  COUNT(DISTINCT CASE WHEN ap.risk_level IN ('at_risk','critical') THEN p.id END)::int AS at_risk,
                  COUNT(DISTINCT CASE WHEN ap.risk_level = 'healthy' THEN p.id END)::int AS healthy,
                  COUNT(DISTINCT CASE WHEN ap.risk_level = 'warning' THEN p.id END)::int AS warning,
                  CASE WHEN COUNT(DISTINCT doc.id) > 0
                       THEN ROUND(100.0 * COUNT(DISTINCT CASE WHEN doc.status='Approved' THEN doc.id END) / COUNT(DISTINCT doc.id))
                       ELSE 0 END::int AS compliance_rate
           FROM batches b LEFT JOIN groups g ON g.batch_id = b.id
           LEFT JOIN projects p ON p.group_id = g.id
           LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
           LEFT JOIN documents doc ON doc.project_id = p.id
           WHERE b.department_id = %s GROUP BY b.id, b.name ORDER BY b.name""",
        (dept_id,),
    )


def get_completion_forecast(batch_id: int) -> list:
    rows = query(
        """SELECT g.id AS group_id, g.group_name, p.title, p.progress, p.created_at,
                  pr.full_name AS guide_name
           FROM groups g LEFT JOIN projects p ON p.group_id = g.id
           LEFT JOIN profiles pr ON pr.u_id = g.guide_id
           WHERE g.batch_id = %s AND p.id IS NOT NULL ORDER BY p.progress DESC""",
        (batch_id,),
    )
    dl = query("SELECT MAX(due_date) AS final FROM deadlines WHERE batch_id = %s", (batch_id,))
    final_deadline = dl[0]["final"] if dl else None

    results = []
    now = datetime.now(timezone.utc)
    for r in rows:
        created = r["created_at"]
        if isinstance(created, str):
            created = datetime.fromisoformat(created)
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        elapsed_days = max(1, (now - created).days)
        daily_rate = (r["progress"] or 0) / elapsed_days
        remaining = 100 - (r["progress"] or 0)
        days_to_complete = math.ceil(remaining / daily_rate) if daily_rate > 0 else None
        est = None
        if days_to_complete is not None:
            from datetime import timedelta
            est = (now + timedelta(days=days_to_complete)).strftime("%Y-%m-%d")
        final_str = str(final_deadline) if final_deadline else None
        on_track = None
        if est and final_str:
            on_track = est <= final_str
        r["daily_rate"] = round(daily_rate, 2)
        r["days_to_complete"] = days_to_complete
        r["estimated_completion"] = est
        r["final_deadline"] = final_str
        r["on_track"] = on_track
        results.append(r)
    return results


def get_workload_fairness() -> dict:
    load_cfg = get_max_guide_load()
    rows = query(
        """SELECT u.uid AS guide_id, pr.full_name, COUNT(g.id)::int AS load
           FROM users u LEFT JOIN profiles pr ON pr.u_id = u.uid LEFT JOIN groups g ON g.guide_id = u.uid
           WHERE u.role = 'guide' AND u.is_deleted = FALSE
           GROUP BY u.uid, pr.full_name ORDER BY load DESC"""
    )
    loads = [r["load"] for r in rows]
    avg = sum(loads) / len(loads) if loads else 0
    var = sum((l - avg) ** 2 for l in loads) / len(loads) if loads else 0
    std = math.sqrt(var)
    return {
        "guides": rows,
        "stats": {
            "avg_load": round(avg, 2), "std_deviation": round(std, 2),
            "fairness_index": round(1 - std / max(avg, 1), 2),
            "max_allowed": load_cfg["hard_cap"],
        },
    }


def get_submission_funnel(batch_id: int):
    rows = query(
        """SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='Pending')::int AS pending,
                  COUNT(*) FILTER (WHERE status='Approved')::int AS approved,
                  COUNT(*) FILTER (WHERE status='Rejected')::int AS rejected
           FROM documents d JOIN projects p ON p.id = d.project_id
           JOIN groups g ON g.id = p.group_id WHERE g.batch_id = %s""",
        (batch_id,),
    )
    return rows[0] if rows else {}
