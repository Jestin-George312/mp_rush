import bcrypt from 'bcrypt';
import pool from '../../config/db';

const getCoordinatorDepartmentId = async (coordinatorId: number) => {
    const res = await pool.query(`SELECT id FROM departments WHERE coordinator_id = $1 LIMIT 1`, [coordinatorId]);
    return res.rows[0]?.id || null;
};

export const getCoordinatorStats = async (coordinatorId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    
    // Return unassigned state if coordinator has no department
    if (!departmentId) {
        return {
            isUnassigned: true,
            stats: {
                batches: 0,
                students: 0,
                faculty: 0,
                activeProjects: 0,
                pendingTopics: 0,
                upcomingDeadlines: 0,
                overdueSubmissions: 0,
                guideAvailability: 'N/A',
            },
            deadlines: [],
            faculty: []
        };
    }

    const params = [departmentId];
    const batchFilter = 'WHERE b.department_id = $1';

    const [batchesRes, studentsRes, facultyRes, projectsRes, deadlinesRes, overdueRes, guideLoadRes] = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count FROM batches b ${batchFilter}`, params),
        pool.query(
            `SELECT COUNT(DISTINCT gm.student_id)::int AS count
             FROM group_members gm
             JOIN groups g ON g.id = gm.group_id
             JOIN batches b ON b.id = g.batch_id
             ${batchFilter}`,
            params
        ),
        pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE LOWER(role::TEXT) = 'guide' `),
        pool.query(
            `SELECT 
                COUNT(*)::int AS total_projects,
                COUNT(*) FILTER (WHERE COALESCE(p.review_state, 'Pending') = 'Pending')::int AS pending_topics,
                COUNT(*) FILTER (WHERE p.status = 'approved' AND p.review_state != 'Archived')::int AS approved_projects,
                COUNT(*) FILTER (WHERE p.status = 'rejected')::int AS rejected_projects,
                COUNT(*) FILTER (WHERE p.status = 'completed')::int AS completed_projects
             FROM projects p
             JOIN groups g ON g.id = p.group_id
             JOIN batches b ON b.id = g.batch_id
             ${batchFilter}`,
            params
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM deadlines dl
             JOIN batches b ON b.id = dl.batch_id
             WHERE b.department_id = $1 AND dl.due_date >= CURRENT_DATE`,
            params
        ),
        pool.query(
            `SELECT COUNT(*)::int AS count
             FROM deadlines dl
             JOIN batches b ON b.id = dl.batch_id
             WHERE b.department_id = $1 AND dl.due_date < CURRENT_DATE`,
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

    const projectStats = projectsRes.rows[0] || {};

    const avgLoad = Number(guideLoadRes.rows[0]?.avg_load || 0);
    const guideAvailability = avgLoad >= 8 ? 'Low' : avgLoad >= 5 ? 'Medium' : 'High';

    // Fetch the detailed lists for the dashboard
    const [deadlinesList, facultyList] = await Promise.all([
        pool.query(
            `SELECT dl.id, dl.title, b.name AS batch, 
                    dl.due_date::date - CURRENT_DATE AS days_left, 
                    dl.phase AS type
             FROM deadlines dl
             JOIN batches b ON b.id = dl.batch_id
             WHERE b.department_id = $1 AND dl.due_date >= CURRENT_DATE
             ORDER BY dl.due_date ASC LIMIT 5`,
            params
        ),
        pool.query(
            `SELECT u.uid AS id, p.full_name AS name, COUNT(g.id)::int AS load
             FROM users u
             LEFT JOIN profiles p ON p.u_id = u.uid
             LEFT JOIN groups g ON g.guide_id = u.uid
             WHERE LOWER(u.role::TEXT) = 'guide' 
             GROUP BY u.uid, p.full_name
             ORDER BY load DESC LIMIT 5`
        )
    ]);

    return {
        stats: {
            batches: batchesRes.rows[0]?.count || 0,
            students: studentsRes.rows[0]?.count || 0,
            faculty: facultyRes.rows[0]?.count || 0,
            activeProjects: projectStats.total_projects || 0,
            pendingTopics: projectStats.pending_topics || 0,
            approvedProjects: projectStats.approved_projects || 0,
            rejectedProjects: projectStats.rejected_projects || 0,
            completedProjects: projectStats.completed_projects || 0,
            upcomingDeadlines: deadlinesRes.rows[0]?.count || 0,
            overdueSubmissions: overdueRes.rows[0]?.count || 0,
            guideAvailability,
        },
        deadlines: deadlinesList.rows.map(dl => ({
            ...dl,
            date: dl.days_left === 0 ? 'Today' : dl.days_left === 1 ? 'Tomorrow' : `${dl.days_left} days left`
        })),
        faculty: facultyList.rows.map(f => ({
            ...f,
             status: f.load >= 8 ? 'Full' : f.load >= 5 ? 'Normal' : 'Available',
             load: `${f.load}/10`
        }))
    };
};

export const getFaculty = async (coordinatorId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    if (!departmentId) return [];

    const result = await pool.query(
        `SELECT
            u.uid AS id,
            p.full_name AS name,
            u.email,
            u.account_status AS status,
            COUNT(g.id)::int AS load,
            10 AS max,
            COALESCE(p.bio, 'General') AS special
         FROM users u
         LEFT JOIN profiles p ON p.u_id = u.uid
         LEFT JOIN groups g ON g.guide_id = u.uid
         WHERE LOWER(u.role::TEXT) = 'guide' 
           AND (p.department = (SELECT name FROM departments WHERE id = $1) OR p.department IS NULL)
         GROUP BY u.uid, p.full_name, u.email, p.bio, u.account_status
         ORDER BY p.full_name`,
        [departmentId]
    );
    return result.rows;
};

export const createFaculty = async (data: { name: string; email: string; password?: string; password_hash?: string; batch_id?: number }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const plainPassword = data.password || 'pass123';
        const passwordHash = data.password_hash || (await bcrypt.hash(plainPassword, 10));
        const userRes = await client.query(
            `INSERT INTO users (email, password_hash, auth_provider, role, batch_id)
             VALUES ($1, $2, 'local', 'guide', $3)
             RETURNING uid, email, role, batch_id`,
            [data.email, passwordHash, data.batch_id || null]
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

export const importFaculty = async (faculty: Array<any>) => {
    const created = [];
    for (const f of faculty) {
        created.push(await createFaculty(f));
    }
    return created;
};

export const updateFaculty = async (id: number, data: { name?: string; status?: string; phone?: string }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Update profile
        if (data.name || data.phone) {
            await client.query(
                `UPDATE profiles
                 SET full_name = COALESCE($1, full_name),
                     phone = COALESCE($2, phone)
                 WHERE u_id = $3`,
                [data.name || null, data.phone || null, id]
            );
        }

        // Update account status
        if (data.status) {
            await client.query(
                `UPDATE users
                 SET account_status = $1
                 WHERE uid = $2`,
                [data.status, id]
            );
        }

        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getBatches = async (coordinatorId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    if (!departmentId) {
        return [];  // Return empty array for unassigned coordinators
    }
    const result = await pool.query(
        `SELECT b.*, d.name AS department_name
         FROM batches b
         LEFT JOIN departments d ON d.id = b.department_id
         WHERE b.department_id = $1
         ORDER BY b.start_year DESC, b.name`,
        [departmentId]
    );
    return result.rows;
};

export const createBatch = async (
    coordinatorId: number,
    data: { 
        name: string; 
        start_year: number; 
        end_year: number; 
        is_active?: boolean; 
        department_id?: number;
        topic_submission_start?: string;
        topic_submission_end?: string;
        project_type_mode?: string;
        max_group_size?: number;
    }
) => {
    const departmentId = data.department_id || (await getCoordinatorDepartmentId(coordinatorId));
    if (!departmentId) {
        throw new Error('Coordinator is not assigned to any department');
    }
    const result = await pool.query(
        `INSERT INTO batches (
            name, start_year, end_year, is_active, department_id, 
            topic_submission_start, topic_submission_end, project_type_mode, max_group_size
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
            data.name, 
            data.start_year, 
            data.end_year, 
            data.is_active ?? true, 
            departmentId,
            data.topic_submission_start || null,
            data.topic_submission_end || null,
            data.project_type_mode || 'mixed',
            data.max_group_size || 3
        ]
    );
    return result.rows[0];
};

export const updateBatch = async (
    id: number,
    data: { 
        name?: string; 
        start_year?: number; 
        end_year?: number; 
        is_active?: boolean;
        topic_submission_start?: string;
        topic_submission_end?: string;
        project_type_mode?: string;
        max_group_size?: number;
    }
) => {
    const result = await pool.query(
        `UPDATE batches
         SET name = COALESCE($1, name),
             start_year = COALESCE($2, start_year),
             end_year = COALESCE($3, end_year),
             is_active = COALESCE($4, is_active),
             topic_submission_start = COALESCE($5, topic_submission_start),
             topic_submission_end = COALESCE($6, topic_submission_end),
             project_type_mode = COALESCE($7, project_type_mode),
             max_group_size = COALESCE($8, max_group_size)
         WHERE id = $9
         RETURNING *`,
        [
            data.name || null,
            data.start_year || null,
            data.end_year || null,
            data.is_active ?? null,
            data.topic_submission_start || null,
            data.topic_submission_end || null,
            data.project_type_mode || null,
            data.max_group_size || null,
            id
        ]
    );
    if (result.rows.length === 0) throw new Error('Batch not found');
    return result.rows[0];
};

export const getBatchFaculty = async (batchId: number) => {
    const result = await pool.query(
        `SELECT u.uid AS id, p.full_name AS name, u.email, u.account_status AS status
         FROM batch_faculty bf
         JOIN users u ON u.uid = bf.faculty_id
         LEFT JOIN profiles p ON p.u_id = u.uid
         WHERE bf.batch_id = $1`,
        [batchId]
    );
    return result.rows;
};

export const setBatchFaculty = async (batchId: number, facultyIds: number[]) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM batch_faculty WHERE batch_id = $1`, [batchId]);
        
        if (facultyIds && facultyIds.length > 0) {
            const values = facultyIds.map((_, index) => `($1, $${index + 2})`).join(', ');
            const params = [batchId, ...facultyIds];
            await client.query(
                `INSERT INTO batch_faculty (batch_id, faculty_id) VALUES ${values}`,
                params
            );
        }
        
        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const assignTempGuide = async (studentId: number, guideId: number) => {
    const result = await pool.query(
        `UPDATE users SET temp_guide_id = $1 WHERE uid = $2 AND role::text ILIKE 'student' RETURNING *`,
        [guideId, studentId]
    );
    if (result.rows.length === 0) throw new Error('Student not found');
    return result.rows[0];
};

export const autoAssignTempGuides = async (batchId: number) => {
    const guides = await pool.query(
        `SELECT f.faculty_id AS uid 
         FROM batch_faculty f
         JOIN users u ON u.uid = f.faculty_id
         WHERE f.batch_id = $1 AND LOWER(u.account_status) = 'active' `,
        [batchId]
    );
    
    if (guides.rows.length === 0) {
        throw new Error('No guides found for this batch to assign students to.');
    }

    const students = await pool.query(
        `SELECT uid FROM users WHERE role::text ILIKE 'student' AND batch_id = $1 `,
        [batchId]
    );

    const guideIds = guides.rows.map(g => g.uid);
    let guideIndex = 0;

    for (const student of students.rows) {
        await pool.query(
            `UPDATE users SET temp_guide_id = $1 WHERE uid = $2`,
            [guideIds[guideIndex], student.uid]
        );
        guideIndex = (guideIndex + 1) % guideIds.length;
    }

    return { success: true, count: students.rows.length };
};

export const getStudents = async (coordinatorId: number, batchId?: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    if (!departmentId) {
        return [];  // Return empty array for unassigned coordinators
    }
    const params: any[] = [departmentId];
    const conditions: string[] = [`b.department_id = $1`];
    
    if (batchId) {
        params.push(batchId);
        conditions.push(`b.id = $${params.length}`);
    }

    conditions.push(`LOWER(u.role::TEXT) = 'student'`);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const result = await pool.query(
        `SELECT
            u.uid,
            p.full_name,
            u.email,
            b.id AS batch_id,
            b.name AS batch_name,
            gm.is_leader,
            g.group_name,
            u.temp_guide_id,
            gp.full_name AS temp_guide_name
         FROM users u
         LEFT JOIN profiles p ON p.u_id = u.uid
         LEFT JOIN batches b ON b.id = u.batch_id
         LEFT JOIN group_members gm ON gm.student_id = u.uid
         LEFT JOIN groups g ON g.id = gm.group_id
         LEFT JOIN profiles gp ON gp.u_id = u.temp_guide_id
         ${where}
         ORDER BY p.full_name`,
        params
    );
    return result.rows;
};

export const createStudent = async (
    data: { 
        name: string; 
        email: string; 
        password?: string; 
        password_hash?: string; 
        batch_id?: number;
        role?: string;
        auth_provider?: string;
    }
) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const plainPassword = data.password || 'pass123';
        const passwordHash = data.password_hash || (await bcrypt.hash(plainPassword, 10));

        const role = data.role || 'student';
        const authProvider = data.auth_provider || 'local';
        const batchId = data.batch_id;

        if (!batchId) {
            throw new Error('Target batch selection is required for student enrollment.');
        }

        const userRes = await client.query(
            `INSERT INTO users (email, password_hash, auth_provider, role, batch_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING uid, email, role, batch_id`,
            [data.email, passwordHash, authProvider, role, batchId]
        );
        await client.query(`INSERT INTO profiles (u_id, full_name) VALUES ($1, $2)`, [userRes.rows[0].uid, data.name]);

        await client.query('COMMIT');
        return userRes.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
export const updateStudent = async (id: number, data: { name?: string; email?: string; batch_id?: number }) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        if (data.email) {
            await client.query(`UPDATE users SET email = $1, batch_id = COALESCE($2, batch_id) WHERE uid = $3`, [data.email, data.batch_id || null, id]);
        } else if (data.batch_id) {
            await client.query(`UPDATE users SET batch_id = $1 WHERE uid = $2`, [data.batch_id, id]);
        }

        if (data.name) {
            await client.query(`UPDATE profiles SET full_name = $1 WHERE u_id = $2`, [data.name, id]);
        }
        await client.query('COMMIT');
        return { success: true };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const deleteStudent = async (id: number) => {
    // Soft delete
    await pool.query(`DELETE FROM users WHERE uid = $1`, [id]);
    return { success: true };
};

export const importStudents = async (students: Array<any>) => {
    const created = [];
    for (const student of students) {
        created.push(await createStudent(student));
    }
    return created;
};

export const getGuideAllocations = async (coordinatorId: number, batchId: number) => {
    const [guidesRes, groupsRes] = await Promise.all([
        getFaculty(coordinatorId),
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
    if (!departmentId) {
        return [];  // Return empty array for unassigned coordinators
    }
    const params: any[] = [departmentId];
    const conditions: string[] = [`b.department_id = $1`];
    
    if (batchId) {
        params.push(batchId);
        conditions.push(`b.id = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
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
    // Verify coordinator is assigned and batch belongs to their department
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    if (!departmentId) {
        throw new Error('Coordinator is not assigned to any department');
    }
    
    // Verify batch belongs to coordinator's department
    const batchCheck = await pool.query(
        `SELECT id FROM batches WHERE id = $1 AND department_id = $2`,
        [data.batch_id, departmentId]
    );
    if (batchCheck.rows.length === 0) {
        throw new Error('Batch not found in coordinator\'s department');
    }
    
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
    if (!departmentId) {
        return [];  // Return empty array for unassigned coordinators
    }
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
         WHERE b.department_id = $1
         ORDER BY d.created_at DESC`,
        [departmentId]
    );
    return result.rows;
};

export const getTopicAudit = async (coordinatorId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    if (!departmentId) {
        return [];  // Return empty array for unassigned coordinators
    }
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
         WHERE b.department_id = $1
         ORDER BY p.created_at DESC`,
        [departmentId]
    );
    return result.rows;
};

export const getProjectHealth = async (coordinatorId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    if (!departmentId) {
        return { atRiskProjects: [] };  // Return empty response for unassigned coordinators
    }
    const result = await pool.query(
        `SELECT
            p.id,
            p.title,
            p.github_repo,
            g.group_name AS "groupName",
            MAX(CASE WHEN t.deadline < CURRENT_DATE AND t.status != 'done' THEN CURRENT_DATE - t.deadline ELSE 0 END)::int AS "daysOverdue"
         FROM projects p
         JOIN groups g ON g.id = p.group_id
         LEFT JOIN batches b ON b.id = g.batch_id
         LEFT JOIN tasks t ON t.project_id = p.id
         WHERE b.department_id = $1
         GROUP BY p.id, p.title, p.github_repo, g.group_name
         ORDER BY "daysOverdue" DESC`,
        [departmentId]
    );
    return {
        atRiskProjects: result.rows.map((row) => ({
            ...row,
            id: String(row.id),
            daysOverdue: Number(row.daysOverdue),
            hasRepo: !!row.github_repo
        })),
    };
};

// ── Batch Close / Final Approval (MF-06) ─────────────────────
export const closeBatch = async (coordinatorId: number, batchId: number) => {
    const departmentId = await getCoordinatorDepartmentId(coordinatorId);
    if (!departmentId) {
        throw new Error('Coordinator is not assigned to any department');
    }

    // Verify batch belongs to coordinator's department
    const batchCheck = await pool.query(
        `SELECT id, is_active FROM batches WHERE id = $1 AND department_id = $2`,
        [batchId, departmentId]
    );
    if (batchCheck.rows.length === 0) {
        throw new Error('Batch not found in coordinator\'s department');
    }
    if (!batchCheck.rows[0].is_active) {
        throw new Error('Batch is already closed');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Set batch inactive
        await client.query(`UPDATE batches SET is_active = FALSE WHERE id = $1`, [batchId]);

        // 2. Archive all approved projects in this batch
        const archived = await client.query(
            `UPDATE projects p SET review_state = 'Archived', updated_at = NOW()
             FROM groups g
             WHERE g.id = p.group_id AND g.batch_id = $1
               AND p.status = 'approved' AND p.review_state != 'Archived'
             RETURNING p.id, p.title`,
            [batchId]
        );

        // 3. Get summary
        const summary = await client.query(
            `SELECT COUNT(*)::int AS total_projects,
                    COUNT(*) FILTER (WHERE p.status = 'approved')::int AS approved,
                    COUNT(*) FILTER (WHERE p.status = 'pending')::int AS pending,
                    COUNT(*) FILTER (WHERE p.review_state = 'Archived')::int AS archived
             FROM projects p JOIN groups g ON g.id = p.group_id WHERE g.batch_id = $1`,
            [batchId]
        );

        await client.query('COMMIT');
        return {
            batch_id: batchId,
            closed: true,
            archived_projects: archived.rows,
            summary: summary.rows[0] || {},
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
