import { Router } from 'express';
import { getProfile, updateProfile, uploadPhoto } from './user.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';

const router = Router();

// All user routes require a valid JWT
router.use(requireAuth);

// GET  /api/users/profile        — get own profile
router.get('/profile', getProfile);

// PATCH /api/users/profile       — update name, dept, phone, bio, location
router.patch('/profile', updateProfile);

// POST /api/users/profile/photo  — upload a new profile picture
router.post('/profile/photo', upload.single('photo'), uploadPhoto);

export default router;
