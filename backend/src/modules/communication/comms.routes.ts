import { Router } from 'express';
import { getMessages, sendMessage, getGroupMessages, getGroupDetails } from './comms.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';

const router = Router();
router.use(requireAuth);

// Existing endpoints
router.get('/messages', getMessages);
router.post('/messages', upload.single('file'), sendMessage);

// New Socket.io chat endpoints
router.get('/messages/group/:groupId', getGroupMessages);
router.get('/group/:groupId/details', getGroupDetails);

export default router;
