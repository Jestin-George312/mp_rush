import { Request, Response } from 'express';
import * as adminService from './admin.service';
import bcrypt from 'bcrypt';

export const getDepartments = async (req: Request, res: Response) => {
    try {
        const departments = await adminService.getAllDepartments();
        res.status(200).json(departments);
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to fetch departments', error: error.message });
    }
};

export const addDepartment = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Department name is required' });
        const newDepartment = await adminService.createDepartment(name);
        res.status(201).json(newDepartment);
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to add department', error: error.message });
    }
};

export const removeDepartment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await adminService.deleteDepartment(parseInt(id as string));
        res.status(200).json({ success: true, message: 'Department deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to delete department', error: error.message });
    }
};

// --- Coordinator Controllers ---

export const getCoordinators = async (req: Request, res: Response) => {
    try {
        const coordinators = await adminService.listCoordinators();
        res.status(200).json(coordinators);
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to fetch coordinators', error: error.message });
    }
};

export const addCoordinator = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newCoordinator = await adminService.createCoordinator({ name, email, password_hash });
        res.status(201).json(newCoordinator);
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to create coordinator', error: error.message });
    }
};

// --- Batch Management Controllers ---

export const getBatchesList = async (req: Request, res: Response) => {
    try {
        const batches = await adminService.listBatchesWithCoordinators();
        res.status(200).json(batches);
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to fetch batches', error: error.message });
    }
};

export const assignToDepartment = async (req: Request, res: Response) => {
    try {
        const { departmentId, coordinatorId } = req.body;
        // coordinatorId can be null to unassign
        if (!departmentId) {
            return res.status(400).json({ success: false, message: 'Missing departmentId' });
        }

        const updatedDepartment = await adminService.assignCoordinatorToDepartment(departmentId, coordinatorId ?? null);
        res.status(200).json(updatedDepartment);
    } catch (error: any) {
        res.status(500).json({ success: false, message: 'Failed to assign/unassign coordinator', error: error.message });
    }
};
