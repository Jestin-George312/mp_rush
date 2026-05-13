import pool from '../../config/db';
import * as notificationService from '../notifications/notification.service';
import { UPLOAD_URL_PREFIX, UPLOAD_DIR } from '../../config/storage';
import { uploadToDrive } from '../../services/googleDrive.service';
import path from 'path';

const getHealthLabel = (daysOverdue: number, hasRepo: boolean) => {
    if (daysOverdue > 3) return 'At Risk';
    if (daysOverdue > 0) return 'Warning';
    return 'Healthy';
};

export const getGuideStats = async (guideId: number) => {
    const [batchesRes, groupsRes, topicsRes, docsRes, deadlinesRes, riskRes] = await Promise.all([
        pool.query(`SELECT COUNT(DISTINCT batch_id)::int AS count FROM batch_faculty WHERE faculty_id = $1`, [guideId]),
        pool.query(`SELECT COUNT(*)::int AS count FROM groups WHERE guide_id = $1`, [guideId]),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM projects p
             JOIN groups g ON g.id = p.group_id
             LEFT JOIN group_members gm ON gm.group_id = g.id
             LEFT JOIN users u ON u.uid = gm.student_id
             WHERE (g.guide_id = $1 OR u.temp_guide_id = $1) 
               AND COALESCE(p.review_state, 'Pending') IN ('Pending', 'Revision Requested')`,
            [guideId]
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM documents d
             JOIN projects p ON p.id = d.project_id
             JOIN groups g ON g.id = p.group_id
             LEFT JOIN group_members gm ON gm.group_id = g.id
             LEFT JOIN users u ON u.uid = gm.student_id
             WHERE (g.guide_id = $1 OR u.temp_guide_id = $1) AND d.status = 'Pending'`,
            [guideId]
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM deadlines dl
             JOIN batch_faculty bf ON bf.batch_id = dl.batch_id
             WHERE bf.faculty_id = $1 AND dl.due_date >= CURRENT_DATE`,
            [guideId]
        ),
        pool.query(
            `SELECT COUNT(DISTINCT g.id)::int AS count
             FROM groups g
             LEFT JOIN projects p ON p.group_id = g.id
             LEFT JOIN tasks t ON t.project_id = p.id
             LEFT JOIN group_members gm ON gm.group_id = g.id
             LEFT JOIN users u ON u.uid = gm.student_id
             WHERE (g.guide_id = $1 OR u.temp_guide_id = $1) AND t.deadline < CURRENT_DATE AND t.status != 'done'`,
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
            b.start_year AS year,
            CASE WHEN b.is_active THEN 'Active' ELSE 'Closed' END AS status,
            b.project_type_mode AS mode,
            COUNT(DISTINCT g.id)::int AS "groupCount",
            COUNT(DISTINCT gm.student_id)::int AS "studentCount",
            COALESCE(ROUND(100.0 * SUM(CASE WHEN d.status = 'Approved' THEN 1 ELSE 0 END) / NULLIF(COUNT(d.id), 0)), 0)::int AS "submissionProgress",
            SUM(CASE WHEN d.status = 'Pending' THEN 1 ELSE 0 END)::int AS "pendingReviews"
         FROM batch_faculty bf
         JOIN batches b ON b.id = bf.batch_id
         LEFT JOIN groups g ON g.batch_id = b.id AND g.guide_id = $1
         LEFT JOIN group_members gm ON gm.group_id = g.id
         LEFT JOIN projects p ON p.group_id = g.id
         LEFT JOIN documents d ON d.project_id = p.id
         WHERE bf.faculty_id = $1
         GROUP BY b.id, b.name, b.start_year, b.is_active, b.project_type_mode
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

export const getTopics = async (guideId: number, status: string = 'Pending') => {
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
            (p.updated_at > COALESCE(p.topic_reviewed_at, p.created_at) + interval '10 seconds') AS "isResubmitted",
            COALESCE(
                json_agg(pr.full_name ORDER BY pr.full_name) FILTER (WHERE pr.full_name IS NOT NULL),
                '[]'
            ) AS members
         FROM projects p
         JOIN groups g ON g.id = p.group_id
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN group_members gm ON gm.group_id = g.id
         LEFT JOIN profiles pr ON pr.u_id = gm.student_id
         LEFT JOIN users u ON u.uid = gm.student_id
         WHERE (g.guide_id = $1 OR u.temp_guide_id = $1) 
           AND (
             ($2 = 'Pending' AND COALESCE(p.review_state, 'Pending') IN ('Pending', 'Revision Requested'))
             OR ($2 != 'Pending' AND p.review_state = $2)
           )
         GROUP BY p.id, b.name, g.group_name, p.title, p.domain, p.description, p.created_at, p.review_state
         ORDER BY p.created_at DESC`,
        [guideId, status]
    );
    return result.rows;
};

export const getPendingTopics = async (guideId: number) => {
    return getTopics(guideId, 'Pending');
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
         LEFT JOIN group_members gm ON gm.group_id = g.id
         LEFT JOIN users u ON u.uid = gm.student_id
         WHERE p.id = $4
           AND g.id = p.group_id
           AND (g.guide_id = $5 OR u.temp_guide_id = $5)
         RETURNING p.*, g.id AS gid`,
        [target.status, target.reviewState, note || null, projectId, guideId]
    );
    if (result.rows.length === 0) throw new Error('Topic not found');

    const project = result.rows[0];
    await notificationService.notifyGroupMembers(
        project.gid,
        'topic_reviewed',
        `Topic ${target.reviewState}`,
        `Your project topic has been marked as ${target.reviewState}. Feedback: ${note || 'None'}`,
        'project',
        projectId
    );

    return project;
};

export const markProjectCompleted = async (guideId: number, projectId: number) => {
    const result = await pool.query(
        `UPDATE projects p
         SET status = 'completed',
             updated_at = NOW()
         FROM groups g
         WHERE p.id = $1
           AND g.id = p.group_id
           AND g.guide_id = $2
         RETURNING p.*, g.id AS gid`,
        [projectId, guideId]
    );
    if (result.rows.length === 0) throw new Error('Project not found or not authorized');

    const project = result.rows[0];
    await notificationService.notifyGroupMembers(
        project.gid,
        'project_completed',
        'Project Marked Completed',
        `Your project has been marked as completed by your guide.`,
        'project',
        projectId
    );

    return project;
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
        `SELECT g.*, b.name AS batch_name, p.id AS project_id, p.title, p.description, p.domain, p.review_state, p.github_repo
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

export const getPendingDocuments = async (guideId: number, statusFilter: string = 'Pending') => {
    const isPendingOnly = statusFilter === 'Pending';
    const result = await pool.query(
        `SELECT
            d.id,
            d.name,
            d.status,
            d.feedback,
            d.created_at,
            d.reviewed_at,
            d.file_path,
            d.marked_file_path,
            p.title AS project_title,
            g.group_name,
            b.name AS batch_name,
            dl.title AS deadline_title
         FROM documents d
         JOIN projects p ON p.id = d.project_id
         JOIN groups g ON g.id = p.group_id
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN deadlines dl ON dl.id = d.deadline_id
         WHERE g.guide_id = $1 ${isPendingOnly ? "AND d.status = 'Pending'" : ''}
         ORDER BY d.created_at DESC`,
        [guideId]
    );
    return result.rows;
};

export const reviewDocument = async (
    guideId: number,
    docId: number,
    status: 'Approved' | 'Rejected' | 'Needs Revision',
    feedback?: string,
    fileData?: { filename: string; originalname: string }
) => {
    let finalFeedback = feedback || '';
    let markedFilePath: string | null = null;

    if (fileData) {
        const localFilePath = path.join(UPLOAD_DIR, fileData.filename);
        let driveLink = '';
        
        try {
            const ext = path.extname(fileData.originalname).toLowerCase();
            let mimeType = 'application/octet-stream';
            if (ext === '.pdf') mimeType = 'application/pdf';
            else if (ext === '.doc') mimeType = 'application/msword';
            else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (ext === '.png') mimeType = 'image/png';
            else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

            const driveRes = await uploadToDrive(localFilePath, `Marked_${fileData.originalname}`, mimeType);
            driveLink = driveRes.link as string;
        } catch (error: any) {
            console.error('Drive upload failed for marked doc:', error.message);
            // Fallback to local URL if drive fails
            driveLink = `${UPLOAD_URL_PREFIX}/${fileData.filename}`;
        }

        if (driveLink) {
            markedFilePath = driveLink;
        }
    }

    const result = await pool.query(
        `UPDATE documents d
         SET status = $1,
             feedback = $2,
             marked_file_path = $3,
             reviewed_by = $4,
             reviewed_at = NOW()
         FROM projects p
         JOIN groups g ON g.id = p.group_id
         WHERE d.id = $5
           AND p.id = d.project_id
           AND g.guide_id = $4
         RETURNING d.*`,
        [status, finalFeedback || null, markedFilePath, guideId, docId]
    );
    if (result.rows.length === 0) throw new Error('Document not found');

    const doc = result.rows[0];
    if (doc.uploaded_by) {
        await notificationService.createNotification({
            user_id: doc.uploaded_by,
            type: 'doc_reviewed',
            title: `Document ${status}`,
            message: `Your document "${doc.name}" has been ${status}. Feedback: ${feedback || 'None'}`,
            ref_type: 'document',
            ref_id: docId
        });
    }

    return doc;
};

export const getGitMonitoring = async (guideId: number) => {
    const result = await pool.query(
        `SELECT
            g.id AS group_id,
            g.group_name,
            p.id AS project_id,
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
        projectId: row.project_id,
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

export const getUpcomingDeadlines = async (guideId: number) => {
    const result = await pool.query(
        `SELECT
            dl.id,
            dl.title,
            dl.due_date,
            b.name AS batch_name,
            COUNT(DISTINCT g.id)::int AS total_groups,
            COUNT(DISTINCT d.id) FILTER (WHERE d.id IS NOT NULL)::int AS submitted_count
         FROM deadlines dl
         JOIN batches b ON b.id = dl.batch_id
         JOIN batch_faculty bf ON bf.batch_id = b.id AND bf.faculty_id = $1
         LEFT JOIN groups g ON g.batch_id = b.id AND g.guide_id = $1
         LEFT JOIN projects p ON p.group_id = g.id
         LEFT JOIN documents d ON d.project_id = p.id AND d.deadline_id = dl.id
         WHERE dl.due_date >= CURRENT_DATE
         GROUP BY dl.id, dl.title, dl.due_date, b.name
         ORDER BY dl.due_date ASC
         LIMIT 5`,
        [guideId]
    );
    return result.rows;
};
// ── Extension Requests ─────────────────────────────────────
export const getExtensionRequests = async (guideId: number) => {
    const result = await pool.query(
        `SELECT er.*, g.group_name, dl.title AS deadline_title, dl.due_date AS current_deadline
         FROM extension_requests er
         JOIN groups g ON g.id = er.group_id
         JOIN deadlines dl ON dl.id = er.deadline_id
         WHERE g.guide_id = $1 AND er.status = 'pending'
         ORDER BY er.created_at DESC`,
        [guideId]
    );
    return result.rows;
};

export const reviewExtensionRequest = async (
    guideId: number,
    requestId: number,
    status: 'approved' | 'rejected'
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE extension_requests er
             SET status = $1, reviewed_by = $2, reviewed_at = NOW()
             FROM groups g
             WHERE er.id = $3 AND g.id = er.group_id AND g.guide_id = $2
             RETURNING er.*, g.id AS gid`,
            [status, guideId, requestId]
        );
        if (result.rows.length === 0) throw new Error('Extension request not found');

        const req = result.rows[0];

        if (status === 'approved') {
            await client.query(
                `INSERT INTO group_deadline_overrides (group_id, deadline_id, effective_date, extension_request_id)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (group_id, deadline_id) 
                 DO UPDATE SET effective_date = EXCLUDED.effective_date, extension_request_id = EXCLUDED.extension_request_id`,
                [req.gid, req.deadline_id, req.proposed_date, req.id]
            );
        }

        await notificationService.notifyGroupMembers(
            req.gid,
            'extension_reviewed',
            `Extension ${status}`,
            `Your extension request for milestone has been ${status}.`,
            'extension',
            req.id
        );

        await client.query('COMMIT');
        return req;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
