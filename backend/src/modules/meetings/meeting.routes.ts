import { Router } from 'express';
import { createMeeting, getMeetings, updateMeeting, deleteMeeting } from './meeting.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();
router.use(requireAuth);

// GET /api/meetings
router.get('/', getMeetings);

// POST /api/meetings (student / guide can request)
router.post('/', createMeeting);

// PATCH /api/meetings/:id (guide accepts/reschedules)
router.patch('/:id', updateMeeting);

// DELETE /api/meetings/:id 
router.delete('/:id', deleteMeeting);

export default router;
