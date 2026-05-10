import { createContext, useContext } from 'react';
import type { User } from '../types';
import * as authApi from '../services/authApi';

export interface AuthContextType {
    user: User | null;
    loginWithGoogle: (credential: string) => Promise<void>;
    loginWithCredentials: (email: string, password: string) => Promise<void>;
    register: (payload: authApi.RegisterPayload) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
