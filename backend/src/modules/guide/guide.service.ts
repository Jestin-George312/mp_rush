import pool from '../../config/db';

const getHealthLabel = (daysOverdue: number, hasRepo: boolean) => {
    if (daysOverdue > 3) return 'At Risk';
    if (daysOverdue > 0 || !hasRepo) return 'Warning';
    return 'Healthy';
};

export const getGuideStats = async (guideId: number) => {
    const [batchesRes, groupsRes, topicsRes, docsRes, deadlinesRes, riskRes] = await Promise.all([
        pool.query(`SELECT COUNT(DISTINCT batch_id)::int AS count FROM groups WHERE guide_id = $1 AND batch_id IS NOT NULL`, [guideId]),
        pool.query(`SELECT COUNT(*)::int AS count FROM groups WHERE guide_id = $1`, [guideId]),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM projects p
             JOIN groups g ON g.id = p.group_id
             WHERE g.guide_id = $1 AND COALESCE(p.review_state, 'Pending') = 'Pending'`,
            [guideId]
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM documents d
             JOIN projects p ON p.id = d.project_id
             JOIN groups g ON g.id = p.group_id
             WHERE g.guide_id = $1 AND d.status = 'Pending'`,
            [guideId]
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM deadlines dl
             JOIN groups g ON g.batch_id = dl.batch_id
             WHERE g.guide_id = $1 AND dl.due_date >= CURRENT_DATE`,
            [guideId]
        ),
        pool.query(
            `SELECT COUNT(DISTINCT g.id)::int AS count
             FROM groups g
             LEFT JOIN projects p ON p.group_id = g.id
             LEFT JOIN tasks t ON t.project_id = p.id
             WHERE g.guide_id = $1 AND t.deadline < CURRENT_DATE AND t.status != 'done'`,
            [guideId]
        ),
    ]);

    return {
        assignedBatches: batchesRes.rows[0]?.count || 0,
        totalGroups: groupsRes.rows[0]?.count || 0,
        pendingTopics: topicsRes.rows[0]?.count || 0,
        pendingReviews: docsRes.rows[0]?.count || 0,
        upcomingDeadlines: deadlinesRes.rows[0]?.count || 0,
        atRiskGroups: riskRes.rows[0]?.count || 0,
    };
};

export const getAssignedBatches = async (guideId: number) => {
    const result = await pool.query(
        `SELECT
            b.id,
            b.name,
            COUNT(DISTINCT g.id)::int AS "groupCount",
            COUNT(DISTINCT gm.student_id)::int AS "studentCount",
            COALESCE(ROUND(100.0 * SUM(CASE WHEN d.status = 'Approved' THEN 1 ELSE 0 END) / NULLIF(COUNT(d.id), 0)), 0)::int AS "submissionProgress",
            SUM(CASE WHEN d.status = 'Pending' THEN 1 ELSE 0 END)::int AS "pendingReviews"
         FROM groups g
         JOIN batches b ON b.id = g.batch_id
         LEFT JOIN group_members gm ON gm.group_id = g.id
         LEFT JOIN projects p ON p.group_id = g.id
         LEFT JOIN documents d ON d.project_id = p.id
         WHERE g.guide_id = $1
         GROUP BY b.id, b.name
         ORDER BY b.name`,
        [guideId]
    );
    return result.rows;
};

export const getBatchGroups = async (guideId: number, batchId: number) => {
    const result = await pool.query(
        `SELECT
            g.id,
            g.group_name AS name,
            b.id AS "batchId",
            b.name AS "batchName",
            p.title,
            p.github_repo AS "repoUrl",
            p.review_state AS status,
            MAX(t.deadline < CURRENT_DATE AND t.status != 'done')::int AS overdue_flag,
            COALESCE(
                json_agg(pr.full_name ORDER BY pr.full_name) FILTER (WHERE pr.full_name IS NOT NULL),
                '[]'
            ) AS members
         FROM groups g
         JOIN batches b ON b.id = g.batch_id
         LEFT JOIN group_members gm ON gm.group_id = g.id
         LEFT JOIN profiles pr ON pr.u_id = gm.student_id
         LEFT JOIN projects p ON p.group_id = g.id
         LEFT JOIN tasks t ON t.project_id = p.id
         WHERE g.guide_id = $1 AND g.batch_id = $2
         GROUP BY g.id, g.group_name, b.id, b.name, p.title, p.github_repo, p.review_state
         ORDER BY g.group_name`,
        [guideId, batchId]
    );

    return result.rows.map((row) => ({
        ...row,
        health: getHealthLabel(row.overdue_flag ? 4 : 0, Boolean(row.repoUrl)),
    }));
};

export const getPendingTopics = async (guideId: number) => {
    const result = await pool.query(
        `SELECT
            p.id,
            b.name AS "batchName",
            g.group_name AS "groupName",
            p.title,
            p.domain,
            p.description,
            p.created_at AS "submittedAt",
            COALESCE(p.review_state, 'Pending') AS status,
            COALESCE(
                json_agg(pr.full_name ORDER BY pr.full_name) FILTER (WHERE pr.full_name IS NOT NULL),
                '[]'
            ) AS members
         FROM projects p
         JOIN groups g ON g.id = p.group_id
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN group_members gm ON gm.group_id = g.id
         LEFT JOIN profiles pr ON pr.u_id = gm.student_id
         WHERE g.guide_id = $1 AND COALESCE(p.review_state, 'Pending') = 'Pending'
         GROUP BY p.id, b.name, g.group_name, p.title, p.domain, p.description, p.created_at, p.review_state
         ORDER BY p.created_at DESC`,
        [guideId]
    );
    return result.rows;
};

export const reviewTopic = async (
    guideId: number,
    projectId: number,
    action: 'approve' | 'reject' | 'revision',
    note?: string
) => {
    const mapping = {
        approve: { status: 'approved', reviewState: 'Approved' },
        reject: { status: 'rejected', reviewState: 'Rejected' },
        revision: { status: 'pending', reviewState: 'Revision Requested' },
    } as const;

    const target = mapping[action];

    const result = await pool.query(
        `UPDATE projects p
         SET status = $1::project_status,
             review_state = $2,
             topic_feedback = $3,
             topic_reviewed_at = NOW(),
             updated_at = NOW()
         FROM groups g
         WHERE p.id = $4
           AND g.id = p.group_id
           AND g.guide_id = $5
         RETURNING p.*`,
        [target.status, target.reviewState, note || null, projectId, guideId]
    );
    if (result.rows.length === 0) throw new Error('Topic not found');
    return result.rows[0];
};

export const getSupervisedGroups = async (guideId: number) => {
    const groupsRes = await pool.query(
        `SELECT g.id, g.group_name, g.batch_id, b.name AS batch_name, p.title, p.github_repo, p.review_state
         FROM groups g
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN projects p ON p.group_id = g.id
         WHERE g.guide_id = $1
         ORDER BY g.group_name`,
        [guideId]
    );

    const groups = [];
    for (const row of groupsRes.rows) {
        const membersRes = await pool.query(
            `SELECT p.full_name
             FROM group_members gm
             LEFT JOIN profiles p ON p.u_id = gm.student_id
             WHERE gm.group_id = $1
             ORDER BY p.full_name`,
            [row.id]
        );

        groups.push({
            id: row.id,
            name: row.group_name,
            batchId: row.batch_id,
            batchName: row.batch_name,
            title: row.title,
            members: membersRes.rows.map((member) => member.full_name),
            repoUrl: row.github_repo,
            status: row.review_state || 'Pending',
            health: getHealthLabel(0, Boolean(row.github_repo)),
        });
    }
    return groups;
};

export const getGroupDetails = async (guideId: number, groupId: number) => {
    const groupRes = await pool.query(
        `SELECT g.*, b.name AS batch_name, p.id AS project_id, p.title, p.description, p.review_state, p.github_repo
         FROM groups g
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN projects p ON p.group_id = g.id
         WHERE g.id = $1 AND g.guide_id = $2`,
        [groupId, guideId]
    );
    if (groupRes.rows.length === 0) throw new Error('Group not found');

    const membersRes = await pool.query(
        `SELECT u.uid, u.email, pr.full_name, gm.is_leader
         FROM group_members gm
         JOIN users u ON u.uid = gm.student_id
         LEFT JOIN profiles pr ON pr.u_id = u.uid
         WHERE gm.group_id = $1
         ORDER BY gm.is_leader DESC, pr.full_name`,
        [groupId]
    );

    const docsRes = await pool.query(
        `SELECT id, name, status, feedback, created_at
         FROM documents
         WHERE project_id = $1
         ORDER BY created_at DESC`,
        [groupRes.rows[0].project_id]
    );

    const tasksRes = await pool.query(
        `SELECT id, title, status, priority, deadline
         FROM tasks
         WHERE project_id = $1
         ORDER BY deadline ASC NULLS LAST`,
        [groupRes.rows[0].project_id]
    );

    return {
        ...groupRes.rows[0],
        members: membersRes.rows,
        documents: docsRes.rows,
        tasks: tasksRes.rows,
    };
};

export const getPendingDocuments = async (guideId: number) => {
    const result = await pool.query(
        `SELECT
            d.id,
            d.name,
            d.status,
            d.created_at,
            p.title AS project_title,
            g.group_name,
            b.name AS batch_name,
            dl.title AS deadline_title
         FROM documents d
         JOIN projects p ON p.id = d.project_id
         JOIN groups g ON g.id = p.group_id
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN deadlines dl ON dl.id = d.deadline_id
         WHERE g.guide_id = $1 AND d.status = 'Pending'
         ORDER BY d.created_at DESC`,
        [guideId]
    );
    return result.rows;
};

export const reviewDocument = async (
    guideId: number,
    docId: number,
    status: 'Approved' | 'Rejected',
    feedback?: string
) => {
    const result = await pool.query(
        `UPDATE documents d
         SET status = $1,
             feedback = $2,
             reviewed_by = $3,
             reviewed_at = NOW()
         FROM projects p
         JOIN groups g ON g.id = p.group_id
         WHERE d.id = $4
           AND p.id = d.project_id
           AND g.guide_id = $3
         RETURNING d.*`,
        [status, feedback || null, guideId, docId]
    );
    if (result.rows.length === 0) throw new Error('Document not found');
    return result.rows[0];
};

export const getGitMonitoring = async (guideId: number) => {
    const result = await pool.query(
        `SELECT
            g.id AS group_id,
            g.group_name,
            p.title,
            p.github_repo,
            p.updated_at
         FROM groups g
         LEFT JOIN projects p ON p.group_id = g.id
         WHERE g.guide_id = $1
         ORDER BY p.updated_at DESC NULLS LAST, g.group_name`,
        [guideId]
    );

    return result.rows.map((row) => ({
        groupId: row.group_id,
        groupName: row.group_name,
        title: row.title,
        repoUrl: row.github_repo,
        lastCommit: row.github_repo
            ? {
                  message: 'Latest sync available',
                  author: 'APMS Mock Tracker',
                  date: row.updated_at,
              }
            : null,
    }));
};

export const getGroupKanban = async (guideId: number, groupId: number) => {
    const tasksRes = await pool.query(
        `SELECT t.*
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         JOIN groups g ON g.id = p.group_id
         WHERE g.id = $1 AND g.guide_id = $2
         ORDER BY t.deadline ASC NULLS LAST`,
        [groupId, guideId]
    );

    const tasks = tasksRes.rows;
    return {
        todo: tasks.filter((task) => task.status === 'todo'),
        inprogress: tasks.filter((task) => task.status === 'inprogress'),
        done: tasks.filter((task) => task.status === 'done'),
    };
};
