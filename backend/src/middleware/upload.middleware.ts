import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure the uploads directory exists at startup
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Multer disk storage configuration.
 * Files are stored at: backend/uploads/<fieldname>-<timestamp>.<ext>
 */
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext).replace(/\s+/g, '_');
        cb(null, `${base}-${Date.now()}${ext}`);
    },
});

/**
 * Only allow common document and image types.
 */
const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    const allowed = [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        // Images
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        // Code / data
        'application/json',
        'application/xml',
    ];

    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
};

/**
 * General-purpose file upload middleware — 10 MB limit.
 * Use as: router.post('/upload', upload.single('file'), controller)
 */
export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});
