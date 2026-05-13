import { Router } from 'express';
import * as githubController from './github.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

// Public route for GitHub Webhook
router.post('/webhook', githubController.handleWebhook);

// Protected routes for students
router.post('/link', requireAuth, githubController.linkRepo);
router.get('/commits', requireAuth, githubController.getCommits);

// Guide-accessible routes (by projectId)
router.get('/project/:projectId/commits', requireAuth, githubController.getCommitsByProject);
router.post('/project/:projectId/summarize-commit', requireAuth, githubController.summarizeCommit);
router.get('/project/:projectId/health', requireAuth, githubController.getHealthAnalysis);

// Analysis for guides
router.get('/analyze/:projectId', requireAuth, githubController.analyzeFork);

export default router;
