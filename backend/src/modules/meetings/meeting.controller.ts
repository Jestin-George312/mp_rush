import { Request, Response } from 'express';
import * as meetingService from './meeting.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';
import pool from '../../config/db';

export const createMeeting = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { title, date, time, agenda, group_id, project_id } = req.body;

        if (!title || !date || !time) {
            return sendError(res, 'title, date, and time are required', 400);
        }

        let assignedGroupId = group_id;

        // If student, auto-detect their group
        if (req.user!.role.toLowerCase() === 'student' && !assignedGroupId) {
            const groupRes = await pool.query('SELECT group_id FROM group_members WHERE student_id = $1 LIMIT 1', [userId]);
            if (groupRes.rows.length > 0) {
                assignedGroupId = groupRes.rows[0].group_id;
            } else {
                return sendError(res, 'You are not assigned to any group yet', 400);
            }
        }

        const meeting = await meetingService.createMeeting(userId, {
            title, date, time, agenda, project_id, group_id: assignedGroupId
        });

        sendSuccess(res, meeting, 'Meeting requested successfully', 201);
    } catch (error: any) {
        logger.error('createMeeting error:', error.message);
        sendError(res, error.message || 'Could not create meeting', 500);
    }
};

export const getMeetings = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const role = req.user!.role.toLowerCase();

        const meetings = await meetingService.getUserMeetings(userId, role);
        sendSuccess(res, meetings);
    } catch (error: any) {
        logger.error('getMeetings error:', error.message);
        sendError(res, error.message || 'Could not fetch meetings', 500);
    }
};

export const updateMeeting = async (req: Request, res: Response) => {
    try {
        const meetingId = parseInt(req.params.id as string);
        if (isNaN(meetingId)) return sendError(res, 'Invalid meeting ID', 400);

        const { status, meet_link, date, time, duration } = req.body;
        
        if (status && !['upcoming', 'completed', 'cancelled'].includes(status)) {
            return sendError(res, 'Invalid status', 400);
        }

        const meeting = await meetingService.updateMeeting(meetingId, { status, meet_link, date, time, duration });
        sendSuccess(res, meeting, 'Meeting updated');
    } catch (error: any) {
        logger.error('updateMeeting error:', error.message);
        sendError(res, error.message || 'Could not update meeting', 500);
    }
};

export const deleteMeeting = async (req: Request, res: Response) => {
    try {
        const meetingId = parseInt(req.params.id as string);
        if (isNaN(meetingId)) return sendError(res, 'Invalid meeting ID', 400);

        const result = await meetingService.deleteMeeting(meetingId);
        sendSuccess(res, result, 'Meeting deleted');
    } catch (error: any) {
        logger.error('deleteMeeting error:', error.message);
        sendError(res, error.message || 'Could not delete meeting', 500);
    }
};
