import axiosInstance from '../../axiosConfig';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    XCircleIcon,
    EnvelopeIcon,
    LockClosedIcon,
    ArrowRightIcon,
    SunIcon,
    MoonIcon
} from '@heroicons/react/24/outline';
import { useDarkMode } from '../../context/DarkModeContext';

const Login = () => {
    const { login } = useAuth();
    const { darkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginData, setLoginData] = useState({ username: "", password: "" });
    const [oauthLoading, setOauthLoading] = useState(false);

    // Check for OAuth errors in URL
    useEffect(() => {
        const oauthError = searchParams.get('error');
        if (oauthError === 'oauth_failed') {
            setError('Google authentication failed. Please try again or use email/password login.');
        }
    }, [searchParams]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('auth/login', {
                username: loginData.username,
                password: loginData.password
            });
            login(response.data.access_token, response.data.sub, response.data.role);

            // Check if there's a redirect URL from session expiry
            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
            if (redirectPath && redirectPath !== '/login') {
                sessionStorage.removeItem('redirectAfterLogin');
                navigate(redirectPath);
            } else {
                navigate(sessionStorage.getItem("prevPage") || "/workspace");
            }
        } catch (error) {
            const errorDetail = error.response?.data?.detail || 'Login failed. Please check your credentials.';

            // Check if it's an email verification error
            if (error.response?.status === 403 && errorDetail.includes('verify your email')) {
                setError(
                    <div>
                        {errorDetail}{' '}
                        <button
                            onClick={() => navigate('/verify-email', {
                                state: {
                                    email: loginData.username,
                                    verificationType: 'registration'
                                }
                            })}
                            className="font-semibold text-red-900 dark:text-red-100 underline hover:text-red-700 dark:hover:text-red-300"
                        >
                            Verify now
                        </button>
                    </div>
                );
            } else {
                setError(errorDetail);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOAuthLogin = (provider) => {
        if (provider === 'Google') {
            setError('');
            setOauthLoading(true);
            // Save current path or intended destination before OAuth
            const intendedPath = sessionStorage.getItem('redirectAfterLogin') ||
                sessionStorage.getItem('prevPage') ||
                '/workspace';
            sessionStorage.setItem('oauthRedirectPath', intendedPath);

            // Redirect to backend Google OAuth endpoint
            const backendUrl = axiosInstance.defaults.baseURL;
            const cleanUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
            // Allow a frame to paint the loading state
            setTimeout(() => {
                window.location.href = `${cleanUrl}/auth/google/login`;
            }, 150);
        } else {
            setError(`${provider} authentication will be implemented soon!`);
        }
    };

    const handleInputChange = ({ name, value }) => {
        setLoginData({ ...loginData, [name]: value });
    };

    // Compact single Google button (others hidden until implemented)
    const GoogleIcon = (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/20 dark:bg-cyan-500/30 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-md w-full">
                {/* Logo + Dark Mode Toggle */}
                <div className="flex items-center justify-center mb-8 relative">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl select-none">
                        <span className="text-white font-bold text-3xl tracking-wide">TE</span>
                    </div>
                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        className="absolute right-0 top-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/70 dark:bg-gray-700/70 backdrop-blur-md border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all hover:scale-105 group"
                    >
                        {darkMode ? (
                            <SunIcon className="h-4 w-4 text-amber-500 group-hover:rotate-12 transition-transform" />
                        ) : (
                            <MoonIcon className="h-4 w-4 text-indigo-500 group-hover:-rotate-12 transition-transform" />
                        )}
                        <span className="text-gray-600 dark:text-gray-300 hidden sm:inline">
                            {darkMode ? 'Light' : 'Dark'}
                        </span>
                    </button>
                </div>

                {/* Main card */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
                    {/* Error message */}
                    {error && (
                        <div className="mb-6 rounded-2xl bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800 animate-fade-in">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-red-400 dark:text-red-500 flex-shrink-0" />
                                <p className="ml-3 text-sm text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Compact Google OAuth button */}
                    <div className="mb-6">
                        <button
                            type="button"
                            onClick={() => !oauthLoading && handleOAuthLogin('Google')}
                            aria-label="Sign in with Google"
                            className="group relative w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 backdrop-blur-md text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                            disabled={oauthLoading}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-white dark:bg-gray-800 shadow-inner ring-1 ring-gray-200 dark:ring-gray-600 group-hover:scale-105 transition-transform">
                                    {oauthLoading ? (
                                        <svg className="h-5 w-5 animate-spin text-gray-500" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    ) : (
                                        GoogleIcon
                                    )}
                                </div>
                                <span className="font-semibold tracking-wide">
                                    {oauthLoading ? 'Connecting…' : 'Continue with Google'}
                                </span>
                            </div>
                            <span className="absolute inset-0 rounded-xl ring-1 ring-transparent group-hover:ring-blue-400/50 transition-colors"></span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">Or continue with email</span>
                        </div>
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Email address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={loginData.username}
                                    autoComplete="email"
                                    required
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="you@example.com"
                                    onChange={(e) => handleInputChange({ name: "username", value: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <button
                                    type="button"
                                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={loginData.password}
                                    autoComplete="current-password"
                                    required
                                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    placeholder="••••••••"
                                    onChange={(e) => handleInputChange({ name: "password", value: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign up link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <button
                                onClick={() => navigate('/register')}
                                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                            >
                                Create one now
                            </button>
                        </p>
                    </div>

                    {/* Lead/Admin Login Link */}
                    <div className="mt-4 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Other Login Options</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-6">
                            <button
                                onClick={() => navigate('/lead-login')}
                                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                            >
                                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Management Login
                            </button>
                            <button
                                onClick={() => navigate('/referrer-login')}
                                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
                            >
                                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Company Referrer Access
                            </button>
                        </div>
                    </div>
                </div>

                {/* Back to home */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;

