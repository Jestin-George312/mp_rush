import { Router } from 'express';
import { listTasks, createTask, updateTaskStatus, updateTask, deleteTask } from './task.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

// GET    /api/tasks?projectId=  — list tasks for a project
router.get('/', listTasks);

// POST   /api/tasks             — create a task
router.post('/', createTask);

// PATCH  /api/tasks/:id/status  — move task column (todo/inprogress/done)
router.patch('/:id/status', updateTaskStatus);

// PATCH  /api/tasks/:id         — update title / priority / deadline
router.patch('/:id', updateTask);

// DELETE /api/tasks/:id         — remove task
router.delete('/:id', deleteTask);

export default router;
