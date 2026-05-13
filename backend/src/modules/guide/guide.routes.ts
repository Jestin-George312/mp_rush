import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';
import { upload } from '../../middleware/upload.middleware';
import {
    approveTopic,
    getBatchGroups,
    getBatches,
    getGitMonitoring,
    getGroupDetails,
    getGroupKanban,
    getGroups,
    getPendingDocuments,
    getPendingTopics,
    getStats,
    getTopics,
    rejectTopic,
    requestRevision,
    reviewDocument,
    getUpcomingDeadlines,
    markProjectCompleted,
    getExtensionRequests,
    handleExtensionRequest,
} from './guide.controller';

const router = Router();

router.use(requireAuth, requireRoles(['guide', 'Guide']));

router.get('/stats', getStats);
router.get('/batches', getBatches);
router.get('/batches/:batchId/groups', getBatchGroups);
router.get('/topics/pending', getPendingTopics);
router.get('/topics', getTopics);
router.post('/topics/:id/approve', approveTopic);
router.post('/topics/:id/reject', rejectTopic);
router.post('/topics/:id/revision', requestRevision);
router.get('/groups', getGroups);
router.get('/groups/:groupId', getGroupDetails);
router.post('/projects/:id/complete', markProjectCompleted);
router.get('/documents/pending', getPendingDocuments);
router.post('/documents/:docId/review', upload.single('file'), reviewDocument);
router.get('/git-monitoring', getGitMonitoring);
router.get('/groups/:groupId/kanban', getGroupKanban);
router.get('/deadlines/upcoming', getUpcomingDeadlines);
router.get('/extensions/pending', getExtensionRequests);
router.post('/extensions/:id/review', handleExtensionRequest);

export default router;
