import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from './notification.controller';

const router = Router();
router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

export default router;
