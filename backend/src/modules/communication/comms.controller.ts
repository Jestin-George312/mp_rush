import { Request, Response } from 'express';
import * as commsService from './comms.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';

export const getMessages = async (req: Request, res: Response) => {
    try {
        const groupId = req.query.groupId ? parseInt(req.query.groupId as string) : NaN;
        if (isNaN(groupId)) {
            return sendError(res, 'groupId is required', 400);
        }

        const messages = await commsService.getMessages(groupId);
        sendSuccess(res, messages);
    } catch (error: any) {
        logger.error('getMessages error:', error.message);
        sendError(res, error.message || 'Could not fetch messages', 500);
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { group_id, text } = req.body;

        if (!group_id || !text) {
            return sendError(res, 'group_id and text are required', 400);
        }

        const message = await commsService.sendMessage(group_id, userId, text);
        sendSuccess(res, message, 'Message sent', 201);
    } catch (error: any) {
        logger.error('sendMessage error:', error.message);
        sendError(res, error.message || 'Could not send message', 500);
    }
};
