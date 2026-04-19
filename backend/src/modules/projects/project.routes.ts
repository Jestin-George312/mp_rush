import { Router } from 'express';
import {
    submitProject,
    listProjects,
    getProject,
    updateProjectStatus,
    updateProjectProgress,
    listGroups,
    getMyGroups,
    assignGuide,
    getCoordinatorStats,
} from './project.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();

// All routes require auth
router.use(requireAuth);

// ── Project Routes ──────────────────────────────────────────
// Dashboard Stats route - must come before /:id routes
router.get('/stats/coordinator', requireRoles(['coordinator']), getCoordinatorStats);

// POST   /api/projects          — student submits a proposal
router.post('/', requireRoles(['student']), submitProject);

// GET    /api/projects          — list (role-filtered)
router.get('/', listProjects);

// GET    /api/projects/:id      — get single project
router.get('/:id', getProject);

// PATCH  /api/projects/:id/status   — guide approves/rejects
router.patch('/:id/status', requireRoles(['guide', 'coordinator']), updateProjectStatus);

// PATCH  /api/projects/:id/progress — update progress
router.patch('/:id/progress', updateProjectProgress);

// ── Group Routes ────────────────────────────────────────────
// GET    /api/groups            — coordinator: all groups
router.get('/groups/all', requireRoles(['coordinator']), listGroups);

// GET    /api/groups/mine       — guide: own groups
router.get('/groups/mine', requireRoles(['guide']), getMyGroups);

// PATCH  /api/groups/:id/guide  — coordinator: assign guide
router.patch('/groups/:id/guide', requireRoles(['coordinator']), assignGuide);

export default router;
