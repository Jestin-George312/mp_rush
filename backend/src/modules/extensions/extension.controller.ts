import { Request, Response } from 'express';
import * as extensionService from './extension.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';

export const createExtensionRequest = async (req: Request, res: Response) => {
    try {
        const { deadline_id, reason, proposed_date } = req.body;
        if (!deadline_id || !reason || !proposed_date) {
            return sendError(res, 'deadline_id, reason, and proposed_date are required', 400);
        }
        const data = await extensionService.createExtensionRequest(req.user!.id, {
            deadline_id: parseInt(deadline_id),
            reason,
            proposed_date,
        });
        sendSuccess(res, data, 'Extension request submitted', 201);
    } catch (error: any) {
        logger.error('createExtensionRequest error:', error.message);
        sendError(res, error.message || 'Could not create extension request', 500);
    }
};

export const reviewExtensionRequest = async (req: Request, res: Response) => {
    try {
        const requestId = parseInt(req.params.id as string);
        if (isNaN(requestId)) return sendError(res, 'Invalid request id', 400);

        const { action } = req.body;
        if (!['approved', 'rejected'].includes(action)) {
            return sendError(res, 'action must be "approved" or "rejected"', 400);
        }

        const data = await extensionService.reviewExtensionRequest(req.user!.id, requestId, action);
        sendSuccess(res, data, `Extension ${action}`);
    } catch (error: any) {
        logger.error('reviewExtensionRequest error:', error.message);
        sendError(res, error.message || 'Could not review extension request', 500);
    }
};

export const getExtensionRequests = async (req: Request, res: Response) => {
    try {
        const data = await extensionService.getExtensionRequests(req.user!.id, req.user!.role.toLowerCase());
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('getExtensionRequests error:', error.message);
        sendError(res, error.message || 'Could not fetch extension requests', 500);
    }
};
