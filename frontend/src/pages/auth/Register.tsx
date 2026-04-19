import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../hooks/useAuth';
import { LayoutDashboard, Mail, Lock, Eye, EyeOff, User, UserPlus, Building2 } from 'lucide-react';
import ThemeToggle from '../../components/common/UI/ThemeToggle';
import toast from 'react-hot-toast';



const Register: React.FC = () => {
    const { register, loginWithGoogle, isLoading } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role] = useState('student');
    const [department, setDepartment] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!fullName || !email || !password || !confirmPassword) {
            toast.error('Please fill in all required fields.');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        setFormLoading(true);
        try {
            await register({
                full_name: fullName,
                email,
                password,
                role,
                department: department || undefined,
            });
            toast.success('Account created successfully!');
        } catch {
            toast.error('Registration failed. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    if (isLoading && !formLoading) return (
        <div className="h-screen w-full flex items-center justify-center bg-[rgb(var(--color-bg))]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]"></div>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] flex flex-col font-sans transition-colors duration-300">
            <nav className="w-full px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="text-[rgb(var(--color-primary))]">
                        <LayoutDashboard size={24} fill="currentColor" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">APMS</span>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link
                        to="/login"
                        className="bg-[rgb(var(--color-primary))] hover:opacity-90 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <div className="w-full max-w-[460px] bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-2xl p-8 sm:p-10 shadow-2xl">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-3">Create Account</h1>
                        <p className="text-[rgb(var(--color-muted))] text-sm">Join the Academic Project Monitoring System</p>
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label htmlFor="register-name" className="block text-xs font-medium mb-1.5 text-[rgb(var(--color-muted))]">
                                Full Name
                            </label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))]" />
                                <input
                                    id="register-name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-lg pl-10 pr-3 py-2.5 text-sm text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/40 focus:border-[rgb(var(--color-primary))] transition-all"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="register-email" className="block text-xs font-medium mb-1.5 text-[rgb(var(--color-muted))]">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))]" />
                                <input
                                    id="register-email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-lg pl-10 pr-3 py-2.5 text-sm text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/40 focus:border-[rgb(var(--color-primary))] transition-all"
                                />
                            </div>
                        </div>

                        {/* Department Area */}
                        <div>
                            <label htmlFor="register-department" className="block text-xs font-medium mb-1.5 text-[rgb(var(--color-muted))]">
                                Department <span className="text-[rgb(var(--color-muted))]">(optional)</span>
                            </label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))]" />
                                <input
                                    id="register-department"
                                    type="text"
                                    placeholder="e.g. MCA"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-lg pl-10 pr-3 py-2.5 text-sm text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/40 focus:border-[rgb(var(--color-primary))] transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="register-password" className="block text-xs font-medium mb-1.5 text-[rgb(var(--color-muted))]">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))]" />
                                <input
                                    id="register-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-lg pl-10 pr-10 py-2.5 text-sm text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/40 focus:border-[rgb(var(--color-primary))] transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="register-confirm-password" className="block text-xs font-medium mb-1.5 text-[rgb(var(--color-muted))]">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))]" />
                                <input
                                    id="register-confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Repeat your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[rgb(var(--color-input))] border border-[rgb(var(--color-border))] rounded-lg pl-10 pr-10 py-2.5 text-sm text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]/40 focus:border-[rgb(var(--color-primary))] transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-text))] transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={formLoading}
                            className="w-full bg-[rgb(var(--color-primary))] hover:opacity-90 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                        >
                            {formLoading ? (
                                <span className="animate-spin inline-block h-4 w-4 rounded-full border-b-2 border-white" />
                            ) : (
                                <>
                                    <UserPlus size={16} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative py-5 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-[rgb(var(--color-border))]"></span>
                        </div>
                        <span className="relative bg-[rgb(var(--color-card))] px-3 text-[10px] uppercase tracking-wider text-[rgb(var(--color-muted))] font-medium">
                            Or sign up with
                        </span>
                    </div>

                    {/* Google Sign-In */}
                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={async (credentialResponse) => {
                                if (credentialResponse.credential) {
                                    try {
                                        await loginWithGoogle(credentialResponse.credential);
                                        toast.success('Account created successfully!');
                                    } catch {
                                        toast.error('Google sign-up failed. Please try again.');
                                    }
                                }
                            }}
                            onError={() => {
                                toast.error('Google sign-up failed. Please try again.');
                            }}
                            theme="outline"
                            size="large"
                            width="380"
                            text="signup_with"
                            shape="rectangular"
                        />
                    </div>

                    <p className="mt-6 text-center text-sm text-[rgb(var(--color-muted))]">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[rgb(var(--color-primary))] hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>

                    <p className="mt-4 text-center text-xs text-[rgb(var(--color-muted))]">
                        By creating an account, you agree to our{' '}
                        <a href="#" className="underline hover:opacity-80">Terms of Service</a>{' '}
                        and{' '}
                        <a href="#" className="underline hover:opacity-80">Privacy Policy</a>.
                    </p>
                </div>
            </div>

            <footer className="py-6 text-center text-xs text-[rgb(var(--color-muted))] border-t border-[rgb(var(--color-border))]">
                © 2026 Academic Project Monitoring System. All rights reserved.
            </footer>
        </div>
    );
};

export default Register;
