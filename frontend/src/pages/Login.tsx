import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle.tsx';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const { loginWithGoogle, isLoading } = useAuth();

  if (isLoading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[rgb(var(--color-bg))]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]"></div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] flex flex-col font-sans transition-colors duration-300">

      {/* 1. Navbar (Top Section) */}
      <nav className="w-full px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="text-[rgb(var(--color-primary))]">
            <LayoutDashboard size={24} fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight">APMS</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button className="bg-[rgb(var(--color-primary))] hover:opacity-90 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
            Request Access
          </button>
        </div>
      </nav>

      {/* 2. Main Content (Centered Card) */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] bg-[rgb(var(--color-card))] border-[rgb(var(--color-border))] rounded-2xl p-8 sm:p-10 shadow-2xl dark:shadow-2xl">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">Sign In</h1>
            <p className="text-[rgb(var(--color-muted))] text-sm">
              Sign in to the Academic Project Monitoring System
            </p>
          </div>

          {/* Sign-in Section */}
          <div className="space-y-5">
            {/* Divider */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[rgb(var(--color-border))]"></span>
              </div>
              <span className="relative bg-[rgb(var(--color-card))] px-3 text-[10px] uppercase tracking-wider text-[rgb(var(--color-muted))] font-medium">
                Sign in with your account
              </span>
            </div>

            {/* Google Sign-In — returns credential (ID token) directly */}
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    try {
                      await loginWithGoogle(credentialResponse.credential);
                      toast.success('Welcome back!');
                    } catch {
                      toast.error('Login failed. Please try again.');
                    }
                  }
                }}
                onError={() => {
                  toast.error('Google sign-in failed. Please try again.');
                }}
                theme="outline"
                size="large"
                width="350"
                text="continue_with"
                shape="rectangular"
              />
            </div>
          </div>

          {/* Footer inside card */}
          <p className="mt-8 text-center text-xs text-[rgb(var(--color-muted))]">
            By signing in, you agree to our <a href="#" className="underline hover:opacity-80">Terms of Service</a> and <a href="#" className="underline hover:opacity-80">Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* 3. Footer (Bottom Section) */}
      <footer className="py-6 text-center text-xs text-[rgb(var(--color-muted))] border-t border-[rgb(var(--color-border))]">
        © 2026 Academic Project Monitoring System. All rights reserved.
      </footer>

    </div>
  );
};

export default Login;
