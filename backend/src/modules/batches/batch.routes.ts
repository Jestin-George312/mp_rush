import { Router } from 'express';
import { createBatch, listBatches, updateBatch } from './batch.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();
router.use(requireAuth);

router.get('/', listBatches);
router.post('/', requireRoles(['coordinator', 'admin']), createBatch);
router.patch('/:id', requireRoles(['coordinator', 'admin']), updateBatch);

export default router;
