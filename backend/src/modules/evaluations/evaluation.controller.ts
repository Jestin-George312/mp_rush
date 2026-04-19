import { Request, Response } from 'express';
import * as evalService from './evaluation.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';

export const saveRubric = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { name, totalScore, criteria } = req.body;

        if (!name || !totalScore || !criteria) {
            return sendError(res, 'Missing required fields', 400);
        }

        const rubric = await evalService.saveRubric(userId, { name, totalScore, criteria });
        sendSuccess(res, rubric, 'Rubric saved', 201);
    } catch (error: any) {
        logger.error('saveRubric error:', error.message);
        sendError(res, error.message || 'Could not save rubric', 500);
    }
};

export const getRubrics = async (req: Request, res: Response) => {
    try {
        const rubrics = await evalService.getRubrics();
        sendSuccess(res, rubrics);
    } catch (error: any) {
        logger.error('getRubrics error:', error.message);
        sendError(res, error.message || 'Could not fetch rubrics', 500);
    }
};

export const submitScores = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { rubric_id, group_id, scores, total } = req.body;

        if (!rubric_id || !group_id || !scores || total === undefined) {
            return sendError(res, 'Missing required fields', 400);
        }

        const scoreRecord = await evalService.submitScores(userId, { rubric_id, group_id, scores, total });
        sendSuccess(res, scoreRecord, 'Scores submitted successfully');
    } catch (error: any) {
        logger.error('submitScores error:', error.message);
        sendError(res, error.message || 'Could not submit scores', 500);
    }
};

export const getScores = async (req: Request, res: Response) => {
    try {
        let groupId = req.query.groupId ? parseInt(req.query.groupId as string) : NaN;
        
        if (isNaN(groupId)) {
             return sendError(res, 'groupId is required', 400);
        }

        const scores = await evalService.getScores(groupId);
        sendSuccess(res, scores);
    } catch (error: any) {
        logger.error('getScores error:', error.message);
        sendError(res, error.message || 'Could not fetch scores', 500);
    }
};
