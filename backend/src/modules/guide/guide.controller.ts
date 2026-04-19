import { Request, Response } from 'express';
import * as guideService from './guide.service';
import { sendError, sendSuccess } from '../../utils/response';
import logger from '../../utils/logger';

export const getStats = async (req: Request, res: Response) => {
    try {
        const data = await guideService.getGuideStats(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getStats error:', error.message);
        sendError(res, error.message || 'Could not fetch guide stats', 500);
    }
};

export const getBatches = async (req: Request, res: Response) => {
    try {
        const data = await guideService.getAssignedBatches(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getBatches error:', error.message);
        sendError(res, error.message || 'Could not fetch batches', 500);
    }
};

export const getBatchGroups = async (req: Request, res: Response) => {
    try {
        const batchId = parseInt(req.params.batchId as string);
        if (isNaN(batchId)) return sendError(res, 'Invalid batch id', 400);

        const data = await guideService.getBatchGroups(req.user!.id, batchId);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getBatchGroups error:', error.message);
        sendError(res, error.message || 'Could not fetch batch groups', 500);
    }
};

export const getPendingTopics = async (req: Request, res: Response) => {
    try {
        const data = await guideService.getPendingTopics(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getPendingTopics error:', error.message);
        sendError(res, error.message || 'Could not fetch topics', 500);
    }
};

export const approveTopic = async (req: Request, res: Response) => {
    try {
        const data = await guideService.reviewTopic(req.user!.id, parseInt(req.params.id as string), 'approve', req.body.comments);
        sendSuccess(res, data, 'Topic approved');
    } catch (error: any) {
        logger.error('guide.approveTopic error:', error.message);
        sendError(res, error.message || 'Could not approve topic', 500);
    }
};

export const rejectTopic = async (req: Request, res: Response) => {
    try {
        const data = await guideService.reviewTopic(req.user!.id, parseInt(req.params.id as string), 'reject', req.body.reason);
        sendSuccess(res, data, 'Topic rejected');
    } catch (error: any) {
        logger.error('guide.rejectTopic error:', error.message);
        sendError(res, error.message || 'Could not reject topic', 500);
    }
};

export const requestRevision = async (req: Request, res: Response) => {
    try {
        const data = await guideService.reviewTopic(req.user!.id, parseInt(req.params.id as string), 'revision', req.body.instructions);
        sendSuccess(res, data, 'Revision requested');
    } catch (error: any) {
        logger.error('guide.requestRevision error:', error.message);
        sendError(res, error.message || 'Could not request revision', 500);
    }
};

export const getGroups = async (req: Request, res: Response) => {
    try {
        const data = await guideService.getSupervisedGroups(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getGroups error:', error.message);
        sendError(res, error.message || 'Could not fetch groups', 500);
    }
};

export const getGroupDetails = async (req: Request, res: Response) => {
    try {
        const groupId = parseInt(req.params.groupId as string);
        if (isNaN(groupId)) return sendError(res, 'Invalid group id', 400);

        const data = await guideService.getGroupDetails(req.user!.id, groupId);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getGroupDetails error:', error.message);
        sendError(res, error.message || 'Could not fetch group details', 500);
    }
};

export const getPendingDocuments = async (req: Request, res: Response) => {
    try {
        const data = await guideService.getPendingDocuments(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getPendingDocuments error:', error.message);
        sendError(res, error.message || 'Could not fetch documents', 500);
    }
};

export const reviewDocument = async (req: Request, res: Response) => {
    try {
        const docId = parseInt(req.params.docId as string);
        const { status, feedback } = req.body;
        if (isNaN(docId)) return sendError(res, 'Invalid document id', 400);

        const data = await guideService.reviewDocument(req.user!.id, docId, status, feedback);
        sendSuccess(res, data, 'Document reviewed');
    } catch (error: any) {
        logger.error('guide.reviewDocument error:', error.message);
        sendError(res, error.message || 'Could not review document', 500);
    }
};

export const getGitMonitoring = async (req: Request, res: Response) => {
    try {
        const data = await guideService.getGitMonitoring(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getGitMonitoring error:', error.message);
        sendError(res, error.message || 'Could not fetch git activity', 500);
    }
};

export const getGroupKanban = async (req: Request, res: Response) => {
    try {
        const groupId = parseInt(req.params.groupId as string);
        if (isNaN(groupId)) return sendError(res, 'Invalid group id', 400);

        const data = await guideService.getGroupKanban(req.user!.id, groupId);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getGroupKanban error:', error.message);
        sendError(res, error.message || 'Could not fetch kanban board', 500);
    }
};
