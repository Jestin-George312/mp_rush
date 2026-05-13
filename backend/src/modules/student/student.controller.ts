import { Request, Response } from 'express';
import * as studentService from './student.service';
import { sendError, sendSuccess } from '../../utils/response';
import logger from '../../utils/logger';

export const getStats = async (req: Request, res: Response) => {
    try {
        const data = await studentService.getStudentStats(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('student.getStats error:', error.message);
        sendError(res, error.message || 'Could not fetch student stats', 500);
    }
};

export const getProject = async (req: Request, res: Response) => {
    try {
        const data = await studentService.getStudentProject(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('student.getProject error:', error.message);
        sendError(res, error.message || 'Could not fetch project', 500);
    }
};

export const createProject = async (req: Request, res: Response) => {
    try {
        const { title, description, domain, mode, memberEmails } = req.body;
        if (!title || !description || !mode) {
            return sendError(res, 'title, description and mode are required', 400);
        }

        const data = await studentService.createStudentProject(req.user!.id, {
            title,
            description,
            domain: domain as string,
            mode,
            memberEmails,
        });
        sendSuccess(res, data, 'Project created', 201);
    } catch (error: any) {
        logger.error('student.createProject error:', error.message);
        sendError(res, error.message || 'Could not create project', 500);
    }
};

export const getSubmissions = async (req: Request, res: Response) => {
    try {
        const data = await studentService.getStudentSubmissions(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('student.getSubmissions error:', error.message);
        sendError(res, error.message || 'Could not fetch submissions', 500);
    }
};

export const getFeedback = async (req: Request, res: Response) => {
    try {
        const data = await studentService.getStudentFeedback(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('student.getFeedback error:', error.message);
        sendError(res, error.message || 'Could not fetch feedback', 500);
    }
};

export const submitDocument = async (req: Request, res: Response) => {
    try {
        if (!req.file) return sendError(res, 'No file uploaded', 400);

        const { deadlineId, documentName } = req.body;
        const data = await studentService.createStudentSubmission(req.user!.id, {
            deadlineId: deadlineId ? parseInt(deadlineId) : null,
            filename: req.file.filename,
            originalname: req.file.originalname,
            documentName: documentName || req.file.originalname
        });
        sendSuccess(res, data, 'Submission uploaded', 201);
    } catch (error: any) {
        logger.error('student.submitDocument error:', error.message);
        sendError(res, error.message || 'Could not upload submission', 500);
    }
};

export const deleteSubmission = async (req: Request, res: Response) => {
    try {
        const docId = parseInt(req.params.id as string);
        if (isNaN(docId)) return sendError(res, 'Invalid document id', 400);
        const data = await studentService.deleteStudentSubmission(req.user!.id, docId);
        sendSuccess(res, data, 'Submission deleted');
    } catch (error: any) {
        logger.error('student.deleteSubmission error:', error.message);
        sendError(res, error.message || 'Could not delete submission', 500);
    }
};

export const getTasks = async (req: Request, res: Response) => {
    try {
        const data = await studentService.getStudentTasks(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('student.getTasks error:', error.message);
        sendError(res, error.message || 'Could not fetch tasks', 500);
    }
};

export const createTask = async (req: Request, res: Response) => {
    try {
        const { title, priority, deadline, assigned_to } = req.body;
        if (!title) return sendError(res, 'title is required', 400);

        const data = await studentService.createStudentTask(req.user!.id, {
            title,
            priority,
            deadline,
            assigned_to,
        });
        sendSuccess(res, data, 'Task created', 201);
    } catch (error: any) {
        logger.error('student.createTask error:', error.message);
        sendError(res, error.message || 'Could not create task', 500);
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const taskId = parseInt(req.params.taskId as string);
        if (isNaN(taskId)) return sendError(res, 'Invalid task id', 400);

        const data = await studentService.updateStudentTask(req.user!.id, taskId, req.body);
        sendSuccess(res, data, 'Task updated');
    } catch (error: any) {
        logger.error('student.updateTask error:', error.message);
        sendError(res, error.message || 'Could not update task', 500);
    }
};

export const linkRepository = async (req: Request, res: Response) => {
    try {
        const { repoUrl } = req.body;
        if (!repoUrl) return sendError(res, 'repoUrl is required', 400);

        const data = await studentService.linkStudentRepository(req.user!.id, repoUrl);
        sendSuccess(res, data, 'Repository linked');
    } catch (error: any) {
        logger.error('student.linkRepository error:', error.message);
        sendError(res, error.message || 'Could not link repository', 500);
    }
};

export const getGitCommits = async (req: Request, res: Response) => {
    try {
        const data = await studentService.getStudentGitCommits(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('student.getGitCommits error:', error.message);
        sendError(res, error.message || 'Could not fetch git commits', 500);
    }
};

export const getInvitations = async (req: Request, res: Response) => {
    try {
        const data = await studentService.getInvitations(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('student.getInvitations error:', error.message);
        sendError(res, error.message || 'Could not fetch invitations', 500);
    }
};

export const respondToInvitation = async (req: Request, res: Response) => {
    try {
        const invitationId = parseInt(req.params.id as string);
        if (isNaN(invitationId)) return sendError(res, 'Invalid invitation id', 400);

        const { accept } = req.body;
        if (typeof accept !== 'boolean') return sendError(res, 'accept boolean is required', 400);

        const data = await studentService.respondToInvitation(req.user!.id, invitationId, accept);
        sendSuccess(res, data, accept ? 'Invitation accepted' : 'Invitation declined');
    } catch (error: any) {
        logger.error('student.respondToInvitation error:', error.message);
        sendError(res, error.message || 'Could not process invitation', 500);
    }
};
export const requestExtension = async (req: Request, res: Response) => {
    try {
        const { deadline_id, reason, requested_date } = req.body;
        if (!deadline_id || !reason || !requested_date) {
            return sendError(res, 'Missing required fields', 400);
        }

        const data = await studentService.createExtensionRequest(req.user!.id, {
            deadline_id,
            reason,
            requested_date,
        });
        sendSuccess(res, data, 'Extension request submitted', 201);
    } catch (error: any) {
        logger.error('student.requestExtension error:', error.message);
        sendError(res, error.message || 'Could not submit extension request', 500);
    }
};
export const getDeadlines = async (req: Request, res: Response) => {
    try {
        const data = await studentService.getStudentDeadlines(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('student.getDeadlines error:', error.message);
        sendError(res, error.message || 'Could not fetch deadlines', 500);
    }
};

export const getBatchMates = async (req: Request, res: Response) => {
    try {
        const data = await studentService.getBatchMates(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        console.error('student.getBatchMates error detail:', error);
        logger.error('student.getBatchMates error:', error.message);
        sendError(res, error.message || 'Could not fetch batch mates', 500);
    }
};

export const getBatchSettings = async (req: Request, res: Response) => {
    try {
        const data = await studentService.getBatchSettings(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('student.getBatchSettings error:', error.message);
        sendError(res, error.message || 'Could not fetch batch settings', 500);
    }
};
