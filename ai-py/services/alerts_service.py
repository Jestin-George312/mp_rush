"""
F4 — Guide & Coordinator Alert Generation

Alert triggers with deduplication:
  - Overdue tasks
  - At-risk groups (from ai_predictions)
  - Approaching deadlines (within 3 days)
  - Inactive projects (7+ days)
  - Pending document reviews (5+ days)
  - Unassigned groups
  - Guide overload
"""
import json
from config.database import query, execute


def _alert_exists(alert_type: str, ref_type, ref_id, target_user: int) -> bool:
    rows = query(
        """SELECT 1 FROM ai_alerts
           WHERE alert_type = %s AND ref_type = %s AND ref_id = %s
             AND target_user = %s AND is_resolved = FALSE LIMIT 1""",
        (alert_type, ref_type, ref_id, target_user),
    )
    return len(rows) > 0


def _create_alert(alert: dict) -> bool:
    if _alert_exists(alert["alert_type"], alert.get("ref_type"), alert.get("ref_id"), alert["target_user"]):
        return False
    execute(
        """INSERT INTO ai_alerts (target_role, target_user, alert_type, severity, title, message, ref_type, ref_id)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
        (alert["target_role"], alert["target_user"], alert["alert_type"],
         alert["severity"], alert["title"], alert["message"],
         alert.get("ref_type"), alert.get("ref_id")),
    )
    return True


# ── Guide Alerts ───────────────────────────────────────────
def generate_guide_alerts() -> int:
    created = 0

    # 1. Overdue tasks
    rows = query(
        """SELECT g.guide_id, g.id AS group_id, g.group_name,
                  t.title AS task_title, CURRENT_DATE - t.deadline AS days_overdue
           FROM tasks t
           JOIN projects p ON p.id = t.project_id
           JOIN groups g ON g.id = p.group_id
           WHERE t.deadline < CURRENT_DATE AND t.status != 'done' AND g.guide_id IS NOT NULL
           ORDER BY days_overdue DESC"""
    )
    for r in rows:
        ok = _create_alert({
            "target_role": "guide", "target_user": r["guide_id"],
            "alert_type": "overdue",
            "severity": "critical" if r["days_overdue"] > 7 else "high",
            "title": f"Overdue task in {r['group_name']}",
            "message": f'Task "{r["task_title"]}" is {r["days_overdue"]} day(s) overdue.',
            "ref_type": "group", "ref_id": r["group_id"],
        })
        if ok: created += 1

    # 2. At-risk groups
    rows = query(
        """SELECT ap.entity_id AS project_id, ap.risk_level, ap.risk_score,
                  p.title, g.guide_id, g.id AS group_id, g.group_name
           FROM ai_predictions ap
           JOIN projects p ON p.id = ap.entity_id AND ap.entity_type = 'project'
           JOIN groups g ON g.id = p.group_id
           WHERE ap.risk_level IN ('at_risk', 'critical') AND g.guide_id IS NOT NULL"""
    )
    for r in rows:
        ok = _create_alert({
            "target_role": "guide", "target_user": r["guide_id"],
            "alert_type": "at_risk",
            "severity": "critical" if r["risk_level"] == "critical" else "high",
            "title": f"{r['group_name']} is {r['risk_level'].replace('_', ' ')}",
            "message": f'Project "{r["title"]}" has risk score {r["risk_score"]}. Immediate attention needed.',
            "ref_type": "project", "ref_id": r["project_id"],
        })
        if ok: created += 1

    # 3. Approaching deadlines (within 3 days)
    rows = query(
        """SELECT dl.id, dl.title, dl.due_date - CURRENT_DATE AS days_left,
                  g.guide_id, g.group_name, b.name AS batch_name
           FROM deadlines dl
           JOIN batches b ON b.id = dl.batch_id
           JOIN groups g ON g.batch_id = b.id AND g.guide_id IS NOT NULL
           WHERE dl.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 3"""
    )
    for r in rows:
        ok = _create_alert({
            "target_role": "guide", "target_user": r["guide_id"],
            "alert_type": "deadline",
            "severity": "high" if r["days_left"] <= 1 else "medium",
            "title": f"Deadline approaching: {r['title']}",
            "message": f'"{r["title"]}" for {r["batch_name"]} is due in {r["days_left"]} day(s).',
            "ref_type": "deadline", "ref_id": r["id"],
        })
        if ok: created += 1

    # 4. Inactive projects (7+ days)
    rows = query(
        """SELECT g.guide_id, g.id AS group_id, g.group_name, p.id AS project_id, p.title
           FROM projects p
           JOIN groups g ON g.id = p.group_id
           WHERE g.guide_id IS NOT NULL AND p.status != 'rejected'
             AND GREATEST(
                 p.updated_at,
                 COALESCE((SELECT MAX(created_at) FROM tasks WHERE project_id = p.id), p.created_at),
                 COALESCE((SELECT MAX(created_at) FROM documents WHERE project_id = p.id), p.created_at)
             ) < CURRENT_DATE - 7"""
    )
    for r in rows:
        ok = _create_alert({
            "target_role": "guide", "target_user": r["guide_id"],
            "alert_type": "inactivity", "severity": "high",
            "title": f"No activity in {r['group_name']}",
            "message": f'Project "{r["title"]}" has had no activity for 7+ days.',
            "ref_type": "project", "ref_id": r["project_id"],
        })
        if ok: created += 1

    # 5. Pending document reviews (5+ days)
    rows = query(
        """SELECT d.id AS doc_id, d.name AS doc_name,
                  CURRENT_DATE - d.created_at::date AS days_pending,
                  g.guide_id, g.group_name
           FROM documents d
           JOIN projects p ON p.id = d.project_id
           JOIN groups g ON g.id = p.group_id
           WHERE d.status = 'Pending' AND g.guide_id IS NOT NULL
             AND d.created_at::date <= CURRENT_DATE - 5"""
    )
    for r in rows:
        ok = _create_alert({
            "target_role": "guide", "target_user": r["guide_id"],
            "alert_type": "pending_review", "severity": "low",
            "title": "Document awaiting review",
            "message": f'"{r["doc_name"]}" from {r["group_name"]} pending for {r["days_pending"]} days.',
            "ref_type": "document", "ref_id": r["doc_id"],
        })
        if ok: created += 1

    execute("INSERT INTO ai_audit_log (action, details) VALUES ('generate_guide_alerts', %s)",
            (json.dumps({"alerts_created": created}),))
    return created


# ── Coordinator Alerts ─────────────────────────────────────
def generate_coordinator_alerts() -> int:
    created = 0
    coords = query(
        """SELECT u.uid, d.id AS dept_id FROM users u
           JOIN departments d ON d.coordinator_id = u.uid
           WHERE u.role = 'coordinator' AND u.is_deleted = FALSE"""
    )
    for coord in coords:
        # Unassigned groups
        rows = query(
            """SELECT g.id, g.group_name, b.name AS batch_name
               FROM groups g JOIN batches b ON b.id = g.batch_id
               WHERE g.guide_id IS NULL AND b.department_id = %s""",
            (coord["dept_id"],),
        )
        for r in rows:
            ok = _create_alert({
                "target_role": "coordinator", "target_user": coord["uid"],
                "alert_type": "unassigned", "severity": "medium",
                "title": f"Unassigned group: {r['group_name']}",
                "message": f'Group "{r["group_name"]}" in "{r["batch_name"]}" has no guide.',
                "ref_type": "group", "ref_id": r["id"],
            })
            if ok: created += 1

        # Overloaded guides
        rows = query(
            """SELECT u.uid AS guide_id, p.full_name, COUNT(g.id)::int AS load
               FROM users u LEFT JOIN profiles p ON p.u_id = u.uid
               LEFT JOIN groups g ON g.guide_id = u.uid
               WHERE u.role = 'guide' AND u.is_deleted = FALSE
               GROUP BY u.uid, p.full_name HAVING COUNT(g.id) >= 8"""
        )
        for r in rows:
            ok = _create_alert({
                "target_role": "coordinator", "target_user": coord["uid"],
                "alert_type": "workload",
                "severity": "critical" if r["load"] >= 10 else "high",
                "title": f"Guide overloaded: {r['full_name']}",
                "message": f'{r["full_name"]} is supervising {r["load"]} groups (limit: 10).',
                "ref_type": "group", "ref_id": r["guide_id"],
            })
            if ok: created += 1

        # Critical risk count
        rows = query(
            """SELECT COUNT(*)::int AS count
               FROM ai_predictions ap
               JOIN projects p ON p.id = ap.entity_id AND ap.entity_type = 'project'
               JOIN groups g ON g.id = p.group_id
               JOIN batches b ON b.id = g.batch_id
               WHERE b.department_id = %s AND ap.risk_level = 'critical'""",
            (coord["dept_id"],),
        )
        cnt = rows[0]["count"] if rows else 0
        if cnt > 0:
            ok = _create_alert({
                "target_role": "coordinator", "target_user": coord["uid"],
                "alert_type": "at_risk", "severity": "critical",
                "title": f"{cnt} critical-risk projects",
                "message": f"Your department has {cnt} project(s) at critical risk level.",
                "ref_type": "project", "ref_id": 0,
            })
            if ok: created += 1

    execute("INSERT INTO ai_audit_log (action, details) VALUES ('generate_coordinator_alerts', %s)",
            (json.dumps({"alerts_created": created}),))
    return created


# ── Query & Manage Alerts ──────────────────────────────────
def get_alerts(user_id: int, unread_only: bool = False) -> list:
    filt = "AND is_read = FALSE" if unread_only else ""
    return query(
        f"SELECT * FROM ai_alerts WHERE target_user = %s {filt} ORDER BY created_at DESC LIMIT 100",
        (user_id,),
    )


def get_unread_count(user_id: int) -> int:
    rows = query("SELECT COUNT(*)::int AS count FROM ai_alerts WHERE target_user = %s AND is_read = FALSE", (user_id,))
    return rows[0]["count"] if rows else 0


def mark_alert_read(alert_id: int):
    execute("UPDATE ai_alerts SET is_read = TRUE WHERE id = %s", (alert_id,))


def mark_all_read(user_id: int):
    execute("UPDATE ai_alerts SET is_read = TRUE WHERE target_user = %s AND is_read = FALSE", (user_id,))


def resolve_alert(alert_id: int):
    execute("UPDATE ai_alerts SET is_resolved = TRUE, is_read = TRUE WHERE id = %s", (alert_id,))
