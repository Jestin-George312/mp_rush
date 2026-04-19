import { Router } from 'express';
import { googleLogin, getCurrentUser } from './auth.controller';
import { registerUser, loginUser } from './auth.local.controller';
import { requireAuth } from '../../middleware/auth.middleware';
const router = Router();

// POST /api/auth/google
router.post('/google', googleLogin);

// POST /api/auth/register and login
router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/me', requireAuth, getCurrentUser);

export default router;