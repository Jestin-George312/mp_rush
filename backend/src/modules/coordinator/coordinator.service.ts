import bcrypt from 'bcrypt';
import pool from '../../config/db';

const getCoordinatorDepartmentId = async (coordinatorId: number) => {
    const res = await pool.query(`SELECT id FROM departments WHERE coordinator_id = $1 LIMIT 1`, [coordinatorId]);
    return res.rows[0]?.id || null;
};

export const getCoordinatorStats = async (coordinatorId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    const params = departmentId ? [departmentId] : [];
    const batchFilter = departmentId ? 'WHERE b.department_id = $1' : '';

    const [batchesRes, studentsRes, facultyRes, projectsRes, topicsRes, deadlinesRes, overdueRes, guideLoadRes] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count FROM batches b ${batchFilter}`, params),
        pool.query(
            `SELECT COUNT(DISTINCT gm.student_id)::int AS count
             FROM group_members gm
             JOIN groups g ON g.id = gm.group_id
             JOIN batches b ON b.id = g.batch_id
             ${batchFilter.replace('WHERE b.department_id = $1', departmentId ? 'WHERE b.department_id = $1' : '')}`,
            params
        ),
        pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE LOWER(role) = 'guide' AND is_deleted = FALSE`),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM projects p
             JOIN groups g ON g.id = p.group_id
             JOIN batches b ON b.id = g.batch_id
             ${batchFilter.replace('WHERE b.department_id = $1', departmentId ? 'WHERE b.department_id = $1' : '')}`,
            params
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM projects p
             JOIN groups g ON g.id = p.group_id
             JOIN batches b ON b.id = g.batch_id
             ${departmentId ? 'WHERE b.department_id = $1 AND COALESCE(p.review_state, \'Pending\') = \'Pending\'' : 'WHERE COALESCE(p.review_state, \'Pending\') = \'Pending\''}`,
            params
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM deadlines dl
             JOIN batches b ON b.id = dl.batch_id
             ${departmentId ? 'WHERE b.department_id = $1 AND dl.due_date >= CURRENT_DATE' : 'WHERE dl.due_date >= CURRENT_DATE'}`,
            params
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM deadlines dl
             JOIN batches b ON b.id = dl.batch_id
             ${departmentId ? 'WHERE b.department_id = $1 AND dl.due_date < CURRENT_DATE' : 'WHERE dl.due_date < CURRENT_DATE'}`,
            params
        ),
        pool.query(
            `SELECT AVG(group_count)::numeric(10,2) AS avg_load
             FROM (
                SELECT COUNT(*)::int AS group_count
                FROM groups
                WHERE guide_id IS NOT NULL
                GROUP BY guide_id
             ) x`
        ),
    ]);

    const avgLoad = Number(guideLoadRes.rows[0]?.avg_load || 0);
    const guideAvailability = avgLoad >= 8 ? 'Low' : avgLoad >= 5 ? 'Medium' : 'High';

    return {
        batches: batchesRes.rows[0]?.count || 0,
        students: studentsRes.rows[0]?.count || 0,
        faculty: facultyRes.rows[0]?.count || 0,
        activeProjects: projectsRes.rows[0]?.count || 0,
        pendingTopics: topicsRes.rows[0]?.count || 0,
        upcomingDeadlines: deadlinesRes.rows[0]?.count || 0,
        overdueSubmissions: overdueRes.rows[0]?.count || 0,
        guideAvailability,
    };
};

export const getFaculty = async () => {
    const result = await pool.query(
        `SELECT
            u.uid AS id,
            p.full_name AS name,
            u.email,
            COUNT(g.id)::int AS load,
            10 AS max,
            COALESCE(p.bio, 'General') AS special
         FROM users u
         LEFT JOIN profiles p ON p.u_id = u.uid
         LEFT JOIN groups g ON g.guide_id = u.uid
         WHERE LOWER(u.role) = 'guide' AND u.is_deleted = FALSE
         GROUP BY u.uid, p.full_name, u.email, p.bio
         ORDER BY p.full_name`
    );
    return result.rows;
};

export const createFaculty = async (data: { name: string; email: string; password_hash?: string }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const passwordHash = data.password_hash || (await bcrypt.hash('ChangeMe123!', 10));
        const userRes = await client.query(
            `INSERT INTO users (email, password_hash, auth_provider, role)
             VALUES ($1, $2, 'local', 'guide')
             RETURNING uid, email, role`,
            [data.email, passwordHash]
        );
        await client.query(
            `INSERT INTO profiles (u_id, full_name) VALUES ($1, $2)`,
            [userRes.rows[0].uid, data.name]
        );
        await client.query('COMMIT');
        return userRes.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const updateFaculty = async (id: number, data: { name?: string; bio?: string; phone?: string }) => {
    const result = await pool.query(
        `UPDATE profiles
         SET full_name = COALESCE($1, full_name),
             bio = COALESCE($2, bio),
             phone = COALESCE($3, phone)
         WHERE u_id = $4
         RETURNING *`,
        [data.name || null, data.bio || null, data.phone || null, id]
    );
    if (result.rows.length === 0) throw new Error('Faculty not found');
    return result.rows[0];
};

export const getBatches = async (coordinatorId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    const result = await pool.query(
        `SELECT b.*, d.name AS department_name
         FROM batches b
         LEFT JOIN departments d ON d.id = b.department_id
         ${departmentId ? 'WHERE b.department_id = $1' : ''}
         ORDER BY b.start_year DESC, b.name`,
        departmentId ? [departmentId] : []
    );
    return result.rows;
};

export const createBatch = async (
    coordinatorId: number,
    data: { name: string; start_year: number; end_year: number; is_active?: boolean; department_id?: number }
) => {
    const departmentId = data.department_id || (await getCoordinatorDepartmentId(coordinatorId));
    const result = await pool.query(
        `INSERT INTO batches (name, start_year, end_year, is_active, department_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [data.name, data.start_year, data.end_year, data.is_active ?? true, departmentId]
    );
    return result.rows[0];
};

export const getStudents = async (coordinatorId: number, batchId?: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    const params: any[] = [];
    const conditions: string[] = [];
    if (departmentId) {
        params.push(departmentId);
        conditions.push(`b.department_id = $${params.length}`);
    }
    if (batchId) {
        params.push(batchId);
        conditions.push(`b.id = $${params.length}`);
    }

    conditions.push(`LOWER(u.role) = 'student'`);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const result = await pool.query(
        `SELECT
            u.uid,
            p.full_name,
            u.email,
            b.id AS batch_id,
            b.name AS batch_name,
            gm.is_leader
         FROM users u
         LEFT JOIN profiles p ON p.u_id = u.uid
         LEFT JOIN group_members gm ON gm.student_id = u.uid
         LEFT JOIN groups g ON g.id = gm.group_id
         LEFT JOIN batches b ON b.id = g.batch_id
         ${where}
         ORDER BY p.full_name`,
        params
    );
    return result.rows;
};

export const createStudent = async (
    data: { name: string; email: string; password_hash?: string; batch_id?: number; is_leader?: boolean }
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const passwordHash = data.password_hash || (await bcrypt.hash('ChangeMe123!', 10));
        const userRes = await client.query(
            `INSERT INTO users (email, password_hash, auth_provider, role)
             VALUES ($1, $2, 'local', 'student')
             RETURNING uid, email, role`,
            [data.email, passwordHash]
        );
        await client.query(`INSERT INTO profiles (u_id, full_name) VALUES ($1, $2)`, [userRes.rows[0].uid, data.name]);
        if (data.batch_id) {
            const groupRes = await client.query(
                `INSERT INTO groups (group_name, batch_id) VALUES ($1, $2) RETURNING id`,
                [`${data.name} Group`, data.batch_id]
            );
            await client.query(
                `INSERT INTO group_members (group_id, student_id, is_leader) VALUES ($1, $2, $3)`,
                [groupRes.rows[0].id, userRes.rows[0].uid, data.is_leader ?? true]
            );
        }
        await client.query('COMMIT');
        return userRes.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const importStudents = async (students: Array<{ name: string; email: string; batch_id?: number }>) => {
    const created = [];
    for (const student of students) {
        created.push(await createStudent(student));
    }
    return created;
};

export const getGuideAllocations = async (batchId: number) => {
    const [guidesRes, groupsRes] = await Promise.all([
        getFaculty(),
        pool.query(
            `SELECT g.id, g.group_name, g.guide_id, p.full_name AS guide_name, pr.title AS project_title
             FROM groups g
             LEFT JOIN profiles p ON p.u_id = g.guide_id
             LEFT JOIN projects pr ON pr.group_id = g.id
             WHERE g.batch_id = $1
             ORDER BY g.group_name`,
            [batchId]
        ),
    ]);

    return { guides: guidesRes, groups: groupsRes.rows };
};

export const assignGuide = async (groupId: number, guideId: number) => {
    const result = await pool.query(
        `UPDATE groups SET guide_id = $1 WHERE id = $2 RETURNING *`,
        [guideId, groupId]
    );
    if (result.rows.length === 0) throw new Error('Group not found');
    return result.rows[0];
};

export const getProjectGroups = async (coordinatorId: number, batchId?: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    const params: any[] = [];
    const conditions: string[] = [];
    if (departmentId) {
        params.push(departmentId);
        conditions.push(`b.department_id = $${params.length}`);
    }
    if (batchId) {
        params.push(batchId);
        conditions.push(`b.id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
        `SELECT
            g.id,
            g.group_name,
            b.name AS batch_name,
            p.title,
            p.review_state,
            p.progress,
            p.github_repo,
            gp.full_name AS guide_name,
            COUNT(gm.student_id)::int AS member_count
         FROM groups g
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN projects p ON p.group_id = g.id
         LEFT JOIN profiles gp ON gp.u_id = g.guide_id
         LEFT JOIN group_members gm ON gm.group_id = g.id
         ${where}
         GROUP BY g.id, g.group_name, b.name, p.title, p.review_state, p.progress, p.github_repo, gp.full_name
         ORDER BY g.group_name`,
        params
    );
    return result.rows;
};

export const getDeadlines = async (batchId: number) => {
    const result = await pool.query(
        `SELECT * FROM deadlines WHERE batch_id = $1 ORDER BY due_date ASC`,
        [batchId]
    );
    return result.rows;
};

export const createDeadline = async (
    coordinatorId: number,
    data: { batch_id: number; title: string; description?: string; due_date: string; phase?: string }
) => {
    const result = await pool.query(
        `INSERT INTO deadlines (batch_id, title, description, due_date, phase, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [data.batch_id, data.title, data.description || null, data.due_date, data.phase || 'General', coordinatorId]
    );
    return result.rows[0];
};

export const updateDeadline = async (
    id: number,
    data: { title?: string; description?: string; due_date?: string; phase?: string }
) => {
    const result = await pool.query(
        `UPDATE deadlines
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             due_date = COALESCE($3::date, due_date),
             phase = COALESCE($4, phase)
         WHERE id = $5
         RETURNING *`,
        [data.title || null, data.description || null, data.due_date || null, data.phase || null, id]
    );
    if (result.rows.length === 0) throw new Error('Deadline not found');
    return result.rows[0];
};

export const deleteDeadline = async (id: number) => {
    const result = await pool.query(`DELETE FROM deadlines WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) throw new Error('Deadline not found');
    return { deleted: true, id };
};

export const getSubmissionAudit = async (coordinatorId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    const result = await pool.query(
        `SELECT
            d.id,
            d.name,
            d.status,
            d.created_at,
            dl.title AS deadline_title,
            b.name AS batch_name,
            g.group_name,
            p.title AS project_title
         FROM documents d
         JOIN projects p ON p.id = d.project_id
         JOIN groups g ON g.id = p.group_id
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN deadlines dl ON dl.id = d.deadline_id
         ${departmentId ? 'WHERE b.department_id = $1' : ''}
         ORDER BY d.created_at DESC`,
        departmentId ? [departmentId] : []
    );
    return result.rows;
};

export const getTopicAudit = async (coordinatorId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    const result = await pool.query(
        `SELECT
            p.id,
            p.title,
            p.review_state,
            p.topic_feedback,
            p.created_at,
            b.name AS batch_name,
            g.group_name
         FROM projects p
         JOIN groups g ON g.id = p.group_id
         LEFT JOIN batches b ON b.id = g.batch_id
         ${departmentId ? 'WHERE b.department_id = $1' : ''}
         ORDER BY p.created_at DESC`,
        departmentId ? [departmentId] : []
    );
    return result.rows;
};

export const getProjectHealth = async (coordinatorId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    const result = await pool.query(
        `SELECT
            p.id,
            p.title,
            g.group_name AS "groupName",
            MAX(CASE WHEN t.deadline < CURRENT_DATE AND t.status != 'done' THEN CURRENT_DATE - t.deadline ELSE 0 END)::int AS "daysOverdue"
         FROM projects p
         JOIN groups g ON g.id = p.group_id
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN tasks t ON t.project_id = p.id
         ${departmentId ? 'WHERE b.department_id = $1' : ''}
         GROUP BY p.id, p.title, g.group_name
         ORDER BY "daysOverdue" DESC`,
        departmentId ? [departmentId] : []
    );
    return {
        atRiskProjects: result.rows.map((row) => ({
            ...row,
            id: String(row.id),
            daysOverdue: Number(row.daysOverdue),
        })),
    };
};
