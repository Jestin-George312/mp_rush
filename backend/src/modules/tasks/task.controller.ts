import { Request, Response } from 'express';
import * as taskService from './task.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';

// GET /api/tasks?projectId=
export const listTasks = async (req: Request, res: Response) => {
    try {
        const projectId = parseInt(req.query.projectId as string);
        if (isNaN(projectId)) return sendError(res, 'projectId query param is required', 400);

        const tasks = await taskService.listTasks(projectId);
        sendSuccess(res, tasks);
    } catch (error: any) {
        logger.error('listTasks error:', error.message);
        sendError(res, error.message || 'Could not fetch tasks', 500);
    }
};

// POST /api/tasks
export const createTask = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { project_id, title, priority, deadline, assigned_to } = req.body;

        if (!project_id || !title) {
            return sendError(res, 'project_id and title are required', 400);
        }

        const task = await taskService.createTask(userId, {
            project_id,
            title,
            priority: priority || 'Medium',
            deadline,
            assigned_to,
        });
        sendSuccess(res, task, 'Task created', 201);
    } catch (error: any) {
        logger.error('createTask error:', error.message);
        sendError(res, error.message || 'Could not create task', 500);
    }
};

// PATCH /api/tasks/:id/status
export const updateTaskStatus = async (req: Request, res: Response) => {
    try {
        const taskId = parseInt(req.params.id as string);
        const { status } = req.body;

        const allowed = ['todo', 'inprogress', 'done'];
        if (!allowed.includes(status)) {
            return sendError(res, `status must be one of: ${allowed.join(', ')}`, 400);
        }

        const task = await taskService.updateTaskStatus(taskId, status);
        sendSuccess(res, task, 'Task status updated');
    } catch (error: any) {
        logger.error('updateTaskStatus error:', error.message);
        sendError(res, error.message || 'Could not update task', 500);
    }
};

// PATCH /api/tasks/:id
export const updateTask = async (req: Request, res: Response) => {
    try {
        const taskId = parseInt(req.params.id as string);
        const { title, priority, deadline } = req.body;

        const task = await taskService.updateTask(taskId, { title, priority, deadline });
        sendSuccess(res, task, 'Task updated');
    } catch (error: any) {
        logger.error('updateTask error:', error.message);
        sendError(res, error.message || 'Could not update task', 500);
    }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req: Request, res: Response) => {
    try {
        const taskId = parseInt(req.params.id as string);
        if (isNaN(taskId)) return sendError(res, 'Invalid task ID', 400);

        const result = await taskService.deleteTask(taskId);
        sendSuccess(res, result, 'Task deleted');
    } catch (error: any) {
        logger.error('deleteTask error:', error.message);
        sendError(res, error.message || 'Could not delete task', 500);
    }
};
