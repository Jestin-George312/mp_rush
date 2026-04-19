import api from '../utils/api';

export interface BackendUser {
    uid: number;
    email: string;
    role: string;
    full_name: string;
    profile_img: string | null;
    department: string | null;
}

export interface LoginResponse {
    message: string;
    token: string;
    user: {
        id: number;
        email: string;
        role: string;
        name: string;
        picture: string;
    };
}

export interface RegisterPayload {
    full_name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
}

/**
 * Send the Google ID token to the backend for verification.
 * The backend verifies with Google, upserts the user, and returns a JWT.
 */
export const googleLogin = async (
    credential: string
): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/google', {
        token: credential,
    });

    // Store the JWT for subsequent authenticated requests
    localStorage.setItem('token', data.token);

    return data;
};

/**
 * Login using email and password credentials.
 */
export const loginWithCredentials = async (
    email: string,
    password: string
): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
    });

    localStorage.setItem('token', data.token);

    return data;
};

/**
 * Register a new user account.
 */
export const register = async (
    payload: RegisterPayload
): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/register', payload);

    localStorage.setItem('token', data.token);

    return data;
};

/**
 * Fetch the currently authenticated user's profile from the backend.
 * Requires a valid JWT in localStorage (attached automatically by api interceptor).
 */
export const getCurrentUser = async (): Promise<BackendUser> => {
    const { data } = await api.get<{ user: BackendUser }>('/auth/me');
    return data.user;
};

/**
 * Clear the stored token to log the user out.
 */
export const logout = () => {
    localStorage.removeItem('token');
};
