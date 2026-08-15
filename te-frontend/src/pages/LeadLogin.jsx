import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, KeyIcon, UserIcon, ArrowLeftIcon } from 'icons';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import AuthAside from '../components/_custom/AuthAside';

const LeadLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('/auth/management-login', {
                username,
                token
            });

            console.log('[LeadLogin] Auth response:', response.data);

            if (response.data.access_token) {
                // Store auth data
                console.log('[LeadLogin] Calling login with:', {
                    userId: response.data.user.id,
                    role: response.data.user.role
                });

                login(
                    response.data.access_token,
                    response.data.user.id,
                    response.data.user.role
                );

                console.log('[LeadLogin] Login complete, navigating to workspace');

                // Check if there's a redirect URL from session expiry
                const redirectPath = sessionStorage.getItem('redirectAfterLogin');
                if (redirectPath && redirectPath !== '/lead-login') {
                    sessionStorage.removeItem('redirectAfterLogin');
                    navigate(redirectPath);
                } else {
                    // Navigate to workspace
                    navigate('/workspace');
                }
            }
        } catch (err) {
            console.error('Lead login error:', err);
            setError(err.response?.data?.detail || 'Invalid username or token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--te-bg)] lg:grid lg:grid-cols-[0.88fr_1.12fr]">
            <AuthAside
                eyebrow="Team access"
                title="Lead with clarity. Support with context."
                description="Manage learning, members, and community operations from the same focused platform."
            />
            <main className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10 lg:px-14">
            <div className="relative max-w-md w-full">
                <button
                    onClick={() => navigate('/login')}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--te-text-dim)] hover:text-[var(--te-text)] transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to member login
                </button>

                <div className="flex items-center justify-center mb-8 lg:hidden">
                    <img
                        src="/te-mark.svg"
                        alt="TechElevate Logo"
                        className="h-20 w-20 select-none"
                    />
                </div>

                <div className="te-card p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <p className="te-eyebrow mb-3">Management access</p>
                        <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[var(--te-text)]">
                            Welcome back, team.
                        </h1>
                        <p className="mt-2 text-sm text-[var(--te-text-dim)]">
                            Enter your username and access token.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleLogin}>
                        {error && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="block text-sm font-semibold text-[var(--te-text)] mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="te-input pl-12"
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="token" className="block text-sm font-semibold text-[var(--te-text)] mb-2">
                                Access Token
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <KeyIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                                </div>
                                <input
                                    id="token"
                                    name="token"
                                    type="password"
                                    required
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="te-input pl-12 font-mono text-sm"
                                    placeholder="Enter your access token"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="te-btn-primary te-btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                                    <span>Authenticating...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheckIcon className="h-5 w-5" />
                                    <span>Sign in</span>
                                </>
                            )}
                        </button>

                        <div className="te-panel p-4 text-xs text-[var(--te-text-dim)]">
                            <strong className="text-[var(--te-text)]">Note:</strong> Management accounts can only be created by Admins. If you need access, please contact your administrator.
                        </div>

                        <div className="pt-5 border-t border-[var(--te-border)] text-center">
                            <p className="text-xs text-[var(--te-text-dim)] mb-3">Not a lead or admin?</p>
                            <div className="flex gap-3 justify-center">
                                <button type="button" onClick={() => navigate('/login')} className="te-link text-xs font-medium">
                                    Member Login
                                </button>
                                <span className="text-[var(--te-text-dim)]">/</span>
                                <button type="button" onClick={() => navigate('/referrer-login')} className="te-link text-xs font-medium">
                                    Referrer Access
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            </main>
        </div>
    );
};

export default LeadLogin;
