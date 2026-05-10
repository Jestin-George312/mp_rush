import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';
import {
    createExtensionRequest,
    reviewExtensionRequest,
    getExtensionRequests,
} from './extension.controller';

const router = Router();
router.use(requireAuth);

// GET  /api/extensions       — list extension requests (role-filtered)
router.get('/', getExtensionRequests);

// POST /api/extensions       — student submits an extension request
router.post('/', requireRoles(['student', 'Student']), createExtensionRequest);

// POST /api/extensions/:id/review — guide approves/rejects
router.post('/:id/review', requireRoles(['guide', 'Guide']), reviewExtensionRequest);

export default router;
