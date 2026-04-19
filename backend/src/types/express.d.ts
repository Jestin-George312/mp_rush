import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: 'Student' | 'Guide' | 'Coordinator' | 'Admin';
                name?: string;
            };
        }
    }
}

export { };