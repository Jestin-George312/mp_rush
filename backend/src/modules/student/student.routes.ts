import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';
import { upload } from '../../middleware/upload.middleware';
import {
    createProject,
    createTask,
    getGitCommits,
    getProject,
    getStats,
    getSubmissions,
    getTasks,
    linkRepository,
    submitDocument,
    updateTask,
    getInvitations,
    respondToInvitation,
    requestExtension,
    getDeadlines,
    getBatchMates,
    getFeedback,
    getBatchSettings,
} from './student.controller';

const router = Router();

router.use(requireAuth, requireRoles(['student', 'Student']));

router.get('/stats', getStats);
router.get('/batch-settings', getBatchSettings);
router.get('/project', getProject);
router.post('/project', createProject);
router.post('/project/github', linkRepository);
router.get('/project/git/commits', getGitCommits);

router.get('/deadlines', getDeadlines);
router.get('/batch-mates', getBatchMates);
router.get('/submissions', getSubmissions);
router.get('/feedback', getFeedback);
router.post('/submissions', upload.single('file'), submitDocument);

router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.patch('/tasks/:taskId', updateTask);

router.get('/invitations', getInvitations);
router.post('/invitations/:id/respond', respondToInvitation);
router.post('/extensions/request', requestExtension);

export default router;
