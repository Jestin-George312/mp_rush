import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import pool from '../../config/db';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleTokenAndLogin = async (token: string) => {
    // 1. Verify token with Google
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid Google payload');

    const { email, name, sub: googleId, picture } = payload;

    // 2. Check if user exists in the database
    let userResult = await pool.query('SELECT * FROM users WHERE email = $1 AND is_deleted = FALSE', [email]);
    let user = userResult.rows[0];

    if (!user) {
        // 3. If new, create the user (Defaulting to Student)
        const insertUserQuery = `
      INSERT INTO users (email, auth_provider, oauth_id, role) 
      VALUES ($1, 'google', $2, 'Student') 
      RETURNING uid, email, role
    `;
        const newUserResult = await pool.query(insertUserQuery, [email, googleId]);
        user = newUserResult.rows[0];

        // Create the linked profile
        const insertProfileQuery = `
      INSERT INTO profiles (u_id, full_name, profile_img)
      VALUES ($1, $2, $3)
    `;
        await pool.query(insertProfileQuery, [user.uid, name, picture]);
    } else if (user.auth_provider === 'local') {
        // Link Google to existing local account
        await pool.query(
            'UPDATE users SET auth_provider = $1, oauth_id = $2 WHERE uid = $3',
            ['google', googleId, user.uid]
        );
    }

    // 4. Generate your internal JWT
    const jwtPayload = {
        id: user.uid,
        email: user.email,
        role: user.role,
        name: name,
        picture: picture
    };

    const internalToken = jwt.sign(jwtPayload, process.env.JWT_SECRET as string, {
        expiresIn: '24h'
    });

    return {
        message: 'Login successful',
        token: internalToken,
        user: jwtPayload
    };
};