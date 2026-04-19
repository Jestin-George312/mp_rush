import pool from '../../config/db';
import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from '../../config/storage';

// ────────────────────────────────────────────────────────────
// POST /api/documents/upload
// ────────────────────────────────────────────────────────────
export const uploadDocument = async (
    uploadedBy: number,
    data: {
        project_id: number;
        type: 'SRS' | 'Reports' | 'Diagrams' | 'Other';
        filename: string;
        originalname: string;
    }
) => {
    const fileUrl = `${UPLOAD_URL_PREFIX}/${data.filename}`;

    const result = await pool.query(
        `INSERT INTO documents (project_id, uploaded_by, name, file_path, type, status)
         VALUES ($1, $2, $3, $4, $5, 'Pending')
         RETURNING *`,
        [data.project_id, uploadedBy, data.originalname, fileUrl, data.type]
    );
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// GET /api/documents?projectId=
// ────────────────────────────────────────────────────────────
export const listDocuments = async (projectId: number) => {
    const result = await pool.query(
        `SELECT d.*, pr.full_name AS uploader_name
         FROM documents d
         LEFT JOIN profiles pr ON d.uploaded_by = pr.u_id
         WHERE d.project_id = $1
         ORDER BY d.created_at DESC`,
        [projectId]
    );
    return result.rows;
};

// ────────────────────────────────────────────────────────────
// PATCH /api/documents/:id/status  — Guide approves/rejects
// ────────────────────────────────────────────────────────────
export const updateDocumentStatus = async (
    docId: number,
    status: 'Approved' | 'Rejected'
) => {
    const result = await pool.query(
        `UPDATE documents SET status = $1 WHERE id = $2 RETURNING *`,
        [status, docId]
    );
    if (result.rows.length === 0) throw new Error('Document not found');
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// GET /api/documents/:id/download  — returns file path for streaming
// ────────────────────────────────────────────────────────────
export const getDocumentFilePath = async (docId: number): Promise<string> => {
    const result = await pool.query(
        `SELECT file_path FROM documents WHERE id = $1`,
        [docId]
    );
    if (result.rows.length === 0) throw new Error('Document not found');

    // file_path is stored as a URL prefix like /uploads/filename.pdf
    // Convert it to an absolute disk path for streaming
    const urlPath: string = result.rows[0].file_path;
    const filename = path.basename(urlPath);
    const absPath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(absPath)) throw new Error('File not found on disk');
    return absPath;
};

// ────────────────────────────────────────────────────────────
// DELETE /api/documents/:id
// ────────────────────────────────────────────────────────────
export const deleteDocument = async (docId: number, requesterId: number) => {
    // Fetch the document so we can delete the file too
    const res = await pool.query(
        `SELECT * FROM documents WHERE id = $1`,
        [docId]
    );
    if (res.rows.length === 0) throw new Error('Document not found');
    const doc = res.rows[0];

    // Only the uploader can delete
    if (doc.uploaded_by !== requesterId) {
        throw Object.assign(new Error('Forbidden'), { status: 403 });
    }

    // Remove from DB
    await pool.query(`DELETE FROM documents WHERE id = $1`, [docId]);

    // Remove file from disk (best-effort)
    try {
        const filename = path.basename(doc.file_path);
        const absPath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
    } catch {
        // Non-fatal — file may already be gone
    }

    return { deleted: true, id: docId };
};
