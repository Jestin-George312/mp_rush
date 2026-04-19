import jwt from 'jsonwebtoken';

export interface JwtPayload {
    id: number;
    email: string;
    role: string;
    name?: string;
    picture?: string | null;
}

/**
 * Sign a JWT with the app secret.
 * @param payload  Data to embed in the token
 * @param expiresIn Default 24 hours
 */
export const signToken = (payload: JwtPayload, expiresIn = '24h'): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set in environment');
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

/**
 * Verify and decode a JWT.
 * Throws JsonWebTokenError if invalid or expired.
 */
export const verifyToken = (token: string): JwtPayload => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not set in environment');
    return jwt.verify(token, secret) as JwtPayload;
};
