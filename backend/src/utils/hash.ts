import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password.
 */
export const hashPassword = async (plain: string): Promise<string> => {
    return bcrypt.hash(plain, SALT_ROUNDS);
};

/**
 * Compare a plain-text password against a stored hash.
 * Returns true if they match.
 */
export const comparePassword = async (plain: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(plain, hash);
};
