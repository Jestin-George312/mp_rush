import { Router } from 'express';
import { saveRubric, getRubrics, submitScores, getScores } from './evaluation.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();
router.use(requireAuth);

// GET /api/evaluations/rubrics
router.get('/rubrics', getRubrics);

// POST /api/evaluations/rubrics
router.post('/rubrics', requireRoles(['coordinator', 'admin']), saveRubric);

// GET /api/evaluations/scores?groupId=
router.get('/scores', getScores);

// POST /api/evaluations/scores
router.post('/scores', requireRoles(['guide', 'coordinator']), submitScores);

export default router;
