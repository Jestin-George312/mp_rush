import { Request, Response } from 'express';
import * as projectService from './project.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';

// ────────────────────────────────────────────────────────────
// POST /api/projects
// ────────────────────────────────────────────────────────────
export const submitProject = async (req: Request, res: Response) => {
    try {
        const studentId = req.user!.id;
        const { title, domain, description, teamMembers } = req.body;

        if (!title || !description) {
            return sendError(res, 'title and description are required', 400);
        }

        const project = await projectService.submitProject(studentId, {
            title,
            domain: domain || 'General',
            description,
            teamMembers,
        });
        sendSuccess(res, project, 'Project submitted successfully', 201);
    } catch (error: any) {
        logger.error('submitProject error:', error.message);
        sendError(res, error.message || 'Could not submit project', 500);
    }
};

// ────────────────────────────────────────────────────────────
// GET /api/projects
// ────────────────────────────────────────────────────────────
export const listProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const role = req.user!.role.toLowerCase();
        const projects = await projectService.listProjects(userId, role);
        sendSuccess(res, projects);
    } catch (error: any) {
        logger.error('listProjects error:', error.message);
        sendError(res, error.message || 'Could not list projects', 500);
    }
};

// ────────────────────────────────────────────────────────────
// GET /api/projects/:id
// ────────────────────────────────────────────────────────────
export const getProject = async (req: Request, res: Response) => {
    try {
        const projectId = parseInt(req.params.id as string);
        if (isNaN(projectId)) return sendError(res, 'Invalid project ID', 400);

        const project = await projectService.getProjectById(projectId);
        sendSuccess(res, project);
    } catch (error: any) {
        logger.error('getProject error:', error.message);
        sendError(res, error.message || 'Could not fetch project', 404);
    }
};

// ────────────────────────────────────────────────────────────
// PATCH /api/projects/:id/status  (Guide)
// ────────────────────────────────────────────────────────────
export const updateProjectStatus = async (req: Request, res: Response) => {
    try {
        const projectId = parseInt(req.params.id as string);
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return sendError(res, 'Status must be "approved" or "rejected"', 400);
        }

        const project = await projectService.updateProjectStatus(projectId, status);
        sendSuccess(res, project, `Project ${status}`);
    } catch (error: any) {
        logger.error('updateProjectStatus error:', error.message);
        sendError(res, error.message || 'Could not update status', 500);
    }
};

// ────────────────────────────────────────────────────────────
// PATCH /api/projects/:id/progress
// ────────────────────────────────────────────────────────────
export const updateProjectProgress = async (req: Request, res: Response) => {
    try {
        const projectId = parseInt(req.params.id as string);
        const { progress } = req.body;

        if (typeof progress !== 'number') {
            return sendError(res, 'progress must be a number', 400);
        }

        const project = await projectService.updateProjectProgress(projectId, progress);
        sendSuccess(res, project, 'Progress updated');
    } catch (error: any) {
        logger.error('updateProjectProgress error:', error.message);
        sendError(res, error.message || 'Could not update progress', 500);
    }
};

// ────────────────────────────────────────────────────────────
// GET /api/groups  (Coordinator)
// ────────────────────────────────────────────────────────────
export const listGroups = async (_req: Request, res: Response) => {
    try {
        const groups = await projectService.listGroups();
        sendSuccess(res, groups);
    } catch (error: any) {
        logger.error('listGroups error:', error.message);
        sendError(res, error.message || 'Could not list groups', 500);
    }
};

// ────────────────────────────────────────────────────────────
// GET /api/groups/mine  (Guide)
// ────────────────────────────────────────────────────────────
export const getMyGroups = async (req: Request, res: Response) => {
    try {
        const guideId = req.user!.id;
        const groups = await projectService.getMyGroups(guideId);
        sendSuccess(res, groups);
    } catch (error: any) {
        logger.error('getMyGroups error:', error.message);
        sendError(res, error.message || 'Could not fetch groups', 500);
    }
};

// ────────────────────────────────────────────────────────────
// PATCH /api/groups/:id/guide  (Coordinator)
// ────────────────────────────────────────────────────────────
export const assignGuide = async (req: Request, res: Response) => {
    try {
        const groupId = parseInt(req.params.id as string);
        const { guideId } = req.body; // null to unassign

        if (isNaN(groupId)) return sendError(res, 'Invalid group ID', 400);

        const group = await projectService.assignGuide(groupId, guideId ?? null);
        sendSuccess(res, group, 'Guide assigned successfully');
    } catch (error: any) {
        logger.error('assignGuide error:', error.message);
        sendError(res, error.message || 'Could not assign guide', 500);
    }
};

// ────────────────────────────────────────────────────────────
// GET /api/projects/stats/coordinator
// ────────────────────────────────────────────────────────────
export const getCoordinatorStats = async (_req: Request, res: Response) => {
    try {
        const stats = await projectService.getCoordinatorStats();
        sendSuccess(res, stats);
    } catch (error: any) {
        logger.error('getCoordinatorStats error:', error.message);
        sendError(res, error.message || 'Could not get stats', 500);
    }
};
