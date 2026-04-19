import { Response } from 'express';

/**
 * Send a standardized success response.
 */
export const sendSuccess = (
    res: Response,
    data: unknown,
    message = 'Success',
    statusCode = 200
): Response => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Send a standardized error response.
 */
export const sendError = (
    res: Response,
    message: string,
    statusCode = 500,
    details?: unknown
): Response => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(details !== undefined && { details }),
    });
};
