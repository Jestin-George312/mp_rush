import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';
import {
    assignGuide,
    createBatch,
    createDeadline,
    createFaculty,
    createStudent,
    deleteDeadline,
    getBatches,
    getDeadlines,
    getFaculty,
    getGuideAllocations,
    getProjectHealth,
    getProjects,
    getStats,
    getStudents,
    getSubmissionAudit,
    getTopicAudit,
    importStudents,
    updateDeadline,
    updateFaculty,
} from './coordinator.controller';

const router = Router();

router.use(requireAuth, requireRoles(['coordinator', 'Coordinator', 'admin', 'Admin']));

router.get('/stats', getStats);

router.get('/faculty', getFaculty);
router.post('/faculty', createFaculty);
router.patch('/faculty/:id', updateFaculty);

router.get('/batches', getBatches);
router.post('/batches', createBatch);

router.get('/students', getStudents);
router.post('/students', createStudent);
router.post('/students/import', importStudents);

router.get('/allocation/guides/:batchId', getGuideAllocations);
router.post('/allocation/assign', assignGuide);

router.get('/projects', getProjects);

router.get('/deadlines/:batchId', getDeadlines);
router.post('/deadlines', createDeadline);
router.patch('/deadlines/:id', updateDeadline);
router.delete('/deadlines/:id', deleteDeadline);

router.get('/audit/submissions', getSubmissionAudit);
router.get('/audit/topics', getTopicAudit);
router.get('/audit/health', getProjectHealth);

export default router;
