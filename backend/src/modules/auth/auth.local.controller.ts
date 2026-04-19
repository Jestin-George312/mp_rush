import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/db';
import { Request, Response } from 'express';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { full_name, email, password, role, department } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 1. Check if user already exists
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Start Transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const actualRole = role || 'student'; // Default to student

            // Insert into Users table
            const insertUserQuery = `
        INSERT INTO users (email, password_hash, auth_provider, role) 
        VALUES ($1, $2, 'local', $3) 
        RETURNING uid
      `;
            const userResult = await client.query(insertUserQuery, [email, passwordHash, actualRole]);
            const userId = userResult.rows[0].uid;

            // Insert into Profiles table
            const insertProfileQuery = `
        INSERT INTO profiles (u_id, full_name, department) 
        VALUES ($1, $2, $3)
      `;
            await client.query(insertProfileQuery, [userId, full_name, department || null]);

            await client.query('COMMIT');

            // 4. Generate JWT
            const jwtPayload = {
                id: userId,
                email,
                role: actualRole,
                name: full_name,
                picture: null
            };

            const token = jwt.sign(jwtPayload, process.env.JWT_SECRET as string, { expiresIn: '24h' });

            return res.status(201).json({
                message: 'Registration successful',
                token,
                user: jwtPayload
            });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // 1. Find user and their profile
        const query = `
      SELECT u.uid, u.email, u.password_hash, u.role, u.is_deleted, p.full_name, p.profile_img 
      FROM users u 
      LEFT JOIN profiles p ON u.uid = p.u_id 
      WHERE u.email = $1
    `;
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        if (user.is_deleted) {
            return res.status(403).json({ error: 'Account has been deactivated' });
        }

        if (!user.password_hash) {
            return res.status(401).json({ error: 'Please sign in using Google' });
        }

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // 3. Generate JWT
        const jwtPayload = {
            id: user.uid,
            email: user.email,
            role: user.role,
            name: user.full_name,
            picture: user.profile_img
        };

        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET as string, { expiresIn: '24h' });

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: jwtPayload
        });
    } catch (error: any) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};
