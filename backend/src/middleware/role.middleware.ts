import { Request, Response, NextFunction } from 'express';

// Pass an array of allowed roles, e.g., requireRoles(['Coordinator', 'Admin'])
export const requireRoles = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {

        // Safety check: Ensure requireAuth ran first
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized: User not found on request' });
        }

        const userRole = String(req.user.role).toLowerCase();
        const normalizedAllowedRoles = allowedRoles.map((role) => role.toLowerCase());

        // Check if the user's role is in the allowed list
        if (!normalizedAllowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: `Forbidden: Requires one of [${allowedRoles.join(', ')}]. You are a ${req.user.role}.`
            });
        }

        // User is authorized
        next();
    };
};
