import { Request, Response } from 'express';
import * as docService from './document.service';
import { sendSuccess, sendError } from '../../utils/response';
import logger from '../../utils/logger';

// POST /api/documents/upload
export const uploadDocument = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        if (!req.file) return sendError(res, 'No file uploaded', 400);

        const { project_id, type } = req.body;
        if (!project_id) return sendError(res, 'project_id is required', 400);

        const allowedTypes = ['SRS', 'Reports', 'Diagrams', 'Other'];
        const docType = allowedTypes.includes(type) ? type : 'Other';

        const doc = await docService.uploadDocument(userId, {
            project_id: parseInt(project_id),
            type: docType as any,
            filename: req.file.filename,
            originalname: req.file.originalname,
        });

        sendSuccess(res, doc, 'Document uploaded successfully', 201);
    } catch (error: any) {
        logger.error('uploadDocument error:', error.message);
        sendError(res, error.message || 'Could not upload document', 500);
    }
};

// GET /api/documents?projectId=
export const listDocuments = async (req: Request, res: Response) => {
    try {
        const projectId = parseInt(req.query.projectId as string);
        if (isNaN(projectId)) return sendError(res, 'projectId is required', 400);

        const docs = await docService.listDocuments(projectId);
        sendSuccess(res, docs);
    } catch (error: any) {
        logger.error('listDocuments error:', error.message);
        sendError(res, error.message || 'Could not fetch documents', 500);
    }
};

// GET /api/documents/:id/download
export const downloadDocument = async (req: Request, res: Response) => {
    try {
        const docId = parseInt(req.params.id as string);
        const absPath = await docService.getDocumentFilePath(docId);
        res.download(absPath);
    } catch (error: any) {
        logger.error('downloadDocument error:', error.message);
        sendError(res, error.message || 'File not found', 404);
    }
};

// PATCH /api/documents/:id/status
export const updateDocumentStatus = async (req: Request, res: Response) => {
    try {
        const docId = parseInt(req.params.id as string);
        const { status } = req.body;

        if (!['Approved', 'Rejected'].includes(status)) {
            return sendError(res, 'status must be "Approved" or "Rejected"', 400);
        }

        const doc = await docService.updateDocumentStatus(docId, status);
        sendSuccess(res, doc, `Document ${status}`);
    } catch (error: any) {
        logger.error('updateDocumentStatus error:', error.message);
        sendError(res, error.message || 'Could not update status', 500);
    }
};

// DELETE /api/documents/:id
export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const docId = parseInt(req.params.id as string);
        const userId = req.user!.id;

        const result = await docService.deleteDocument(docId, userId);
        sendSuccess(res, result, 'Document deleted');
    } catch (error: any) {
        logger.error('deleteDocument error:', error.message);
        const status = (error as any).status || 500;
        sendError(res, error.message || 'Could not delete document', status);
    }
};
