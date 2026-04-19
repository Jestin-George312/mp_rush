import path from 'path';

/**
 * Absolute path to the local file upload directory.
 * Resolved relative to this config file so it works regardless of CWD.
 */
export const UPLOAD_DIR = path.join(__dirname, '../../uploads');

/**
 * Public URL prefix used when returning file URLs to the client.
 * The express.static middleware in server.ts maps this path to UPLOAD_DIR.
 */
export const UPLOAD_URL_PREFIX = '/uploads';
