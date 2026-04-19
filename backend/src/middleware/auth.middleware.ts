import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Check if the Authorization header exists
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        // 2. Extract the token
        const token = authHeader.split(' ')[1];

        // Basic check for empty or "null/undefined" strings from frontend
        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({ error: 'Unauthorized: Malformed token' });
        }

        // 3. Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        // 4. Attach the user payload to the request object
        req.user = decoded;

        // 5. Move to the next function (the controller)
        next();
    } catch (error: any) {
        // Log common JWT errors more clearly
        if (error.name === 'JsonWebTokenError') {
            console.error('JWT Error:', error.message);
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Unauthorized: Token expired' });
        }
        
        console.error('Auth Middleware Internal Error:', error);
        return res.status(500).json({ error: 'Internal server error during authentication' });
    }
};