import pool from '../../config/db';
import * as notificationService from '../notifications/notification.service';
import { UPLOAD_URL_PREFIX, UPLOAD_DIR } from '../../config/storage';
import { uploadToDrive } from '../../services/googleDrive.service';
import { fetchCommits } from '../projects/github.service';
import path from 'path';

const getStudentGroup = async (studentId: number) => {
    const result = await pool.query(
        `SELECT g.id, g.group_name, g.batch_id, g.guide_id
         FROM group_members gm
         JOIN groups g ON g.id = gm.group_id
         WHERE gm.student_id = $1
         LIMIT 1`,
        [studentId]
    );
    return result.rows[0] || null;
};

const getStudentProjectRow = async (studentId: number) => {
    const result = await pool.query(
        `SELECT p.*, g.id AS group_id, g.group_name, g.batch_id, b.name AS batch_name,
                COALESCE(gp.full_name, tgp.full_name) AS guide_name,
                tgp.full_name AS temp_guide_name,
                u.temp_guide_id
         FROM users u
         LEFT JOIN group_members gm ON gm.student_id = u.uid
         LEFT JOIN groups g ON g.id = gm.group_id
         LEFT JOIN projects p ON p.group_id = g.id
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN profiles gp ON gp.u_id = g.guide_id
         LEFT JOIN profiles tgp ON tgp.u_id = u.temp_guide_id
         WHERE u.uid = $1
         ORDER BY p.created_at DESC NULLS LAST
         LIMIT 1`,
        [studentId]
    );
    return result.rows[0] || null;
};

export const getStudentStats = async (studentId: number) => {
    const project = await getStudentProjectRow(studentId);

    const taskCounts = project?.id
        ? await pool.query(
              `SELECT status, COUNT(*)::int AS count
               FROM tasks
               WHERE project_id = $1
               GROUP BY status`,
              [project.id]
          )
        : { rows: [] as any[] };

    const taskMap = { todo: 0, inProgress: 0, done: 0 };
    for (const row of taskCounts.rows) {
        if (row.status === 'todo') taskMap.todo = row.count;
        if (row.status === 'inprogress') taskMap.inProgress = row.count;
        if (row.status === 'done') taskMap.done = row.count;
    }

    // Get student's batch_id and name from users table
    const userBatchRes = await pool.query(`SELECT b.id, b.name FROM users u JOIN batches b ON b.id = u.batch_id WHERE u.uid = $1`, [studentId]);
    const userBatchId = userBatchRes.rows[0]?.id;
    const batchName = userBatchRes.rows[0]?.name;

    const nextDeadline = userBatchId
        ? await pool.query(
              `SELECT title, due_date
               FROM deadlines
               WHERE batch_id = $1 AND due_date >= CURRENT_DATE
               ORDER BY due_date ASC
               LIMIT 1`,
              [userBatchId]
          )
        : { rows: [] as any[] };

    const pendingDeadlines = userBatchId
        ? await pool.query(
              `SELECT COUNT(*)::int AS count
               FROM deadlines
               WHERE batch_id = $1 AND due_date >= CURRENT_DATE`,
              [userBatchId]
          )
        : { rows: [{ count: 0 }] };

    const unreadMessages = project?.group_id
        ? await pool.query(`SELECT COUNT(*)::int AS count FROM messages WHERE group_id = $1`, [project.group_id])
        : { rows: [{ count: 0 }] };

    const unreadFeedback = await pool.query(
        `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE AND type IN ('feedback', 'comment', 'review')`,
        [studentId]
    );

    const pendingInvitations = await pool.query(
        `SELECT COUNT(*)::int AS count FROM group_invitations WHERE invitee_id = $1 AND status = 'pending'`,
        [studentId]
    );

    const memberCount = project?.group_id
        ? await pool.query(`SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = $1`, [project.group_id])
        : { rows: [{ count: 0 }] };

    const leaderRes = await pool.query(
        `SELECT is_leader
         FROM group_members
         WHERE student_id = $1
         LIMIT 1`,
        [studentId]
    );

    return {
        hasProject: Boolean(project?.id),
        isLeader: Boolean(leaderRes.rows[0]?.is_leader),
        projectStatus: project?.review_state || 'Pending',
        progress: project?.progress || 0,
        hasRepo: Boolean(project?.github_repo),
        memberCount: memberCount.rows[0]?.count || 0,
        nextDeadline: nextDeadline.rows[0]?.due_date || null,
        pendingDeadlinesCount: pendingDeadlines.rows[0]?.count || 0,
        unreadFeedbackCount: unreadFeedback.rows[0]?.count || 0,
        pendingInvitationsCount: pendingInvitations.rows[0]?.count || 0,
        kanbanTasks: taskMap,
        unreadMessages: unreadMessages.rows[0]?.count || 0,
        batchName: batchName || 'Unassigned Batch',
        systemStatus: project?.github_repo ? 'Active Sync' : 'Waiting for Repo'
    };
};

export const getStudentProject = async (studentId: number) => {
    const project = await getStudentProjectRow(studentId);
    if (!project) return null;

    const membersRes = await pool.query(
        `SELECT u.uid, p.full_name, u.email, gm.is_leader,
                (SELECT COUNT(*)::int FROM tasks WHERE (assigned_to = u.uid OR (assigned_to IS NULL AND created_by = u.uid)) AND project_id = $2 AND status = 'done') as tasks_done
         FROM group_members gm
         JOIN users u ON u.uid = gm.student_id
         LEFT JOIN profiles p ON p.u_id = u.uid
         WHERE gm.group_id = $1
         ORDER BY gm.is_leader DESC, p.full_name ASC`,
        [project.group_id, project.id]
    );

    // Fetch and count commits per member
    let allCommits: any[] = [];
    if (project.github_repo) {
        try {
            allCommits = await fetchCommits(project.github_repo);
        } catch (e) {
            console.error('getStudentProject: GitHub fetch failed');
        }
    }

    const members = membersRes.rows.map((member) => {
        // Simple name matching for commits
        const name = member.full_name?.toLowerCase() || '';
        let memberCommits = allCommits.filter(c => 
            c.author?.toLowerCase().includes(name) || 
            name.includes(c.author?.toLowerCase())
        ).length;

        // Fallback: If individual project, attribute all commits to the only member
        if (membersRes.rows.length === 1) {
            memberCommits = allCommits.length;
        }

        return {
            uid: String(member.uid),
            full_name: member.full_name || 'Unnamed Student',
            email: member.email,
            is_leader: member.is_leader,
            tasks_done: member.tasks_done || 0,
            commits_count: memberCommits
        };
    });

    // Calculate team activity percentage (tasks done vs total tasks across the project)
    const totalTasksRes = await pool.query(`SELECT COUNT(*)::int as count FROM tasks WHERE project_id = $1`, [project.id]);
    const totalTasks = totalTasksRes.rows[0]?.count || 0;
    
    // Total done tasks for the whole project
    const totalDoneRes = await pool.query(`SELECT COUNT(*)::int as count FROM tasks WHERE project_id = $1 AND status = 'done'`, [project.id]);
    const totalDone = totalDoneRes.rows[0]?.count || 0;
    
    const teamActivity = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

    // Get guide email
    const guideEmailRes = project.guide_id 
        ? await pool.query(`SELECT email FROM users WHERE uid = $1`, [project.guide_id])
        : { rows: [] };
    const guideEmail = guideEmailRes.rows[0]?.email || 'support@apms.edu';

    return {
        id: String(project.id),
        groupId: project.group_id,
        title: project.title || 'Untitled Project',
        description: project.description || '',
        domain: project.domain || null,
        status: project.review_state || 'Pending',
        topicFeedback: project.topic_feedback || null,
        createdAt: project.created_at,
        reviewedAt: project.topic_reviewed_at,
        mode: members.length > 1 ? 'Group' : 'Individual',
        batchName: project.batch_name || 'Unassigned Batch',
        guideName: project.guide_name || null,
        guideEmail: guideEmail,
        members: members,
        github_repo: project.github_repo || undefined,
        teamActivity: teamActivity
    };
};

export const createStudentProject = async (
    studentId: number,
    data: { 
        title: string; 
        description: string; 
        domain: string;
        mode: string; 
        memberEmails?: string[];
        githubRepo?: string;
    }
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Resolve the student's batch and check submission window/mode
        const batchRes = await client.query(
            `SELECT b.* FROM batches b JOIN users u ON u.batch_id = b.id WHERE u.uid = $1`,
            [studentId]
        );
        const batch = batchRes.rows[0];

        if (!batch) {
            throw new Error('You are not assigned to any academic batch.');
        }

        // 1. Check Submission Window
        const now = new Date();
        if (batch.topic_submission_start && now < new Date(batch.topic_submission_start)) {
            throw new Error(`Topic submission has not started yet. It opens on ${new Date(batch.topic_submission_start).toLocaleString()}.`);
        }
        if (batch.topic_submission_end && now > new Date(batch.topic_submission_end)) {
            throw new Error('Topic submission window has closed.');
        }

        // 2. Check Project Mode
        const mode = data.mode.toLowerCase(); // 'individual' or 'group'
        const allowedMode = batch.project_type_mode.toLowerCase(); // 'individual', 'group', or 'mixed'

        if (allowedMode !== 'mixed' && mode !== allowedMode) {
            throw new Error(`This batch only allows ${allowedMode} projects.`);
        }

        let group = await client.query(
            `SELECT g.id, g.group_name
             FROM group_members gm
             JOIN groups g ON g.id = gm.group_id
             WHERE gm.student_id = $1
             LIMIT 1`,
            [studentId]
        );

        let groupId = group.rows[0]?.id;

        if (!groupId) {
            const profileRes = await client.query(`SELECT full_name FROM profiles WHERE u_id = $1`, [studentId]);
            const groupName = data.mode === 'Group'
                ? `${profileRes.rows[0]?.full_name || 'Student'} Team`
                : `${profileRes.rows[0]?.full_name || 'Student'} Solo`;

            // Resolve guide: use temp_guide_id if available, otherwise auto-assign from batch_faculty
            const studentRow = await client.query(`SELECT temp_guide_id FROM users WHERE uid = $1`, [studentId]);
            let guideId = studentRow.rows[0]?.temp_guide_id || null;

            if (!guideId) {
                // Auto-assign a guide from batch_faculty using round-robin based on current group count
                const facultyRes = await client.query(
                    `SELECT f.faculty_id FROM batch_faculty f
                     JOIN users u ON u.uid = f.faculty_id
                     WHERE f.batch_id = $1 AND LOWER(u.account_status) = 'active'
                     ORDER BY f.faculty_id`,
                    [batch.id]
                );
                if (facultyRes.rows.length > 0) {
                    const groupCountRes = await client.query(
                        `SELECT COUNT(*)::int AS cnt FROM groups WHERE batch_id = $1`, [batch.id]
                    );
                    const idx = (groupCountRes.rows[0]?.cnt || 0) % facultyRes.rows.length;
                    guideId = facultyRes.rows[idx].faculty_id;

                    // Also set this student's temp_guide_id for consistency
                    await client.query(`UPDATE users SET temp_guide_id = $1 WHERE uid = $2`, [guideId, studentId]);
                }
            }

            const newGroupRes = await client.query(
                `INSERT INTO groups (group_name, batch_id, guide_id) VALUES ($1, $2, $3) RETURNING id`,
                [groupName, batch.id, guideId]
            );
            groupId = newGroupRes.rows[0].id;

            await client.query(
                `INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, TRUE)`,
                [groupId, studentId]
            );
        }

        if (data.mode === 'Group' && Array.isArray(data.memberEmails)) {
            const membersRes = await client.query(
                `SELECT uid FROM users WHERE email = ANY($1::text[]) AND uid != $2`,
                [data.memberEmails, studentId]
            );
            for (const member of membersRes.rows) {
                await client.query(
                    `INSERT INTO group_invitations (group_id, inviter_id, invitee_id)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (group_id, invitee_id) DO NOTHING`,
                    [groupId, studentId, member.uid]
                );

                await notificationService.createNotification({
                    user_id: member.uid,
                    type: 'invitation',
                    title: 'Group Invitation',
                    message: `You have been invited to join the project "${data.title}" by another student.`,
                    ref_type: 'group',
                    ref_id: groupId
                });
            }
        }

        // 3. Create or Update Project
        const existingProject = await client.query(
            `SELECT id FROM projects WHERE group_id = $1`, [groupId]
        );

        let projectRes;
        if (existingProject.rows.length > 0) {
            // Update existing project
            projectRes = await client.query(
                `UPDATE projects 
                 SET title = $2, 
                     domain = $3, 
                     description = $4, 
                     submitted_by = $5, 
                     github_repo = $6,
                     status = 'pending', 
                     review_state = 'Pending',
                     updated_at = NOW()
                 WHERE id = $1
                 RETURNING *`,
                [existingProject.rows[0].id, data.title, data.domain || null, data.description, studentId, data.githubRepo || null]
            );

            // Notify the guide about the resubmission
            const project = projectRes.rows[0];
            const guideRes = await client.query(`SELECT guide_id FROM groups WHERE id = $1`, [groupId]);
            const guideId = guideRes.rows[0]?.guide_id;
            
            if (guideId) {
                await notificationService.createNotification({
                    user_id: guideId,
                    type: 'topic_resubmitted',
                    title: 'Topic Resubmitted',
                    message: `The student has updated and resubmitted their project topic: "${data.title}".`,
                    ref_type: 'project',
                    ref_id: project.id
                });
            }
        } else {
            // Insert new project
            projectRes = await client.query(
                `INSERT INTO projects (group_id, title, domain, description, submitted_by, github_repo, status, review_state)
                 VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'Pending')
                 RETURNING *`,
                [groupId, data.title, data.domain || null, data.description, studentId, data.githubRepo || null]
            );
        }

        await client.query('COMMIT');
        return projectRes.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getStudentSubmissions = async (studentId: number) => {
    const project = await getStudentProjectRow(studentId);
    if (!project?.id) return [];

    const result = await pool.query(
        `SELECT d.id, d.name, d.type, d.status, d.feedback, d.marked_file_path, d.file_path, d.created_at, dl.title AS deadline_title, dl.due_date
         FROM documents d
         LEFT JOIN deadlines dl ON dl.id = d.deadline_id
         WHERE d.project_id = $1
         ORDER BY d.created_at DESC`,
        [project.id]
    );
    return result.rows;
};

export const getStudentFeedback = async (studentId: number) => {
    const project = await getStudentProjectRow(studentId);
    if (!project?.id) return [];

    const feedback: any[] = [];

    // 1. Topic Feedback (from projects table)
    if (project.topic_feedback || project.review_state === 'Rejected' || project.review_state === 'Approved') {
        feedback.push({
            id: `topic-${project.id}`,
            artifact: project.title,
            deadline: 'Topic Abstract',
            guide: project.guide_name || 'Assigned Guide',
            date: project.topic_reviewed_at ? new Date(project.topic_reviewed_at).toISOString().split('T')[0] : project.created_at.toISOString().split('T')[0],
            status: project.review_state === 'Approved' ? 'Approved' : (project.review_state === 'Rejected' ? 'Action Required' : 'Pending'),
            comments: project.topic_feedback ? [{ text: project.topic_feedback, time: 'Latest Review' }] : []
        });
    }

    // 2. Document Feedback (from documents table)
    const docsRes = await pool.query(
        `SELECT d.*, dl.title AS deadline_title, pr.full_name AS reviewer_name
         FROM documents d
         LEFT JOIN deadlines dl ON dl.id = d.deadline_id
         LEFT JOIN profiles pr ON pr.u_id = d.reviewed_by
         WHERE d.project_id = $1 AND (d.feedback IS NOT NULL OR d.status != 'Pending')
         ORDER BY d.reviewed_at DESC NULLS LAST`,
        [project.id]
    );

    for (const doc of docsRes.rows) {
        feedback.push({
            id: `doc-${doc.id}`,
            artifact: doc.name,
            deadline: doc.deadline_title || 'General Submission',
            guide: doc.reviewer_name || project.guide_name || 'Assigned Guide',
            date: doc.reviewed_at ? new Date(doc.reviewed_at).toISOString().split('T')[0] : new Date(doc.created_at).toISOString().split('T')[0],
            status: doc.status === 'Approved' ? 'Approved' : (doc.status === 'Rejected' || doc.status === 'Needs Revision' ? 'Action Required' : 'Pending'),
            file_path: doc.file_path,
            marked_file_path: doc.marked_file_path || null,
            comments: doc.feedback ? [{ text: doc.feedback, time: 'Latest Review' }] : []
        });
    }

    return feedback;
};

export const deleteStudentSubmission = async (studentId: number, docId: number) => {
    // Ensure the document belongs to the student's project
    const project = await getStudentProjectRow(studentId);
    if (!project?.id) throw new Error('Project not found for student');

    const result = await pool.query(
        `DELETE FROM documents WHERE id = $1 AND project_id = $2 AND uploaded_by = $3 RETURNING *`,
        [docId, project.id, studentId]
    );
    if (result.rowCount === 0) {
        throw new Error('Document not found or you do not have permission to delete it');
    }
    return result.rows[0];
};
export const createStudentSubmission = async (
    studentId: number,
    data: { deadlineId?: number | null; filename: string; originalname: string; documentName: string }
) => {
    const project = await getStudentProjectRow(studentId);
    if (!project?.id) throw new Error('Project not found for student');

    const localFilePath = path.join(UPLOAD_DIR, data.filename);
    const fileUrl = `${UPLOAD_URL_PREFIX}/${data.filename}`;

    let driveData = { id: null, link: null };
    try {
        // Determine mime type based on extension
        const ext = path.extname(data.originalname).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.pdf') mimeType = 'application/pdf';
        else if (ext === '.doc') mimeType = 'application/msword';
        else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

        console.log(`Uploading ${data.originalname} to Google Drive...`);
        const driveRes = await uploadToDrive(localFilePath, data.originalname, mimeType);
        driveData = { id: driveRes.id as any, link: driveRes.link as any };
        console.log(`Drive upload success: ${driveData.id}`);
    } catch (error: any) {
        console.error('Drive upload failed, continuing with local only:', error.message);
    }

    try {
        const result = await pool.query(
            `INSERT INTO documents (project_id, uploaded_by, name, file_path, type, status, deadline_id, drive_file_id, drive_link)
             VALUES ($1, $2, $3, $4, 'Other', 'Pending', $5, $6, $7)
             RETURNING *`,
            [project.id, studentId, data.documentName || data.originalname, fileUrl, data.deadlineId || null, driveData.id, driveData.link]
        );
        return result.rows[0];
    } catch (err: any) {
        if (err.code === '23505') {
            throw new Error(`A document with the name "${data.documentName}" already exists in your project.`);
        }
        throw err;
    }
};

export const getStudentTasks = async (studentId: number) => {
    const project = await getStudentProjectRow(studentId);
    if (!project?.id) return [];

    const result = await pool.query(
        `SELECT * FROM tasks
         WHERE project_id = $1
         ORDER BY
             CASE status WHEN 'todo' THEN 1 WHEN 'inprogress' THEN 2 WHEN 'done' THEN 3 END,
             deadline ASC NULLS LAST`,
        [project.id]
    );
    return result.rows;
};

export const createStudentTask = async (
    studentId: number,
    data: { title: string; priority?: string; deadline?: string; assigned_to?: number }
) => {
    const project = await getStudentProjectRow(studentId);
    if (!project?.id) throw new Error('Project not found for student');

    const result = await pool.query(
        `INSERT INTO tasks (project_id, title, priority, deadline, assigned_to, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [project.id, data.title, data.priority || 'Medium', data.deadline || null, data.assigned_to || studentId, studentId]
    );
    return result.rows[0];
};

export const updateStudentTask = async (
    studentId: number,
    taskId: number,
    data: { status?: string; title?: string; priority?: string; deadline?: string | null }
) => {
    const project = await getStudentProjectRow(studentId);
    if (!project?.id) throw new Error('Project not found for student');

    const result = await pool.query(
        `UPDATE tasks
         SET
            status = COALESCE($1::task_status, status),
            title = COALESCE($2, title),
            priority = COALESCE($3::task_priority, priority),
            deadline = COALESCE($4::date, deadline)
         WHERE id = $5 AND project_id = $6
         RETURNING *`,
        [data.status || null, data.title || null, data.priority || null, data.deadline || null, taskId, project.id]
    );
    if (result.rows.length === 0) throw new Error('Task not found');
    return result.rows[0];
};

export const linkStudentRepository = async (studentId: number, repoUrl: string) => {
    const project = await getStudentProjectRow(studentId);
    if (!project?.id) throw new Error('Project not found for student');

    const result = await pool.query(
        `UPDATE projects
         SET github_repo = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, github_repo`,
        [repoUrl, project.id]
    );
    return result.rows[0];
};

export const getStudentGitCommits = async (studentId: number) => {
    const project = await getStudentProjectRow(studentId);
    if (!project?.id || !project.github_repo) return [];

    try {
        const commits = await fetchCommits(project.github_repo);
        return commits;
    } catch (err: any) {
        console.error('getStudentGitCommits: GitHub fetch failed:', err.message);
        return [];
    }
};

// ── Get pending invitations ──────────────────────────────────
export const getInvitations = async (studentId: number) => {
    const result = await pool.query(
        `SELECT gi.id, gi.group_id, gi.inviter_id, gi.created_at,
                p.title AS project_title, pr.full_name AS inviter_name
         FROM group_invitations gi
         JOIN groups g ON g.id = gi.group_id
         LEFT JOIN projects p ON p.group_id = g.id
         LEFT JOIN profiles pr ON pr.u_id = gi.inviter_id
         WHERE gi.invitee_id = $1 AND gi.status = 'pending'
         ORDER BY gi.created_at DESC`,
        [studentId]
    );
    return result.rows;
};

// ── Respond to invitation ────────────────────────────────────
export const respondToInvitation = async (studentId: number, invitationId: number, accept: boolean) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const inv = await client.query(
            `UPDATE group_invitations SET status = $1 WHERE id = $2 AND invitee_id = $3 AND status = 'pending' RETURNING *`,
            [accept ? 'accepted' : 'declined', invitationId, studentId]
        );
        if (inv.rows.length === 0) throw new Error('Invitation not found or already processed');

        if (accept) {
            const groupId = inv.rows[0].group_id;
            
            // Check if student is already in a group
            const check = await client.query(`SELECT 1 FROM group_members WHERE student_id = $1`, [studentId]);
            if (check.rows.length > 0) throw new Error('You are already part of a group');

            await client.query(
                `INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, FALSE)`,
                [groupId, studentId]
            );

            // Notify inviter
            await notificationService.createNotification({
                user_id: inv.rows[0].inviter_id,
                type: 'invitation',
                title: 'Invitation Accepted',
                message: `A student has accepted your group invitation.`,
                ref_type: 'group',
                ref_id: groupId
            });
        }

        await client.query('COMMIT');
        return { success: true, status: accept ? 'accepted' : 'declined' };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
// ── Extension Requests ─────────────────────────────────────
export const createExtensionRequest = async (
    studentId: number,
    data: { deadline_id: number; reason: string; requested_date: string }
) => {
    const group = await getStudentGroup(studentId);
    if (!group) throw new Error('You are not part of any group');

    const result = await pool.query(
        `INSERT INTO extension_requests (group_id, deadline_id, requested_by, reason, proposed_date)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [group.id, data.deadline_id, studentId, data.reason, data.requested_date]
    );

    // Notify guide if assigned
    if (group.guide_id) {
        await notificationService.createNotification({
            user_id: group.guide_id,
            type: 'extension',
            title: 'New Extension Request',
            message: `Group "${group.group_name}" has requested an extension for a milestone.`,
            ref_type: 'extension',
            ref_id: result.rows[0].id
        });
    }

    return result.rows[0];
};

export const getStudentDeadlines = async (studentId: number) => {
    // Get student's batch_id
    const userBatchRes = await pool.query(`SELECT batch_id FROM users WHERE uid = $1`, [studentId]);
    const userBatchId = userBatchRes.rows[0]?.batch_id;
    if (!userBatchId) return [];

    // Get student's project to check for submissions
    const project = await getStudentProjectRow(studentId);

    const result = await pool.query(
        `SELECT dl.*,
                CASE
                    WHEN d.id IS NOT NULL THEN 'Satisfied'
                    WHEN dl.due_date < CURRENT_DATE THEN 'Overdue'
                    WHEN dl.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Pending'
                    ELSE 'Upcoming'
                END as status,
                d.id as submission_id
         FROM deadlines dl
         LEFT JOIN documents d ON d.deadline_id = dl.id AND d.project_id = $2
         WHERE dl.batch_id = $1
         ORDER BY dl.due_date ASC`,
        [userBatchId, project?.id || null]
    );

    return result.rows;
};

export const getBatchMates = async (studentId: number) => {
    // Get student's batch_id
    const userBatchRes = await pool.query(`SELECT batch_id FROM users WHERE uid = $1`, [studentId]);
    const userBatchId = userBatchRes.rows[0]?.batch_id;
    if (!userBatchId) return [];

    const result = await pool.query(
        `SELECT u.uid, pr.full_name, u.email
         FROM users u
         JOIN profiles pr ON pr.u_id = u.uid
         WHERE u.batch_id = $1 AND u.role::text ILIKE 'student' AND u.uid != $2
         ORDER BY pr.full_name ASC`,
        [userBatchId, studentId]
    );

    return result.rows;
};

export const getBatchSettings = async (studentId: number) => {
    const res = await pool.query(
        `SELECT b.id, b.name, b.topic_submission_start, b.topic_submission_end, b.project_type_mode, b.max_group_size
         FROM batches b
         JOIN users u ON u.batch_id = b.id
         WHERE u.uid = $1`,
        [studentId]
    );
    return res.rows[0] || null;
};

