import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Global Express error handler.
 * Must be registered LAST in server.ts (after all routes).
 *
 * Usage: app.use(errorHandler);
 */
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Log the full error for debugging
    logger.error(`Unhandled error on ${req.method} ${req.path}: ${err.message}`, err.stack);

    const statusCode = typeof err.status === 'number' ? err.status : 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        // Only expose stack trace in development
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
};
