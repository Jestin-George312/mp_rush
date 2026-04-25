"""
F2 — Department-Level Progress Monitoring & Compliance
"""
from config.database import query


def get_department_overview(dept_id: int):
    rows = query(
        """SELECT d.name AS department_name,
                  COUNT(DISTINCT b.id)::int AS total_batches,
                  COUNT(DISTINCT g.id)::int AS total_groups,
                  COUNT(DISTINCT p.id)::int AS total_projects,
                  COALESCE(ROUND(AVG(p.progress)), 0)::int AS avg_progress,
                  COUNT(DISTINCT CASE WHEN ap.risk_level = 'healthy' THEN p.id END)::int AS healthy_count,
                  COUNT(DISTINCT CASE WHEN ap.risk_level = 'warning' THEN p.id END)::int AS warning_count,
                  COUNT(DISTINCT CASE WHEN ap.risk_level IN ('at_risk','critical') THEN p.id END)::int AS at_risk_count,
                  COALESCE(ROUND(100.0 * COUNT(DISTINCT CASE WHEN doc.status='Approved' THEN doc.id END) /
                      NULLIF(COUNT(DISTINCT doc.id), 0)), 0)::int AS doc_approval_rate,
                  COALESCE(ROUND(100.0 * COUNT(DISTINCT CASE WHEN t.status='done' THEN t.id END) /
                      NULLIF(COUNT(DISTINCT t.id), 0)), 0)::int AS task_completion_rate
           FROM departments d
           LEFT JOIN batches b ON b.department_id = d.id
           LEFT JOIN groups g ON g.batch_id = b.id
           LEFT JOIN projects p ON p.group_id = g.id
           LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
           LEFT JOIN documents doc ON doc.project_id = p.id
           LEFT JOIN tasks t ON t.project_id = p.id
           WHERE d.id = %s GROUP BY d.name""",
        (dept_id,),
    )
    return rows[0] if rows else None


def get_batch_progress_comparison(dept_id: int) -> list:
    rows = query(
        """SELECT b.id AS batch_id, b.name AS batch_name,
                  COUNT(DISTINCT g.id)::int AS group_count,
                  COUNT(DISTINCT p.id)::int AS project_count,
                  COALESCE(ROUND(AVG(p.progress)), 0)::int AS avg_progress,
                  COUNT(DISTINCT CASE WHEN t.status='done' THEN t.id END)::int AS done_tasks,
                  COUNT(DISTINCT t.id)::int AS total_tasks,
                  COUNT(DISTINCT CASE WHEN doc.status='Approved' THEN doc.id END)::int AS approved_docs,
                  COUNT(DISTINCT doc.id)::int AS total_docs,
                  COUNT(DISTINCT CASE WHEN ap.risk_level IN ('at_risk','critical') THEN p.id END)::int AS at_risk_projects
           FROM batches b
           LEFT JOIN groups g ON g.batch_id = b.id
           LEFT JOIN projects p ON p.group_id = g.id
           LEFT JOIN tasks t ON t.project_id = p.id
           LEFT JOIN documents doc ON doc.project_id = p.id
           LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
           WHERE b.department_id = %s GROUP BY b.id, b.name ORDER BY b.name""",
        (dept_id,),
    )
    for r in rows:
        r["task_completion_rate"] = round(r["done_tasks"] / r["total_tasks"] * 100) if r["total_tasks"] > 0 else 0
        r["doc_approval_rate"] = round(r["approved_docs"] / r["total_docs"] * 100) if r["total_docs"] > 0 else 0
    return rows


def get_compliance_report(batch_id: int) -> list:
    rows = query(
        """SELECT g.id AS group_id, g.group_name, p.title AS project_title, p.progress,
                  pr.full_name AS guide_name,
                  COUNT(DISTINCT t.id)::int AS total_tasks,
                  COUNT(DISTINCT CASE WHEN t.status='done' THEN t.id END)::int AS done_tasks,
                  COUNT(DISTINCT CASE WHEN t.deadline < CURRENT_DATE AND t.status != 'done' THEN t.id END)::int AS overdue_tasks,
                  COUNT(DISTINCT doc.id)::int AS total_docs,
                  COUNT(DISTINCT CASE WHEN doc.status='Approved' THEN doc.id END)::int AS approved_docs,
                  COALESCE(ap.risk_score, 0) AS risk_score,
                  COALESCE(ap.risk_level, 'unknown') AS risk_level
           FROM groups g
           LEFT JOIN projects p ON p.group_id = g.id
           LEFT JOIN profiles pr ON pr.u_id = g.guide_id
           LEFT JOIN tasks t ON t.project_id = p.id
           LEFT JOIN documents doc ON doc.project_id = p.id
           LEFT JOIN ai_predictions ap ON ap.entity_id = p.id AND ap.entity_type = 'project'
           WHERE g.batch_id = %s
           GROUP BY g.id, g.group_name, p.title, p.progress, pr.full_name, ap.risk_score, ap.risk_level
           ORDER BY COALESCE(ap.risk_score, 0) DESC""",
        (batch_id,),
    )
    for r in rows:
        r["task_completion_rate"] = round(r["done_tasks"] / r["total_tasks"] * 100) if r["total_tasks"] > 0 else 0
    return rows


def get_phase_wise_progress(batch_id: int) -> list:
    rows = query(
        """SELECT dl.phase, dl.title, dl.due_date, dl.due_date < CURRENT_DATE AS is_past,
                  COUNT(DISTINCT doc.id) FILTER (WHERE doc.status='Approved')::int AS approved,
                  COUNT(DISTINCT doc.id) FILTER (WHERE doc.status='Pending')::int AS pending,
                  COUNT(DISTINCT doc.id) FILTER (WHERE doc.status='Rejected')::int AS rejected,
                  (SELECT COUNT(DISTINCT g.id) FROM groups g WHERE g.batch_id = %s)::int AS total_groups
           FROM deadlines dl LEFT JOIN documents doc ON doc.deadline_id = dl.id
           WHERE dl.batch_id = %s
           GROUP BY dl.id, dl.phase, dl.title, dl.due_date ORDER BY dl.due_date ASC""",
        (batch_id, batch_id),
    )
    for r in rows:
        r["submission_rate"] = round(r["approved"] / r["total_groups"] * 100) if r["total_groups"] > 0 else 0
    return rows
