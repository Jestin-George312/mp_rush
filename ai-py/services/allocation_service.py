"""
F1 — Guide Allocation & Workload Balancing

Weighted scoring: capacity(40) + domain_match(30) + batch_familiarity(20) + history(10)
"""
import json
import math
from config.database import query, execute
from config.settings import get_max_guide_load


def get_suggested_allocations(batch_id: int) -> list:
    load_cfg = get_max_guide_load()
    groups = query(
        """SELECT g.id, g.group_name, p.domain
           FROM groups g LEFT JOIN projects p ON p.group_id = g.id
           WHERE g.batch_id = %s AND g.guide_id IS NULL ORDER BY g.group_name""",
        (batch_id,),
    )
    if not groups:
        return []

    guides = query(
        """SELECT u.uid AS guide_id, pr.full_name AS guide_name,
                  COALESCE(pr.bio, '') AS specialization, COUNT(g.id)::int AS current_load
           FROM users u LEFT JOIN profiles pr ON pr.u_id = u.uid
           LEFT JOIN groups g ON g.guide_id = u.uid
           WHERE u.role = 'guide' AND u.is_deleted = FALSE
           GROUP BY u.uid, pr.full_name, pr.bio
           HAVING COUNT(g.id) < %s ORDER BY COUNT(g.id) ASC""",
        (load_cfg["hard_cap"],),
    )
    familiar = {
        r["guide_id"]
        for r in query(
            "SELECT DISTINCT guide_id FROM groups WHERE batch_id = %s AND guide_id IS NOT NULL",
            (batch_id,),
        )
    }

    results = []
    for grp in groups:
        suggestions = []
        for g in guides:
            reasons, score = [], 0.0
            cap = ((load_cfg["hard_cap"] - g["current_load"]) / load_cfg["hard_cap"]) * 40
            score += cap
            if g["current_load"] < load_cfg["default"]:
                reasons.append(f"Has capacity ({g['current_load']}/{load_cfg['hard_cap']} groups)")

            if grp.get("domain") and g["specialization"]:
                if grp["domain"].lower() in g["specialization"].lower() or g["specialization"].lower() in grp["domain"].lower():
                    score += 30
                    reasons.append(f'Domain match: "{grp["domain"]}"')

            if g["guide_id"] in familiar:
                score += 20
                reasons.append("Already supervises groups in this batch")

            if grp.get("domain"):
                hist = query(
                    """SELECT COUNT(*)::int AS count FROM projects p
                       JOIN groups gr ON gr.id = p.group_id
                       WHERE gr.guide_id = %s AND LOWER(p.domain) = LOWER(%s) AND p.status = 'approved'""",
                    (g["guide_id"], grp["domain"]),
                )
                if hist and hist[0]["count"] > 0:
                    score += 10
                    reasons.append(f'Previously supervised {hist[0]["count"]} project(s) in "{grp["domain"]}"')

            suggestions.append({
                "guide_id": g["guide_id"], "guide_name": g["guide_name"],
                "current_load": g["current_load"], "max_load": load_cfg["hard_cap"],
                "score": round(score, 2), "reasons": reasons,
            })
        suggestions.sort(key=lambda x: x["score"], reverse=True)
        results.append({"group_id": grp["id"], "group_name": grp["group_name"], "suggestions": suggestions[:5]})
    return results


def auto_allocate_guides(batch_id: int) -> dict:
    allocations = get_suggested_allocations(batch_id)
    assigned, increments = [], {}
    for alloc in allocations:
        if not alloc["suggestions"]:
            continue
        best = None
        for s in alloc["suggestions"]:
            effective = s["current_load"] + increments.get(s["guide_id"], 0)
            if effective < s["max_load"]:
                best = s
                break
        if not best:
            continue
        execute("UPDATE groups SET guide_id = %s WHERE id = %s", (best["guide_id"], alloc["group_id"]))
        increments[best["guide_id"]] = increments.get(best["guide_id"], 0) + 1
        assigned.append({
            "group_id": alloc["group_id"], "group_name": alloc["group_name"],
            "guide_id": best["guide_id"], "guide_name": best["guide_name"],
        })
    execute("INSERT INTO ai_audit_log (action, details) VALUES ('auto_allocate_guides', %s)",
            (json.dumps({"batch_id": batch_id, "assignments": assigned}),))
    return {"assigned": assigned, "total": len(assigned)}


def get_workload_distribution() -> dict:
    load_cfg = get_max_guide_load()
    rows = query(
        """SELECT u.uid AS guide_id, pr.full_name AS guide_name, COUNT(g.id)::int AS current_load, %s AS max_load
           FROM users u LEFT JOIN profiles pr ON pr.u_id = u.uid LEFT JOIN groups g ON g.guide_id = u.uid
           WHERE u.role = 'guide' AND u.is_deleted = FALSE
           GROUP BY u.uid, pr.full_name ORDER BY current_load DESC""",
        (load_cfg["hard_cap"],),
    )
    loads = [r["current_load"] for r in rows]
    avg = sum(loads) / len(loads) if loads else 0
    variance = sum((l - avg) ** 2 for l in loads) / len(loads) if loads else 0
    std = math.sqrt(variance)
    return {
        "guides": rows,
        "stats": {
            "total_guides": len(rows), "average_load": round(avg, 2),
            "std_deviation": round(std, 2),
            "fairness_index": round(1 - std / max(avg, 1), 2),
        },
    }
