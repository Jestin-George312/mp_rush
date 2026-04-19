import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, Role } from '../types';
import * as authApi from '../services/authApi';

// Role to dashboard path mapping
const ROLE_DASHBOARDS: Record<string, string> = {
    student: '/student/dashboard',
    guide: '/guide/dashboard',
    coordinator: '/coordinator/dashboard',
    admin: '/admin/dashboard',
};

const normalizeRole = (role: string): Role => {
    return role.toLowerCase() as Role;
};

const mapBackendUser = (backendUser: authApi.BackendUser): User => ({
    id: String(backendUser.uid),
    name: backendUser.full_name,
    email: backendUser.email,
    role: normalizeRole(backendUser.role),
    picture: backendUser.profile_img || undefined,
});

const mapLoginUser = (loginUser: authApi.LoginResponse['user']): User => ({
    id: String(loginUser.id),
    name: loginUser.name,
    email: loginUser.email,
    role: normalizeRole(loginUser.role),
    picture: loginUser.picture || undefined,
});

interface AuthContextType {
    user: User | null;
    loginWithGoogle: (credential: string) => Promise<void>;
    loginWithCredentials: (email: string, password: string) => Promise<void>;
    register: (payload: authApi.RegisterPayload) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const restoreSession = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const backendUser = await authApi.getCurrentUser();
                setUser(mapBackendUser(backendUser));
            } catch {
                authApi.logout();
            } finally {
                setIsLoading(false);
            }
        };

        restoreSession();
    }, []);

    const loginWithGoogle = useCallback(async (credential: string) => {
        setIsLoading(true);
        try {
            const result = await authApi.googleLogin(credential);
            const mappedUser = mapLoginUser(result.user);
            setUser(mappedUser);
            navigate(ROLE_DASHBOARDS[mappedUser.role] || '/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const loginWithCredentials = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const result = await authApi.loginWithCredentials(email, password);
            const mappedUser = mapLoginUser(result.user);
            setUser(mappedUser);
            navigate(ROLE_DASHBOARDS[mappedUser.role] || '/dashboard');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const register = useCallback(async (payload: authApi.RegisterPayload) => {
        setIsLoading(true);
        try {
            const result = await authApi.register(payload);
            const mappedUser = mapLoginUser(result.user);
            setUser(mappedUser);
            navigate(ROLE_DASHBOARDS[mappedUser.role] || '/dashboard');
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const logout = useCallback(() => {
        authApi.logout();
        setUser(null);
        navigate('/login');
    }, [navigate]);

    return (
        <AuthContext.Provider value={{ user, loginWithGoogle, loginWithCredentials, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
