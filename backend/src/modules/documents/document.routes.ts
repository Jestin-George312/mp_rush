import { Router } from 'express';
import {
    uploadDocument,
    listDocuments,
    downloadDocument,
    updateDocumentStatus,
    deleteDocument,
} from './document.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/role.middleware';
import { upload } from '../../middleware/upload.middleware';

const router = Router();

router.use(requireAuth);

// POST   /api/documents/upload   — upload a new document
router.post('/upload', upload.single('file'), uploadDocument);

// GET    /api/documents?projectId= — list docs for a project
router.get('/', listDocuments);

// GET    /api/documents/:id/download — download file
router.get('/:id/download', downloadDocument);

// PATCH  /api/documents/:id/status — guide/coordinator approve or reject
router.patch('/:id/status', requireRoles(['guide', 'coordinator']), updateDocumentStatus);

// DELETE /api/documents/:id      — user deletes their own doc
router.delete('/:id', deleteDocument);

export default router;
