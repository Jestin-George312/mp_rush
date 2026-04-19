import pool from '../../config/db';

// ────────────────────────────────────────────────────────────
// POST /api/projects  — Student submits a project proposal
// ────────────────────────────────────────────────────────────
/**
 * Creates a project record tied to the student's group.
 * If the student has no group yet, creates a solo group for them first.
 */
export const submitProject = async (
    studentId: number,
    data: { title: string; domain: string; description: string; teamMembers?: string }
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Find or create a group for this student
        let groupRes = await client.query(
            `SELECT gm.group_id FROM group_members gm WHERE gm.student_id = $1 LIMIT 1`,
            [studentId]
        );

        let groupId: number;
        if (groupRes.rows.length > 0) {
            groupId = groupRes.rows[0].group_id;
        } else {
            // Create a default group named after the student
            const profileRes = await client.query(
                `SELECT full_name FROM profiles WHERE u_id = $1`,
                [studentId]
            );
            const groupName = profileRes.rows[0]?.full_name
                ? `${profileRes.rows[0].full_name}'s Group`
                : `Group-${studentId}`;

            const newGroup = await client.query(
                `INSERT INTO groups (group_name) VALUES ($1) RETURNING id`,
                [groupName]
            );
            groupId = newGroup.rows[0].id;

            await client.query(
                `INSERT INTO group_members (group_id, student_id) VALUES ($1, $2)`,
                [groupId, studentId]
            );
        }

        // 2. Insert the project
        const projectRes = await client.query(
            `INSERT INTO projects (group_id, title, domain, description, submitted_by, status, progress)
             VALUES ($1, $2, $3, $4, $5, 'pending', 0)
             RETURNING *`,
            [groupId, data.title, data.domain, data.description, studentId]
        );

        await client.query('COMMIT');
        return projectRes.rows[0];
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ────────────────────────────────────────────────────────────
// GET /api/projects  — List projects
// role=Student  → only their own group's project
// role=Guide    → all projects in their assigned groups
// role=Coordinator → all projects
// ────────────────────────────────────────────────────────────
export const listProjects = async (userId: number, role: string) => {
    let query: string;
    let params: unknown[];

    if (role === 'student') {
        query = `
            SELECT p.*, g.group_name,
                   pr.full_name AS submitter_name
            FROM projects p
            JOIN groups g ON p.group_id = g.id
            JOIN group_members gm ON g.id = gm.group_id
            LEFT JOIN profiles pr ON p.submitted_by = pr.u_id
            WHERE gm.student_id = $1
            ORDER BY p.created_at DESC
        `;
        params = [userId];
    } else if (role === 'guide') {
        query = `
            SELECT p.*, g.group_name,
                   pr.full_name AS submitter_name
            FROM projects p
            JOIN groups g ON p.group_id = g.id
            LEFT JOIN profiles pr ON p.submitted_by = pr.u_id
            WHERE g.guide_id = $1
            ORDER BY p.created_at DESC
        `;
        params = [userId];
    } else {
        // Coordinator / Admin — see everything
        query = `
            SELECT p.*, g.group_name,
                   pr.full_name AS submitter_name,
                   gp.full_name AS guide_name
            FROM projects p
            JOIN groups g ON p.group_id = g.id
            LEFT JOIN profiles pr ON p.submitted_by = pr.u_id
            LEFT JOIN profiles gp ON g.guide_id = gp.u_id
            ORDER BY p.created_at DESC
        `;
        params = [];
    }

    const result = await pool.query(query, params);
    return result.rows;
};

// ────────────────────────────────────────────────────────────
// GET /api/projects/:id  — Get single project
// ────────────────────────────────────────────────────────────
export const getProjectById = async (projectId: number) => {
    const result = await pool.query(
        `SELECT p.*, g.group_name, g.guide_id,
                gp.full_name AS guide_name,
                pr.full_name AS submitter_name
         FROM projects p
         JOIN groups g ON p.group_id = g.id
         LEFT JOIN profiles gp ON g.guide_id = gp.u_id
         LEFT JOIN profiles pr ON p.submitted_by = pr.u_id
         WHERE p.id = $1`,
        [projectId]
    );
    if (result.rows.length === 0) throw new Error('Project not found');
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// PATCH /api/projects/:id/status  — Guide approves/rejects
// ────────────────────────────────────────────────────────────
export const updateProjectStatus = async (
    projectId: number,
    status: 'approved' | 'rejected'
) => {
    const result = await pool.query(
        `UPDATE projects SET status = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [status, projectId]
    );
    if (result.rows.length === 0) throw new Error('Project not found');
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// PATCH /api/projects/:id/progress  — update % complete
// ────────────────────────────────────────────────────────────
export const updateProjectProgress = async (projectId: number, progress: number) => {
    if (progress < 0 || progress > 100) throw new Error('Progress must be 0–100');
    const result = await pool.query(
        `UPDATE projects SET progress = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [progress, projectId]
    );
    if (result.rows.length === 0) throw new Error('Project not found');
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// GET /api/groups  — Coordinator: list all groups
// ────────────────────────────────────────────────────────────
export const listGroups = async () => {
    const result = await pool.query(`
        SELECT
            g.id,
            g.group_name,
            g.guide_id,
            gp.full_name  AS guide_name,
            p.id          AS project_id,
            p.title       AS project_title,
            p.domain,
            p.status      AS project_status,
            p.progress,
            COUNT(gm.student_id)::int AS member_count
        FROM groups g
        LEFT JOIN profiles gp ON g.guide_id = gp.u_id
        LEFT JOIN projects p ON p.group_id = g.id
        LEFT JOIN group_members gm ON gm.group_id = g.id
        GROUP BY g.id, g.group_name, g.guide_id, gp.full_name,
                 p.id, p.title, p.domain, p.status, p.progress
        ORDER BY g.id
    `);
    return result.rows;
};

// ────────────────────────────────────────────────────────────
// GET /api/groups/mine  — Guide: get their assigned groups
// ────────────────────────────────────────────────────────────
export const getMyGroups = async (guideId: number) => {
    const result = await pool.query(`
        SELECT
            g.id,
            g.group_name,
            p.id          AS project_id,
            p.title       AS project_title,
            p.domain,
            p.progress,
            p.status      AS project_status,
            json_agg(
                json_build_object(
                    'id',    u.uid,
                    'name',  pr.full_name,
                    'email', u.email
                )
            ) FILTER (WHERE u.uid IS NOT NULL) AS students,
            m.next_meeting
        FROM groups g
        JOIN group_members gm ON gm.group_id = g.id
        JOIN users u ON u.uid = gm.student_id
        LEFT JOIN profiles pr ON pr.u_id = u.uid
        LEFT JOIN projects p ON p.group_id = g.id
        LEFT JOIN LATERAL (
            SELECT CONCAT(date::text, ' ', time) AS next_meeting
            FROM meetings
            WHERE group_id = g.id AND status = 'upcoming'
            ORDER BY date, time LIMIT 1
        ) m ON TRUE
        WHERE g.guide_id = $1
        GROUP BY g.id, g.group_name, p.id, p.title, p.domain, p.progress, p.status, m.next_meeting
        ORDER BY g.id
    `, [guideId]);
    return result.rows;
};

// ────────────────────────────────────────────────────────────
// PATCH /api/groups/:id/guide  — Coordinator assigns a guide
// ────────────────────────────────────────────────────────────
export const assignGuide = async (groupId: number, guideId: number | null) => {
    const result = await pool.query(
        `UPDATE groups SET guide_id = $1 WHERE id = $2 RETURNING *`,
        [guideId, groupId]
    );
    if (result.rows.length === 0) throw new Error('Group not found');
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// GET /api/projects/stats/coordinator
// ────────────────────────────────────────────────────────────
export const getCoordinatorStats = async () => {
    const batchesRes = await pool.query('SELECT COUNT(*) FROM batches');
    const totalBatches = parseInt(batchesRes.rows[0].count);

    const projectsRes = await pool.query("SELECT COUNT(*) FROM projects WHERE status != 'rejected'");
    const activeProjects = parseInt(projectsRes.rows[0].count);

    const guidesRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'guide'");
    const guidesAvailable = parseInt(guidesRes.rows[0].count);

    const pendingAllocationsRes = await pool.query('SELECT COUNT(*) FROM groups WHERE guide_id IS NULL');
    const pendingAllocations = parseInt(pendingAllocationsRes.rows[0].count);

    // At Risk Projects: where there is an overdue task
    const riskRes = await pool.query(`
        SELECT p.id, g.group_name as "groupName", p.title as "project", 
               MAX(CURRENT_DATE - t.deadline) as "daysOverdue"
        FROM projects p
        JOIN groups g ON p.group_id = g.id
        JOIN tasks t ON t.project_id = p.id
        WHERE t.deadline < CURRENT_DATE AND t.status != 'done'
        GROUP BY p.id, g.group_name, p.title
        ORDER BY "daysOverdue" DESC
    `);

    // Ensure backwards compatibility with any UI missing an ID string format
    const atRiskProjects = riskRes.rows.map((row: any) => ({
        ...row,
        id: String(row.id),
        daysOverdue: Number(row.daysOverdue)
    }));

    return {
        stats: {
            totalBatches,
            activeProjects,
            guidesAvailable,
            pendingAllocations
        },
        atRiskProjects
    };
};
