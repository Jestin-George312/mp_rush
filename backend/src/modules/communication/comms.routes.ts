import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { getMessages, sendMessage, getGroupMessages, getGroupDetails } from './comms.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';

const router = Router();
router.use(requireAuth);

// Existing endpoints
router.get('/messages', getMessages);

// Wrap upload in error handler so file-type rejections return JSON, not 500
router.post('/messages', (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
        }
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        sendMessage(req, res);
    });
});

// New Socket.io chat endpoints
router.get('/messages/group/:groupId', getGroupMessages);
router.get('/group/:groupId/details', getGroupDetails);

export default router;
