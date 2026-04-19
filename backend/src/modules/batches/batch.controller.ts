import { Request, Response } from 'express';
import * as batchService from './batch.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';

export const createBatch = async (req: Request, res: Response) => {
    try {
        const { name, start_year, end_year } = req.body;
        if (!name || !start_year || !end_year) {
            return sendError(res, 'name, start_year, and end_year are required', 400);
        }

        const batch = await batchService.createBatch({ name, start_year, end_year });
        sendSuccess(res, batch, 'Batch created successfully', 201);
    } catch (error: any) {
        logger.error('createBatch error:', error.message);
        sendError(res, error.message || 'Could not create batch', 500);
    }
};

export const listBatches = async (req: Request, res: Response) => {
    try {
        const batches = await batchService.listBatches();
        sendSuccess(res, batches);
    } catch (error: any) {
        logger.error('listBatches error:', error.message);
        sendError(res, error.message || 'Could not fetch batches', 500);
    }
};

export const updateBatch = async (req: Request, res: Response) => {
    try {
        const batchId = parseInt(req.params.id as string);
        const { name, is_active } = req.body;

        const batch = await batchService.updateBatch(batchId, { name, is_active });
        sendSuccess(res, batch, 'Batch updated');
    } catch (error: any) {
        logger.error('updateBatch error:', error.message);
        sendError(res, error.message || 'Could not update batch', 500);
    }
};
