"""
F5 — Final Submission Approval & Archival
"""
import json
from config.database import query, execute
from config.settings import get_auto_approve_rules


def check_auto_approval(project_id: int) -> dict:
    rules = get_auto_approve_rules()
    reasons = []
    proj = query("SELECT id, progress, status, review_state FROM projects WHERE id = %s", (project_id,))
    if not proj:
        return {"project_id": project_id, "eligible": False, "reasons": ["Project not found"],
                "criteria": {k: False for k in ["progress_complete", "all_tasks_done", "min_docs_approved", "topic_approved", "no_pending_revisions"]}}
    p = proj[0]

    progress_complete = (p["progress"] or 0) >= rules["min_progress"]
    if not progress_complete:
        reasons.append(f"Progress {p['progress']}%, need {rules['min_progress']}%")

    tasks = query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='done')::int AS done FROM tasks WHERE project_id = %s", (project_id,))
    t = tasks[0] if tasks else {"total": 0, "done": 0}
    all_tasks_done = t["total"] == 0 or t["done"] == t["total"]
    if not all_tasks_done:
        reasons.append(f"{t['total'] - t['done']} task(s) incomplete")

    docs = query("SELECT COUNT(*)::int AS approved FROM documents WHERE project_id = %s AND status = 'Approved'", (project_id,))
    approved_cnt = docs[0]["approved"] if docs else 0
    min_docs_approved = approved_cnt >= rules["min_docs_approved"]
    if not min_docs_approved:
        reasons.append(f"{approved_cnt} doc(s) approved, need {rules['min_docs_approved']}")

    topic_approved = p["review_state"] == "Approved"
    if not topic_approved:
        reasons.append(f'Topic state "{p["review_state"]}", needs "Approved"')

    pend = query("SELECT COUNT(*)::int AS count FROM documents WHERE project_id = %s AND status IN ('Pending','Rejected')", (project_id,))
    pend_cnt = pend[0]["count"] if pend else 0
    no_pending_revisions = pend_cnt == 0
    if not no_pending_revisions:
        reasons.append(f"{pend_cnt} doc(s) pending/rejected")

    eligible = all([progress_complete, all_tasks_done, min_docs_approved, topic_approved, no_pending_revisions])
    return {
        "project_id": project_id, "eligible": eligible,
        "reasons": ["All criteria met"] if eligible else reasons,
        "criteria": {"progress_complete": progress_complete, "all_tasks_done": all_tasks_done,
                     "min_docs_approved": min_docs_approved, "topic_approved": topic_approved,
                     "no_pending_revisions": no_pending_revisions},
    }


def batch_check_approvals(batch_id: int = None) -> dict:
    filt = "AND b.id = %s" if batch_id else ""
    params = (batch_id,) if batch_id else None
    rows = query(
        f"""SELECT p.id FROM projects p JOIN groups g ON g.id = p.group_id
            LEFT JOIN batches b ON b.id = g.batch_id WHERE p.status != 'rejected' {filt}""",
        params,
    )
    results = [check_auto_approval(r["id"]) for r in rows]
    return {"total_checked": len(results),
            "eligible": [r for r in results if r["eligible"]],
            "not_eligible": [r for r in results if not r["eligible"]]}


def auto_approve_project(project_id: int) -> dict:
    check = check_auto_approval(project_id)
    if not check["eligible"]:
        return {"success": False, "message": "Not eligible", "reasons": check["reasons"]}
    execute("UPDATE projects SET status = 'approved', updated_at = NOW() WHERE id = %s", (project_id,))
    execute("INSERT INTO ai_audit_log (action, entity_type, entity_id, details) VALUES ('auto_approve','project',%s,%s)",
            (project_id, json.dumps(check["criteria"])))
    return {"success": True, "message": "Project auto-approved", "project_id": project_id}


def archive_completed_projects(batch_id: int) -> dict:
    rows = execute(
        """UPDATE projects p SET review_state = 'Archived', updated_at = NOW()
           FROM groups g WHERE g.id = p.group_id AND g.batch_id = %s
           AND p.status = 'approved' AND p.progress = 100 AND p.review_state != 'Archived'
           RETURNING p.id, p.title""",
        (batch_id,),
    )
    if rows:
        execute("INSERT INTO ai_audit_log (action, details) VALUES ('archive_projects', %s)",
                (json.dumps({"batch_id": batch_id, "archived": rows}),))
    return {"archived_count": len(rows), "projects": rows}


def get_archive_summary(batch_id: int):
    rows = query(
        """SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE review_state='Archived')::int AS archived,
                  COUNT(*) FILTER (WHERE status='approved' AND review_state!='Archived')::int AS completed,
                  COUNT(*) FILTER (WHERE status='pending')::int AS in_progress
           FROM projects p JOIN groups g ON g.id = p.group_id WHERE g.batch_id = %s""",
        (batch_id,),
    )
    return rows[0] if rows else {}
