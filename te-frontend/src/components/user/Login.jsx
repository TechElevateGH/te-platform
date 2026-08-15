import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    ArrowRightIcon,
    EnvelopeIcon,
    LockClosedIcon,
    MoonIcon,
    SunIcon,
    XCircleIcon,
} from 'icons';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import AuthAside from '../_custom/AuthAside';

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const Login = () => {
    const { login, loginAsGuest } = useAuth();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(false);
    const [loginData, setLoginData] = useState({ username: '', password: '' });

    useEffect(() => {
        if (searchParams.get('error') === 'oauth_failed') {
            setError('Google authentication failed. Try again or use your email and password.');
        }
    }, [searchParams]);

    const handleLogin = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('auth/login', loginData);
            login(response.data.access_token, response.data.sub, response.data.role);

            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
            if (redirectPath && redirectPath !== '/login') {
                sessionStorage.removeItem('redirectAfterLogin');
                navigate(redirectPath);
            } else {
                navigate(sessionStorage.getItem('prevPage') || '/workspace');
            }
        } catch (requestError) {
            const detail = requestError.response?.data?.detail || 'Sign in failed. Check your details and try again.';
            if (requestError.response?.status === 403 && detail.includes('verify your email')) {
                setError(
                    <span>
                        {detail}{' '}
                        <button
                            onClick={() => navigate('/verify-email', {
                                state: { email: loginData.username, verificationType: 'registration' },
                            })}
                            className="font-extrabold underline"
                        >
                            Verify now
                        </button>
                    </span>
                );
            } else {
                setError(detail);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = () => {
        setError('');
        setOauthLoading(true);
        const intendedPath = sessionStorage.getItem('redirectAfterLogin')
            || sessionStorage.getItem('prevPage')
            || '/workspace';
        sessionStorage.setItem('oauthRedirectPath', intendedPath);

        const backendUrl = axiosInstance.defaults.baseURL;
        const cleanUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
        setTimeout(() => {
            window.location.href = `${cleanUrl}/auth/google/login`;
        }, 150);
    };

    const handleGuestLogin = () => {
        loginAsGuest();
        setTimeout(() => navigate('/workspace', { replace: true }), 100);
    };

    return (
        <div className="min-h-screen bg-[var(--te-bg)] lg:grid lg:grid-cols-[0.88fr_1.12fr]">
            <AuthAside
                eyebrow="Welcome back"
                title="Your next move is already taking shape."
                description="Return to your applications, learning plan, referrals, and the community helping you move with confidence."
            />

            <main className="relative flex min-h-screen items-center justify-center px-5 py-12 sm:px-10 lg:px-14">
                <button
                    type="button"
                    onClick={toggleDarkMode}
                    className="te-icon-btn absolute right-5 top-5 sm:right-8 sm:top-7"
                    aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                </button>

                <div className="w-full max-w-[460px]">
                    <button onClick={() => navigate('/')} className="mb-10 flex items-center gap-2.5 lg:hidden">
                        <img src="/te-mark.svg" alt="" className="h-10 w-10 rounded-xl" />
                        <span className="te-wordmark text-base">TechElevate</span>
                    </button>

                    <span className="te-eyebrow">Member sign in</span>
                    <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.055em] text-[var(--te-text)] sm:text-5xl">
                        Welcome back.
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-[var(--te-text-dim)]">
                        Sign in to keep building momentum.
                    </p>

                    {error && (
                        <div className="mt-7 flex items-start gap-3 rounded-2xl border border-[var(--te-red)]/20 bg-[var(--te-red-soft)] p-4 text-sm leading-6 text-[var(--te-red)] animate-fade-in">
                            <XCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                            <div>{error}</div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleOAuthLogin}
                        disabled={oauthLoading}
                        className="te-btn-secondary mt-8 w-full py-3 disabled:opacity-60"
                    >
                        {oauthLoading ? (
                            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--te-border-strong)] border-t-[var(--te-accent)]" />
                        ) : (
                            <GoogleIcon />
                        )}
                        {oauthLoading ? 'Connecting to Google…' : 'Continue with Google'}
                    </button>

                    <div className="my-7 flex items-center gap-4">
                        <span className="h-px flex-1 bg-[var(--te-border)]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">or use email</span>
                        <span className="h-px flex-1 bg-[var(--te-border)]" />
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="mb-2 block text-sm font-bold text-[var(--te-text)]">Email address</label>
                            <div className="relative">
                                <EnvelopeIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--te-text-dim)]" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={loginData.username}
                                    autoComplete="email"
                                    required
                                    className="te-input pl-11"
                                    placeholder="you@example.com"
                                    onChange={(event) => setLoginData((current) => ({ ...current, username: event.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-2 block text-sm font-bold text-[var(--te-text)]">Password</label>
                            <div className="relative">
                                <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--te-text-dim)]" />
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={loginData.password}
                                    autoComplete="current-password"
                                    required
                                    className="te-input pl-11"
                                    placeholder="Enter your password"
                                    onChange={(event) => setLoginData((current) => ({ ...current, password: event.target.value }))}
                                />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="te-btn-primary te-btn-lg group w-full">
                            {loading ? (
                                <>
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-7 flex flex-col gap-3 rounded-2xl bg-[var(--te-surface-alt)] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-extrabold text-[var(--te-text)]">Want a quick look first?</p>
                            <p className="mt-0.5 text-[11px] text-[var(--te-text-dim)]">Preview learning and practice without an account.</p>
                        </div>
                        <button type="button" onClick={handleGuestLogin} className="te-btn-secondary te-btn-sm flex-shrink-0">
                            Try guest mode
                        </button>
                    </div>

                    <p className="mt-7 text-center text-sm text-[var(--te-text-dim)]">
                        New to TechElevate?{' '}
                        <button onClick={() => navigate('/register')} className="te-link font-extrabold">Create an account</button>
                    </p>

                    <div className="mt-8 flex items-center justify-center gap-4 border-t border-[var(--te-border)] pt-6 text-xs font-semibold text-[var(--te-text-dim)]">
                        <button onClick={() => navigate('/referrer-login')} className="hover:text-[var(--te-text)]">Referrer access</button>
                        <span className="h-1 w-1 rounded-full bg-[var(--te-border-strong)]" />
                        <button onClick={() => navigate('/lead-login')} className="hover:text-[var(--te-text)]">Management access</button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Login;
