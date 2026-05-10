"""
F3 — At-Risk Student / Project Identification

Multi-factor risk scoring engine:
  1. Overdue tasks          — weight 30
  2. Progress vs timeline   — weight 25
  3. Missing documents      — weight 20
  4. No guide assigned      — weight 10
  5. Inactivity             — weight 15
"""
import json
from datetime import datetime, timezone
from config.database import query, execute
from config.settings import get_risk_thresholds


def _clamp(val, lo, hi):
    return max(lo, min(hi, val))


def _classify(score: float, thresholds: dict) -> str:
    if score < thresholds["healthy"]:
        return "healthy"
    if score < thresholds["warning"]:
        return "warning"
    if score < thresholds["at_risk"]:
        return "at_risk"
    return "critical"


def _compute_factors(proj: dict) -> dict:
    pid = proj["project_id"]
    bid = proj.get("batch_id")

    # Factor 1: Overdue tasks (weight 30)
    task_rows = query(
        """SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE deadline < CURRENT_DATE AND status != 'done')::int AS overdue
           FROM tasks WHERE project_id = %s""",
        (pid,),
    )
    total_tasks = task_rows[0]["total"] if task_rows else 0
    overdue_tasks_cnt = task_rows[0]["overdue"] if task_rows else 0
    ratio = overdue_tasks_cnt / total_tasks if total_tasks > 0 else 0
    overdue_tasks = _clamp(ratio * 30, 0, 30)

    # Factor 2: Progress vs timeline (weight 25)
    progress_gap = 0.0
    if bid:
        dl_rows = query("SELECT MAX(due_date) AS final_deadline FROM deadlines WHERE batch_id = %s", (bid,))
        final = dl_rows[0]["final_deadline"] if dl_rows else None
        if final:
            created = proj["created_at"]
            if isinstance(created, str):
                created = datetime.fromisoformat(created)
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            deadline_dt = datetime.combine(final, datetime.min.time()).replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            total_span = max((deadline_dt - created).total_seconds(), 1)
            elapsed = (now - created).total_seconds()
            time_pct = min(elapsed / total_span * 100, 100)
            gap = max(0, time_pct - (proj.get("progress") or 0))
            progress_gap = _clamp(gap / 100 * 25, 0, 25)

    # Factor 3: Missing documents (weight 20)
    if bid:
        doc_rows = query(
            """SELECT COUNT(*)::int AS missed
               FROM deadlines dl
               LEFT JOIN documents d ON d.deadline_id = dl.id AND d.project_id = %s AND d.status = 'Approved'
               WHERE dl.batch_id = %s AND dl.due_date < CURRENT_DATE AND d.id IS NULL""",
            (pid, bid),
        )
        missed = doc_rows[0]["missed"] if doc_rows else 0
    else:
        missed = 0
    missing_docs = _clamp(missed * 7, 0, 20)

    # Factor 4: No guide (weight 10)
    no_guide = 0 if proj.get("guide_id") else 10

    # Factor 5: Inactivity (weight 15)
    act_rows = query(
        """SELECT MAX(latest) AS last_active FROM (
               SELECT MAX(created_at) AS latest FROM tasks     WHERE project_id = %s
               UNION ALL
               SELECT MAX(created_at) AS latest FROM documents WHERE project_id = %s
               UNION ALL
               SELECT MAX(created_at) AS latest FROM meetings  WHERE project_id = %s
               UNION ALL
               SELECT %s::timestamptz AS latest
           ) sub""",
        (pid, pid, pid, proj["created_at"]),
    )
    last_active = act_rows[0]["last_active"] if act_rows and act_rows[0]["last_active"] else proj["created_at"]
    if isinstance(last_active, str):
        last_active = datetime.fromisoformat(last_active)
    if last_active.tzinfo is None:
        last_active = last_active.replace(tzinfo=timezone.utc)
    days_inactive = (datetime.now(timezone.utc) - last_active).days
    inactivity = _clamp(days_inactive * 1.5, 0, 15)

    return {
        "overdue_tasks": round(overdue_tasks, 2),
        "progress_gap": round(progress_gap, 2),
        "missing_docs": round(missing_docs, 2),
        "no_guide": no_guide,
        "inactivity": round(inactivity, 2),
    }


# ── Core: compute risk for every active project ───────────
def compute_risk_scores() -> int:
    thresholds = get_risk_thresholds()
    projects = query(
        """SELECT p.id AS project_id, p.progress, p.created_at, p.review_state,
                  g.id AS group_id, g.guide_id, b.id AS batch_id
           FROM projects p
           JOIN groups g ON g.id = p.group_id
           LEFT JOIN batches b ON b.id = g.batch_id
           WHERE p.status != 'rejected'"""
    )
    updated = 0
    for proj in projects:
        factors = _compute_factors(proj)
        score = _clamp(sum(factors.values()), 0, 100)
        level = _classify(score, thresholds)
        execute(
            """INSERT INTO ai_predictions (entity_type, entity_id, risk_score, risk_level, factors, predicted_at)
               VALUES ('project', %s, %s, %s, %s, NOW())
               ON CONFLICT (entity_type, entity_id)
               DO UPDATE SET risk_score = %s, risk_level = %s, factors = %s, predicted_at = NOW()""",
            (proj["project_id"], score, level, json.dumps(factors),
             score, level, json.dumps(factors)),
        )
        updated += 1

    execute(
        "INSERT INTO ai_audit_log (action, details) VALUES ('risk_scoring_batch', %s)",
        (json.dumps({"projects_scored": updated}),),
    )
    return updated


# ── Trigger single project update ──────────────────────────
def trigger_risk_update(project_id: int):
    thresholds = get_risk_thresholds()
    rows = query(
        """SELECT p.id AS project_id, p.progress, p.created_at, p.review_state,
                  g.id AS group_id, g.guide_id, b.id AS batch_id
           FROM projects p JOIN groups g ON g.id = p.group_id
           LEFT JOIN batches b ON b.id = g.batch_id WHERE p.id = %s""",
        (project_id,),
    )
    if not rows:
        return
    factors = _compute_factors(rows[0])
    score = _clamp(sum(factors.values()), 0, 100)
    level = _classify(score, thresholds)
    execute(
        """INSERT INTO ai_predictions (entity_type, entity_id, risk_score, risk_level, factors, predicted_at)
           VALUES ('project', %s, %s, %s, %s, NOW())
           ON CONFLICT (entity_type, entity_id)
           DO UPDATE SET risk_score = %s, risk_level = %s, factors = %s, predicted_at = NOW()""",
        (project_id, score, level, json.dumps(factors), score, level, json.dumps(factors)),
    )


# ── Query helpers ──────────────────────────────────────────
def get_at_risk_projects(dept_id: int = None, batch_id: int = None) -> list:
    conditions, params = [], []
    if dept_id:
        params.append(dept_id)
        conditions.append(f"b.department_id = %s")
    if batch_id:
        params.append(batch_id)
        conditions.append(f"b.id = %s")
    where = f"AND {' AND '.join(conditions)}" if conditions else ""
    return query(
        f"""SELECT ap.entity_id AS project_id, ap.risk_score, ap.risk_level, ap.factors,
                   ap.predicted_at, p.title, p.progress, g.group_name,
                   g.guide_id, gp.full_name AS guide_name, b.name AS batch_name
            FROM ai_predictions ap
            JOIN projects p ON p.id = ap.entity_id AND ap.entity_type = 'project'
            JOIN groups g ON g.id = p.group_id
            LEFT JOIN batches b ON b.id = g.batch_id
            LEFT JOIN profiles gp ON gp.u_id = g.guide_id
            WHERE ap.risk_level != 'healthy' {where}
            ORDER BY ap.risk_score DESC""",
        tuple(params) if params else None,
    )


def get_student_risk_profile(student_id: int) -> list:
    return query(
        """SELECT ap.risk_score, ap.risk_level, ap.factors,
                  p.id AS project_id, p.title, p.progress, g.group_name
           FROM group_members gm
           JOIN groups g ON g.id = gm.group_id
           JOIN projects p ON p.group_id = g.id
           LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
           WHERE gm.student_id = %s""",
        (student_id,),
    )


def get_guide_group_risks(guide_id: int) -> list:
    return query(
        """SELECT ap.entity_id AS project_id, ap.risk_score, ap.risk_level, ap.factors,
                  p.title, p.progress, g.id AS group_id, g.group_name
           FROM groups g
           JOIN projects p ON p.group_id = g.id
           LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
           WHERE g.guide_id = %s
           ORDER BY ap.risk_score DESC NULLS LAST""",
        (guide_id,),
    )


def get_risk_trends(days_back: int = 30) -> dict:
    history = query(
        """SELECT DATE(performed_at) AS date,
                  (details->>'projects_scored')::int AS projects_scored
           FROM ai_audit_log
           WHERE action = 'risk_scoring_batch'
             AND performed_at >= CURRENT_DATE - %s
           ORDER BY performed_at ASC""",
        (days_back,),
    )
    distribution = query(
        """SELECT risk_level, COUNT(*)::int AS count,
                  ROUND(AVG(risk_score), 2) AS avg_score
           FROM ai_predictions WHERE entity_type = 'project'
           GROUP BY risk_level ORDER BY avg_score DESC"""
    )
    return {"history": history, "distribution": distribution}
