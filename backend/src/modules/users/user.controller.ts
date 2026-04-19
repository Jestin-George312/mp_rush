import { Request, Response } from 'express';
import * as userService from './user.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';

// ────────────────────────────────────────────────────────────
// GET /api/users/profile
// ────────────────────────────────────────────────────────────
export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const profile = await userService.getUserProfile(userId);
        sendSuccess(res, profile, 'Profile fetched successfully');
    } catch (error: any) {
        logger.error('getProfile error:', error.message);
        sendError(res, error.message || 'Could not fetch profile', 404);
    }
};

// ────────────────────────────────────────────────────────────
// PATCH /api/users/profile
// ────────────────────────────────────────────────────────────
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { full_name, department, phone, bio, location } = req.body;

        const updated = await userService.updateUserProfile(userId, {
            full_name,
            department,
            phone,
            bio,
            location,
        });
        sendSuccess(res, updated, 'Profile updated successfully');
    } catch (error: any) {
        logger.error('updateProfile error:', error.message);
        sendError(res, error.message || 'Could not update profile', 500);
    }
};

// ────────────────────────────────────────────────────────────
// POST /api/users/profile/photo
// ────────────────────────────────────────────────────────────
export const uploadPhoto = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        if (!req.file) {
            return sendError(res, 'No file uploaded', 400);
        }

        const result = await userService.updateProfilePhoto(userId, req.file.filename);
        sendSuccess(res, result, 'Profile photo updated');
    } catch (error: any) {
        logger.error('uploadPhoto error:', error.message);
        sendError(res, error.message || 'Could not upload photo', 500);
    }
};
