import { Router } from 'express';
import { getMessages, sendMessage } from './comms.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();
router.use(requireAuth);

router.get('/messages', getMessages);
router.post('/messages', sendMessage);

export default router;
