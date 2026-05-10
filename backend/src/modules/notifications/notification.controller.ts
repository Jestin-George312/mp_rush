import { Request, Response } from 'express';
import * as notificationService from './notification.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const unreadOnly = req.query.unread === 'true';
        const data = await notificationService.getUserNotifications(req.user!.id, unreadOnly);
        sendSuccess(res, data);
    } catch (error: any) {
        logger.error('getNotifications error:', error.message);
        sendError(res, error.message || 'Could not fetch notifications', 500);
    }
};

export const getUnreadCount = async (req: Request, res: Response) => {
    try {
        const count = await notificationService.getUnreadCount(req.user!.id);
        sendSuccess(res, { count });
    } catch (error: any) {
        logger.error('getUnreadCount error:', error.message);
        sendError(res, error.message || 'Could not fetch unread count', 500);
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const notificationId = parseInt(req.params.id as string);
        if (isNaN(notificationId)) return sendError(res, 'Invalid notification id', 400);

        await notificationService.markAsRead(notificationId, req.user!.id);
        sendSuccess(res, null, 'Notification marked as read');
    } catch (error: any) {
        logger.error('markAsRead error:', error.message);
        sendError(res, error.message || 'Could not mark notification as read', 500);
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        await notificationService.markAllAsRead(req.user!.id);
        sendSuccess(res, null, 'All notifications marked as read');
    } catch (error: any) {
        logger.error('markAllAsRead error:', error.message);
        sendError(res, error.message || 'Could not mark all notifications as read', 500);
    }
};
