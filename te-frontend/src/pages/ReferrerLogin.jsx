import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingOfficeIcon, KeyIcon, ArrowLeftIcon } from 'icons';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import AuthAside from '../components/_custom/AuthAside';

const ReferrerLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('/auth/referrer-login', {
                token
            });

            if (response.data.access_token) {
                // Store auth data
                login(
                    response.data.access_token,
                    response.data.user.id,
                    response.data.user.role
                );

                // Store company info for later use
                if (response.data.user.company_name) {
                    sessionStorage.setItem('companyName', response.data.user.company_name);
                }

                // Check if there's a redirect URL from session expiry
                const redirectPath = sessionStorage.getItem('redirectAfterLogin');
                if (redirectPath && redirectPath !== '/referrer-login') {
                    sessionStorage.removeItem('redirectAfterLogin');
                    navigate(redirectPath);
                } else {
                    // Navigate to workspace
                    navigate('/workspace');
                }
            }
        } catch (err) {
            console.error('Referrer login error:', err);
            setError(err.response?.data?.detail || 'Invalid access token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--te-bg)] lg:grid lg:grid-cols-[0.88fr_1.12fr]">
            <AuthAside
                eyebrow="Referrer access"
                title="A warm introduction can change a career."
                description="Review referral requests and help strong candidates reach the teams where they can thrive."
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
                        <p className="te-eyebrow mb-3">Referrer portal</p>
                        <h1 className="text-3xl font-extrabold tracking-[-0.045em] text-[var(--te-text)]">
                            Open the right door.
                        </h1>
                        <p className="mt-2 text-sm text-[var(--te-text-dim)]">
                            Enter your secure access token to continue.
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleLogin}>
                        {error && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
                                {error}
                            </div>
                        )}

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
                                    autoComplete="off"
                                    className="te-input pl-12 font-mono text-sm"
                                    placeholder="Enter your secure token"
                                />
                            </div>
                            <p className="mt-2 text-xs text-[var(--te-text-dim)]">
                                This token was provided to you by your administrator.
                            </p>
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
                                    <BuildingOfficeIcon className="h-5 w-5" />
                                    <span>Access Referrals Portal</span>
                                </>
                            )}
                        </button>

                        <div className="te-panel p-4 text-xs text-[var(--te-text-dim)]">
                            <p className="font-semibold text-[var(--te-text)] mb-2">For Company Referrers:</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>No username required - just use your token</li>
                                <li>Access is limited to your company&apos;s referral requests</li>
                                <li>Contact an admin if you&apos;ve lost your token</li>
                            </ul>
                        </div>

                        <div className="pt-5 border-t border-[var(--te-border)] text-center">
                            <p className="text-xs text-[var(--te-text-dim)] mb-3">Not a referrer?</p>
                            <div className="flex gap-3 justify-center">
                                <button type="button" onClick={() => navigate('/login')} className="te-link text-xs font-medium">
                                    Member Login
                                </button>
                                <span className="text-[var(--te-text-dim)]">/</span>
                                <button type="button" onClick={() => navigate('/lead-login')} className="te-link text-xs font-medium">
                                    Management Login
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-[var(--te-text-dim)]">
                    Your access token is encrypted and secure.
                </p>
            </div>
            </main>
        </div>
    );
};

export default ReferrerLogin;
