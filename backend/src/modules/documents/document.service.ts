import pool from '../../config/db';
import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from '../../config/storage';

// ────────────────────────────────────────────────────────────
// POST /api/documents/upload
// ────────────────────────────────────────────────────────────
export const uploadDocument = async (
    userId: number,
    data: { project_id: number; type: any; filename: string; originalname: string; parent_doc_id?: number }
) => {
    let version = 1;
    if (data.parent_doc_id) {
        const parentRes = await pool.query(
            `SELECT version FROM documents WHERE id = $1`,
            [data.parent_doc_id]
        );
        if (parentRes.rows.length > 0) {
            version = parentRes.rows[0].version + 1;
        }
    }

    const result = await pool.query(
        `INSERT INTO documents (project_id, name, file_path, type, uploaded_by, parent_doc_id, version, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
         RETURNING *`,
        [data.project_id, data.originalname, `${UPLOAD_URL_PREFIX}/${data.filename}`, data.type, userId, data.parent_doc_id || null, version]
    );
    return result.rows[0];
};

// ────────────────────────────────────────────────────────────
// GET /api/documents?projectId=
// ────────────────────────────────────────────────────────────
export const listDocuments = async (projectId: number) => {
    const result = await pool.query(
        `SELECT d.*, p.full_name as uploader_name
         FROM documents d
         LEFT JOIN profiles p ON p.u_id = d.uploaded_by
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
    status: 'Approved' | 'Rejected' | 'Needs Revision',
    reviewedBy?: number,
    feedback?: string
) => {
    const result = await pool.query(
        `UPDATE documents SET status = $1, reviewed_by = $2, reviewed_at = NOW(), feedback = $3
         WHERE id = $4 RETURNING *`,
        [status, reviewedBy || null, feedback || null, docId]
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
