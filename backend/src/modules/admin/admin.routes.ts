import { Router } from 'express';
import * as adminController from './admin.controller';
import { 
    getCoordinators,
    addCoordinator,
    deleteCoordinator,
    getDepartments,
} from './admin.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';

const router = Router();

// Middleware to ensure user is logged in and is an Admin
router.use(requireAuth, requireRoles(['Admin']));

// Department management
router.get('/departments', getDepartments);
router.post('/departments', adminController.addDepartment);
router.delete('/departments/:id', adminController.removeDepartment);
router.post('/departments/assign', adminController.assignToDepartment);

// Coordinator management
router.get('/coordinators', getCoordinators);
router.post('/coordinators', adminController.addCoordinator);
router.delete('/coordinators/:id', deleteCoordinator);

// Batch management (operational)
router.get('/batches', adminController.getBatchesList);

export default router;
