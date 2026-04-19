import { Request, Response } from 'express';
import { verifyGoogleTokenAndLogin } from './auth.service';
import pool from '../../config/db';

export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const result = await verifyGoogleTokenAndLogin(token);

        // Send the JWT and user data back to the frontend
        res.status(200).json(result);

    } catch (error: any) {
        console.error('Auth Controller Error:', error);
        res.status(401).json({ error: error.message || 'Authentication failed' });
    }
};

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        // req.user is populated by the requireAuth middleware!
        const userId = req.user?.id;

        // Fetch fresh, combined data from users and profiles tables
        const query = `
      SELECT 
        u.uid, u.email, u.role, 
        p.full_name, p.profile_img, p.department 
      FROM users u 
      LEFT JOIN profiles p ON u.uid = p.u_id 
      WHERE u.uid = $1 AND u.is_deleted = FALSE
    `;

        const result = await pool.query(query, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Send the fresh user data back to the frontend
        res.status(200).json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get Current User Error:', error);
        res.status(500).json({ error: 'Server error fetching user data' });
    }
};