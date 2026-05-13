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

export const getTopics = async (req: Request, res: Response) => {
    try {
        const status = req.query.status || 'Pending';
        const data = await guideService.getTopics(req.user!.id, status as string);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getTopics error:', error.message);
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

export const markProjectCompleted = async (req: Request, res: Response) => {
    try {
        const guideId = req.user!.id;
        const projectId = parseInt(req.params.id as string);
        if (isNaN(projectId)) return sendError(res, 'Invalid project id', 400);

        const project = await guideService.markProjectCompleted(guideId, projectId);
        sendSuccess(res, project, 'Project marked as completed');
    } catch (error: any) {
        logger.error('markProjectCompleted error:', error.message);
        sendError(res, error.message || 'Could not complete project', 500);
    }
};

export const getPendingDocuments = async (req: Request, res: Response) => {
    try {
        const statusFilter = (req.query.status as string) || 'Pending';
        const data = await guideService.getPendingDocuments(req.user!.id, statusFilter);
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

        let fileData = undefined;
        if (req.file) {
            fileData = {
                filename: req.file.filename,
                originalname: req.file.originalname
            };
        }

        const data = await guideService.reviewDocument(req.user!.id, docId, status, feedback, fileData);
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

export const getUpcomingDeadlines = async (req: Request, res: Response) => {
    try {
        const data = await guideService.getUpcomingDeadlines(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getUpcomingDeadlines error:', error.message);
        sendError(res, error.message || 'Could not fetch upcoming deadlines', 500);
    }
};
export const getExtensionRequests = async (req: Request, res: Response) => {
    try {
        const data = await guideService.getExtensionRequests(req.user!.id);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('guide.getExtensionRequests error:', error.message);
        sendError(res, error.message || 'Could not fetch extension requests', 500);
    }
};

export const handleExtensionRequest = async (req: Request, res: Response) => {
    try {
        const requestId = parseInt(req.params.id as string);
        const { status } = req.body;
        if (isNaN(requestId)) return sendError(res, 'Invalid request id', 400);
        if (!['approved', 'rejected'].includes(status)) {
            return sendError(res, 'Status must be approved or rejected', 400);
        }

        const data = await guideService.reviewExtensionRequest(req.user!.id, requestId, status);
        sendSuccess(res, data, `Extension request ${status}`);
    } catch (error: any) {
        logger.error('guide.handleExtensionRequest error:', error.message);
        sendError(res, error.message || 'Could not process extension request', 500);
    }
};
