import { Request, Response } from 'express';
import * as coordinatorService from './coordinator.service';
import { sendError, sendSuccess } from '../../utils/response';
import logger from '../../utils/logger';

export const getStats = async (req: Request, res: Response) => {
    try {
        const data = await coordinatorService.getCoordinatorStats(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getStats error:', error.message);
        sendError(res, error.message || 'Could not fetch stats', 500);
    }
};

export const getFaculty = async (req: Request, res: Response) => {
    try {
        const data = await coordinatorService.getFaculty(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getFaculty error:', error.message);
        sendError(res, error.message || 'Could not fetch faculty', 500);
    }
};

export const createFaculty = async (req: Request, res: Response) => {
    try {
        const data = await coordinatorService.createFaculty(req.body);
        sendSuccess(res, data, 'Faculty created', 201);
    } catch (error: any) {
        logger.error('coordinator.createFaculty error:', error.message);
        sendError(res, error.message || 'Could not create faculty', 500);
    }
};

export const importFaculty = async (req: Request, res: Response) => {
    try {
        const faculty = Array.isArray(req.body?.faculty) ? req.body.faculty : req.body;
        const data = await coordinatorService.importFaculty(faculty);
        sendSuccess(res, data, 'Faculty imported', 201);
    } catch (error: any) {
        logger.error('coordinator.importFaculty error:', error.message);
        sendError(res, error.message || 'Could not import faculty', 500);
    }
};

export const updateFaculty = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) return sendError(res, 'Invalid faculty id', 400);
        const data = await coordinatorService.updateFaculty(id, req.body);
        sendSuccess(res, data, 'Faculty updated');
    } catch (error: any) {
        logger.error('coordinator.updateFaculty error:', error.message);
        sendError(res, error.message || 'Could not update faculty', 500);
    }
};

export const getBatches = async (req: Request, res: Response) => {
    try {
        const data = await coordinatorService.getBatches(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getBatches error:', error.message);
        sendError(res, error.message || 'Could not fetch batches', 500);
    }
};

export const createBatch = async (req: Request, res: Response) => {
    try {
        const data = await coordinatorService.createBatch(req.user!.id, req.body);
        sendSuccess(res, data, 'Batch created', 201);
    } catch (error: any) {
        logger.error('coordinator.createBatch error:', error.message);
        sendError(res, error.message || 'Could not create batch', 500);
    }
};

export const updateBatch = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) return sendError(res, 'Invalid batch id', 400);
        const data = await coordinatorService.updateBatch(id, req.body);
        sendSuccess(res, data, 'Batch updated');
    } catch (error: any) {
        logger.error('coordinator.updateBatch error:', error.message);
        sendError(res, error.message || 'Could not update batch', 500);
    }
};

export const getStudents = async (req: Request, res: Response) => {
    try {
        const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
        const data = await coordinatorService.getStudents(req.user!.id, batchId);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getStudents error:', error.message);
        sendError(res, error.message || 'Could not fetch students', 500);
    }
};

export const createStudent = async (req: Request, res: Response) => {
    try {
        const data = await coordinatorService.createStudent(req.body);
        sendSuccess(res, data, 'Student created', 201);
    } catch (error: any) {
        logger.error('coordinator.createStudent error:', error.message);
        sendError(res, error.message || 'Could not create student', 500);
    }
};

export const updateStudent = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const data = await coordinatorService.updateStudent(id, req.body);
        sendSuccess(res, data, 'Student updated');
    } catch (error: any) {
        logger.error('coordinator.updateStudent error:', error.message);
        sendError(res, error.message || 'Could not update student', 500);
    }
};

export const deleteStudent = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await coordinatorService.deleteStudent(id);
        sendSuccess(res, null, 'Student deleted');
    } catch (error: any) {
        logger.error('coordinator.deleteStudent error:', error.message);
        sendError(res, error.message || 'Could not delete student', 500);
    }
};

export const importStudents = async (req: Request, res: Response) => {
    try {
        const students = Array.isArray(req.body?.students) ? req.body.students : req.body;
        const data = await coordinatorService.importStudents(students);
        sendSuccess(res, data, 'Students imported', 201);
    } catch (error: any) {
        logger.error('coordinator.importStudents error:', error.message);
        sendError(res, error.message || 'Could not import students', 500);
    }
};

export const getBatchFaculty = async (req: Request, res: Response) => {
    try {
        const batchId = parseInt(req.params.batchId as string);
        if (isNaN(batchId)) return sendError(res, 'Invalid batch id', 400);
        const data = await coordinatorService.getBatchFaculty(batchId);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getBatchFaculty error:', error.message);
        sendError(res, error.message || 'Could not fetch batch faculty', 500);
    }
};

export const setBatchFaculty = async (req: Request, res: Response) => {
    try {
        const batchId = parseInt(req.params.batchId as string);
        if (isNaN(batchId)) return sendError(res, 'Invalid batch id', 400);
        const facultyIds = req.body.facultyIds; // Array of uids
        const data = await coordinatorService.setBatchFaculty(batchId, facultyIds);
        sendSuccess(res, data, 'Batch faculty updated');
    } catch (error: any) {
        logger.error('coordinator.setBatchFaculty error:', error.message);
        sendError(res, error.message || 'Could not set batch faculty', 500);
    }
};

export const getGuideAllocations = async (req: Request, res: Response) => {
    try {
        const batchId = parseInt(req.params.batchId as string);
        if (isNaN(batchId)) return sendError(res, 'Invalid batch id', 400);
        const data = await coordinatorService.getGuideAllocations(req.user!.id, batchId);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getGuideAllocations error:', error.message);
        sendError(res, error.message || 'Could not fetch guide allocations', 500);
    }
};

export const assignGuide = async (req: Request, res: Response) => {
    try {
        const { groupId, guideId } = req.body;
        const data = await coordinatorService.assignGuide(parseInt(groupId), parseInt(guideId));
        sendSuccess(res, data, 'Guide assigned');
    } catch (error: any) {
        logger.error('coordinator.assignGuide error:', error.message);
        sendError(res, error.message || 'Could not assign guide', 500);
    }
};

export const assignTempGuide = async (req: Request, res: Response) => {
    try {
        const { studentId, guideId } = req.body;
        const data = await coordinatorService.assignTempGuide(parseInt(studentId), parseInt(guideId));
        sendSuccess(res, data, 'Temporary guide assigned');
    } catch (error: any) {
        logger.error('coordinator.assignTempGuide error:', error.message);
        sendError(res, error.message || 'Could not assign temporary guide', 500);
    }
};

export const autoAssignTempGuides = async (req: Request, res: Response) => {
    try {
        const { batchId } = req.body;
        const data = await coordinatorService.autoAssignTempGuides(parseInt(batchId));
        sendSuccess(res, data, 'Temporary guides auto-assigned');
    } catch (error: any) {
        logger.error('coordinator.autoAssignTempGuides error:', error.message);
        sendError(res, error.message || 'Could not auto-assign temporary guides', 500);
    }
};

export const getProjects = async (req: Request, res: Response) => {
    try {
        const batchId = req.query.batchId ? parseInt(req.query.batchId as string) : undefined;
        const data = await coordinatorService.getProjectGroups(req.user!.id, batchId);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getProjects error:', error.message);
        sendError(res, error.message || 'Could not fetch projects', 500);
    }
};

export const getDeadlines = async (req: Request, res: Response) => {
    try {
        const batchId = parseInt(req.params.batchId as string);
        if (isNaN(batchId)) return sendError(res, 'Invalid batch id', 400);
        const data = await coordinatorService.getDeadlines(batchId);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getDeadlines error:', error.message);
        sendError(res, error.message || 'Could not fetch deadlines', 500);
    }
};

export const createDeadline = async (req: Request, res: Response) => {
    try {
        const data = await coordinatorService.createDeadline(req.user!.id, req.body);
        sendSuccess(res, data, 'Deadline created', 201);
    } catch (error: any) {
        logger.error('coordinator.createDeadline error:', error.message);
        sendError(res, error.message || 'Could not create deadline', 500);
    }
};

export const updateDeadline = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) return sendError(res, 'Invalid deadline id', 400);
        const data = await coordinatorService.updateDeadline(id, req.body);
        sendSuccess(res, data, 'Deadline updated');
    } catch (error: any) {
        logger.error('coordinator.updateDeadline error:', error.message);
        sendError(res, error.message || 'Could not update deadline', 500);
    }
};

export const deleteDeadline = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        if (isNaN(id)) return sendError(res, 'Invalid deadline id', 400);
        const data = await coordinatorService.deleteDeadline(id);
        sendSuccess(res, data, 'Deadline deleted');
    } catch (error: any) {
        logger.error('coordinator.deleteDeadline error:', error.message);
        sendError(res, error.message || 'Could not delete deadline', 500);
    }
};

export const getSubmissionAudit = async (req: Request, res: Response) => {
    try {
        const data = await coordinatorService.getSubmissionAudit(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getSubmissionAudit error:', error.message);
        sendError(res, error.message || 'Could not fetch submission audit', 500);
    }
};

export const getTopicAudit = async (req: Request, res: Response) => {
    try {
        const data = await coordinatorService.getTopicAudit(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getTopicAudit error:', error.message);
        sendError(res, error.message || 'Could not fetch topic audit', 500);
    }
};

export const getProjectHealth = async (req: Request, res: Response) => {
    try {
        const data = await coordinatorService.getProjectHealth(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('coordinator.getProjectHealth error:', error.message);
        sendError(res, error.message || 'Could not fetch project health', 500);
    }
};

export const closeBatch = async (req: Request, res: Response) => {
    try {
        const batchId = parseInt(req.params.batchId as string);
        if (isNaN(batchId)) return sendError(res, 'Invalid batch id', 400);
        const data = await coordinatorService.closeBatch(req.user!.id, batchId);
        sendSuccess(res, data, 'Batch closed and projects archived');
    } catch (error: any) {
        logger.error('coordinator.closeBatch error:', error.message);
        sendError(res, error.message || 'Could not close batch', 500);
    }
};

export const resetBatch = async (req: Request, res: Response) => {
    try {
        const batchId = parseInt(req.params.batchId as string);
        if (isNaN(batchId)) return sendError(res, 'Invalid batch id', 400);
        const data = await coordinatorService.resetBatch(req.user!.id, batchId);
        sendSuccess(res, data, 'Batch reset successfully');
    } catch (error: any) {
        logger.error('coordinator.resetBatch error:', error.message);
        sendError(res, error.message || 'Could not reset batch', 500);
    }
};
