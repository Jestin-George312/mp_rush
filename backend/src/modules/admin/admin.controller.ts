import { Request, Response } from 'express';
import * as adminService from './admin.service';
import bcrypt from 'bcrypt';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';

export const deleteCoordinator = async (req: Request, res: Response) => {
    try {
        const coordinatorId = parseInt(req.params.id as string);
        if (isNaN(coordinatorId)) return sendError(res, 'Invalid coordinator ID', 400);

        const data = await adminService.deleteCoordinator(coordinatorId);
        sendSuccess(res, data, 'Coordinator deleted successfully');
    } catch (error: any) {
        logger.error('deleteCoordinator error:', error.message);
        sendError(res, error.message || 'Could not delete coordinator', 500);
    }
};

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const departments = await adminService.getAllDepartments();
        sendSuccess(res, departments);
    } catch (error: any) {
        logger.error('getDepartments error:', error.message);
        sendError(res, error.message || 'Failed to fetch departments', 500);
    }
};

export const addDepartment = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return sendError(res, 'Department name is required', 400);
        const newDepartment = await adminService.createDepartment(name);
        sendSuccess(res, newDepartment, 'Department added', 201);
    } catch (error: any) {
        logger.error('addDepartment error:', error.message);
        sendError(res, error.message || 'Failed to add department', 500);
    }
};

export const removeDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await adminService.deleteDepartment(parseInt(id as string));
        sendSuccess(res, null, 'Department deleted successfully');
    } catch (error: any) {
        logger.error('removeDepartment error:', error.message);
        sendError(res, error.message || 'Failed to delete department', 500);
    }
};

// --- Coordinator Controllers ---

export const getCoordinators = async (req: Request, res: Response) => {
    try {
        const coordinators = await adminService.listCoordinators();
        sendSuccess(res, coordinators);
    } catch (error: any) {
        logger.error('getCoordinators error:', error.message);
        sendError(res, error.message || 'Failed to fetch coordinators', 500);
    }
};

export const addCoordinator = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return sendError(res, 'Missing required fields', 400);
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newCoordinator = await adminService.createCoordinator({ name, email, password_hash });
        sendSuccess(res, newCoordinator, 'Coordinator created', 201);
    } catch (error: any) {
        logger.error('addCoordinator error:', error.message);
        sendError(res, error.message || 'Failed to create coordinator', 500);
    }
};

// --- Batch Management Controllers ---

export const getBatchesList = async (req: Request, res: Response) => {
    try {
        const batches = await adminService.listBatchesWithCoordinators();
        sendSuccess(res, batches);
    } catch (error: any) {
        logger.error('getBatchesList error:', error.message);
        sendError(res, error.message || 'Failed to fetch batches', 500);
    }
};

export const assignToDepartment = async (req: Request, res: Response) => {
    try {
        const { departmentId, coordinatorId } = req.body;
        // coordinatorId can be null to unassign
        if (!departmentId) {
            return sendError(res, 'Missing departmentId', 400);
        }

        const updatedDepartment = await adminService.assignCoordinatorToDepartment(departmentId, coordinatorId ?? null);
        sendSuccess(res, updatedDepartment, 'Coordinator assignment updated');
    } catch (error: any) {
        logger.error('assignToDepartment error:', error.message);
        sendError(res, error.message || 'Failed to assign/unassign coordinator', 500);
    }
};
