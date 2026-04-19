import pool from '../../config/db';

// ────────────────────────────────────────────────────────────
// GET /api/tasks?projectId=  — fetch tasks for a project
// ────────────────────────────────────────────────────────────
export const listTasks = async (projectId: number) => {
    const result = await pool.query(
        `SELECT t.*, pr.full_name AS assigned_to_name
         FROM tasks t
         LEFT JOIN profiles pr ON t.assigned_to = pr.u_id
         WHERE t.project_id = $1
         ORDER BY
             CASE t.status
                 WHEN 'todo'       THEN 1
                 WHEN 'inprogress' THEN 2
                 WHEN 'done'       THEN 3
             END,
             t.deadline ASC NULLS LAST`,
        [projectId]
    );
    return result.rows;
};

// ────────────────────────────────────────────────────────────
// POST /api/tasks  — create a task
// ────────────────────────────────────────────────────────────
export const createTask = async (
    createdBy: number,
    data: {
        project_id: number;
        title: string;
        priority: 'High' | 'Medium' | 'Low';
        deadline?: string;
        assigned_to?: number;
    }
) => {
    const result = await pool.query(
        `INSERT INTO tasks (project_id, title, priority, deadline, assigned_to, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
            data.project_id,
            data.title,
            data.priority || 'Medium',
            data.deadline || null,
            data.assigned_to || null,
            createdBy,
        ]
    );
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// PATCH /api/tasks/:id/status  — move between columns
// ────────────────────────────────────────────────────────────
export const updateTaskStatus = async (
    taskId: number,
    status: 'todo' | 'inprogress' | 'done'
) => {
    const result = await pool.query(
        `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
        [status, taskId]
    );
    if (result.rows.length === 0) throw new Error('Task not found');
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// PATCH /api/tasks/:id  — update title, priority, deadline
// ────────────────────────────────────────────────────────────
export const updateTask = async (
    taskId: number,
    data: { title?: string; priority?: string; deadline?: string | null }
) => {
    const result = await pool.query(
        `UPDATE tasks
         SET
             title    = COALESCE($1, title),
             priority = COALESCE($2::task_priority, priority),
             deadline = CASE WHEN $3::text IS NOT NULL THEN $3::date ELSE deadline END
         WHERE id = $4
         RETURNING *`,
        [data.title ?? null, data.priority ?? null, data.deadline ?? null, taskId]
    );
    if (result.rows.length === 0) throw new Error('Task not found');
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// DELETE /api/tasks/:id
// ────────────────────────────────────────────────────────────
export const deleteTask = async (taskId: number) => {
    const result = await pool.query(
        `DELETE FROM tasks WHERE id = $1 RETURNING id`,
        [taskId]
    );
    if (result.rows.length === 0) throw new Error('Task not found');
    return { deleted: true, id: taskId };
};
