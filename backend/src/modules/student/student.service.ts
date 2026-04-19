import pool from '../../config/db';
import { UPLOAD_URL_PREFIX } from '../../config/storage';

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
                gp.full_name AS guide_name
         FROM group_members gm
         JOIN groups g ON g.id = gm.group_id
         LEFT JOIN projects p ON p.group_id = g.id
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN profiles gp ON gp.u_id = g.guide_id
         WHERE gm.student_id = $1
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

    const nextDeadline = project?.batch_id
        ? await pool.query(
              `SELECT title, due_date
               FROM deadlines
               WHERE batch_id = $1 AND due_date >= CURRENT_DATE
               ORDER BY due_date ASC
               LIMIT 1`,
              [project.batch_id]
          )
        : { rows: [] as any[] };

    const unreadMessages = project?.group_id
        ? await pool.query(`SELECT COUNT(*)::int AS count FROM messages WHERE group_id = $1`, [project.group_id])
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
        nextDeadline: nextDeadline.rows[0]?.due_date || null,
        kanbanTasks: taskMap,
        unreadMessages: unreadMessages.rows[0]?.count || 0,
    };
};

export const getStudentProject = async (studentId: number) => {
    const project = await getStudentProjectRow(studentId);
    if (!project) return null;

    const membersRes = await pool.query(
        `SELECT u.uid, p.full_name, u.email, gm.is_leader
         FROM group_members gm
         JOIN users u ON u.uid = gm.student_id
         LEFT JOIN profiles p ON p.u_id = u.uid
         WHERE gm.group_id = $1
         ORDER BY gm.is_leader DESC, p.full_name ASC`,
        [project.group_id]
    );

    return {
        id: String(project.id || project.group_id),
        title: project.title || 'Untitled Project',
        description: project.description || '',
        status: project.review_state || 'Pending',
        mode: membersRes.rows.length > 1 ? 'Group' : 'Individual',
        batchName: project.batch_name || 'Unassigned Batch',
        guideName: project.guide_name || null,
        members: membersRes.rows.map((member) => ({
            uid: String(member.uid),
            full_name: member.full_name || 'Unnamed Student',
            email: member.email,
            is_leader: member.is_leader,
        })),
        github_repo: project.github_repo || undefined,
    };
};

export const createStudentProject = async (
    studentId: number,
    data: { title: string; description: string; mode: string; memberEmails?: string[] }
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

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

            const newGroupRes = await client.query(
                `INSERT INTO groups (group_name) VALUES ($1) RETURNING id`,
                [groupName]
            );
            groupId = newGroupRes.rows[0].id;

            await client.query(
                `INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, TRUE)`,
                [groupId, studentId]
            );
        }

        if (data.mode === 'Group' && Array.isArray(data.memberEmails)) {
            const membersRes = await client.query(
                `SELECT uid FROM users WHERE email = ANY($1::text[])`,
                [data.memberEmails]
            );
            for (const member of membersRes.rows) {
                await client.query(
                    `INSERT INTO group_members (group_id, student_id, is_leader)
                     VALUES ($1, $2, FALSE)
                     ON CONFLICT (group_id, student_id) DO NOTHING`,
                    [groupId, member.uid]
                );
            }
        }

        const projectRes = await client.query(
            `INSERT INTO projects (group_id, title, description, submitted_by, status, review_state)
             VALUES ($1, $2, $3, $4, 'pending', 'Pending')
             RETURNING *`,
            [groupId, data.title, data.description, studentId]
        );

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
        `SELECT d.*, dl.title AS deadline_title, dl.due_date
         FROM documents d
         LEFT JOIN deadlines dl ON dl.id = d.deadline_id
         WHERE d.project_id = $1
         ORDER BY d.created_at DESC`,
        [project.id]
    );
    return result.rows;
};

export const createStudentSubmission = async (
    studentId: number,
    data: { deadlineId?: number | null; filename: string; originalname: string }
) => {
    const project = await getStudentProjectRow(studentId);
    if (!project?.id) throw new Error('Project not found for student');

    const fileUrl = `${UPLOAD_URL_PREFIX}/${data.filename}`;
    const result = await pool.query(
        `INSERT INTO documents (project_id, uploaded_by, name, file_path, type, status, deadline_id)
         VALUES ($1, $2, $3, $4, 'Other', 'Pending', $5)
         RETURNING *`,
        [project.id, studentId, data.originalname, fileUrl, data.deadlineId || null]
    );
    return result.rows[0];
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
        [project.id, data.title, data.priority || 'Medium', data.deadline || null, data.assigned_to || null, studentId]
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

    return [
        {
            id: `${project.id}-1`,
            message: 'Initial repository sync',
            author: 'APMS Mock Tracker',
            date: project.updated_at || project.created_at,
            repoUrl: project.github_repo,
        },
    ];
};
