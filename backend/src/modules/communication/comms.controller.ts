import { Request, Response } from 'express';
import * as commsService from './comms.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';
import { UPLOAD_URL_PREFIX } from '../../config/storage';
import pool from '../../config/db';

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
        const file = req.file;

        if (!group_id) {
            return sendError(res, 'group_id is required', 400);
        }
        if (!text && !file) {
            return sendError(res, 'text or attachment is required', 400);
        }

        const attachmentUrl = file ? `${UPLOAD_URL_PREFIX}/${file.filename}` : undefined;
        const message = await commsService.sendMessage(group_id, userId, text || '', attachmentUrl);
        sendSuccess(res, message, 'Message sent', 201);
    } catch (error: any) {
        logger.error('sendMessage error:', error.message);
        sendError(res, error.message || 'Could not send message', 500);
    }
};

/**
 * Get chat messages for a specific group (for Socket.io chat)
 * Query params: page=1, limit=50
 */
export const getGroupMessages = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const groupId = parseInt(req.params.groupId as string);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        if (isNaN(groupId)) {
            return sendError(res, 'Invalid group ID', 400);
        }

        // Verify user has access to this group
        const accessCheck = await pool.query(
            `SELECT 1 FROM groups g
             LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.student_id = $1
             WHERE g.id = $2 AND (g.guide_id = $1 OR gm.student_id = $1)`,
            [userId, groupId]
        );

        if (accessCheck.rows.length === 0) {
            return sendError(res, 'Access denied', 403);
        }

        // Fetch messages with pagination
        const offset = (page - 1) * limit;
        const result = await pool.query(
            `SELECT 
                m.id,
                m.group_id,
                m.sender_id,
                m.text,
                m.created_at,
                m.attachment_url,
                p.full_name as sender_name,
                u.role as sender_role
            FROM messages m
            JOIN users u ON m.sender_id = u.uid
            LEFT JOIN profiles p ON u.uid = p.u_id
            WHERE m.group_id = $1
            ORDER BY m.created_at ASC
            LIMIT $2 OFFSET $3`,
            [groupId, limit, offset]
        );

        const mappedMessages = result.rows.map(m => ({
            id: m.id,
            groupId: m.group_id,
            senderId: m.sender_id,
            text: m.text,
            attachmentUrl: m.attachment_url,
            senderName: m.sender_name || 'User',
            senderRole: m.sender_role?.toLowerCase(),
            createdAt: m.created_at
        }));

        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(*) as total FROM messages WHERE group_id = $1',
            [groupId]
        );

        sendSuccess(res, {
            messages: mappedMessages,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].total),
                totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
            },
        });
    } catch (error: any) {
        logger.error('getGroupMessages error:', error.message);
        sendError(res, error.message || 'Could not fetch messages', 500);
    }
};

/**
 * Get group details (members, guide info, etc.)
 */
export const getGroupDetails = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const groupId = parseInt(req.params.groupId as string);

        if (isNaN(groupId)) {
            return sendError(res, 'Invalid group ID', 400);
        }

        // Verify user has access to this group
        const accessCheck = await pool.query(
            `SELECT 1 FROM groups g
             LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.student_id = $1
             WHERE g.id = $2 AND (g.guide_id = $1 OR gm.student_id = $1)`,
            [userId, groupId]
        );

        if (accessCheck.rows.length === 0) {
            return sendError(res, 'Access denied', 403);
        }

        // Fetch group details
        const groupResult = await pool.query(
            `SELECT g.id, g.group_name, g.guide_id, pr.full_name as guide_name
             FROM groups g
             LEFT JOIN profiles pr ON g.guide_id = pr.u_id
             WHERE g.id = $1`,
            [groupId]
        );

        if (groupResult.rows.length === 0) {
            return sendError(res, 'Group not found', 404);
        }

        // Fetch group members
        const membersResult = await pool.query(
            `SELECT gm.student_id as id, p.full_name, u.role, u.email
             FROM group_members gm
             JOIN users u ON gm.student_id = u.uid
             LEFT JOIN profiles p ON u.uid = p.u_id
             WHERE gm.group_id = $1
             ORDER BY p.full_name ASC`,
            [groupId]
        );

        const group = groupResult.rows[0];
        sendSuccess(res, {
            id: group.id,
            name: group.group_name,
            guide: {
                id: group.guide_id,
                name: group.guide_name || 'N/A',
            },
            members: membersResult.rows,
            memberCount: membersResult.rows.length,
        });
    } catch (error: any) {
        logger.error('getGroupDetails error:', error.message);
        sendError(res, error.message || 'Could not fetch group details', 500);
    }
};
