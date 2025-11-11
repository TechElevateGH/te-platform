import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingOfficeIcon, KeyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

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
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Back to Member Login */}
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Member Login
                </button>

                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-xl">
                            <BuildingOfficeIcon className="h-12 w-12 text-white" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-white">
                        Company Referrer Access
                    </h2>
                    <p className="mt-2 text-sm text-emerald-200">
                        Enter your secure access token to continue
                    </p>
                </div>

                {/* Login Form */}
                <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Token Field */}
                        <div>
                            <label htmlFor="token" className="block text-sm font-medium text-emerald-100 mb-2">
                                Access Token
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyIcon className="h-5 w-5 text-emerald-300" />
                                </div>
                                <input
                                    id="token"
                                    name="token"
                                    type="password"
                                    required
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    autoComplete="off"
                                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
                                    placeholder="Enter your secure token"
                                />
                            </div>
                            <p className="mt-2 text-xs text-emerald-200">
                                This token was provided to you by your administrator
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                                        Access Referrals Portal
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="mt-6 bg-emerald-500/20 border border-emerald-400/30 rounded-lg p-4">
                            <p className="text-xs text-emerald-100 mb-2">
                                <strong>For Company Referrers:</strong>
                            </p>
                            <ul className="text-xs text-emerald-100 space-y-1 list-disc list-inside">
                                <li>No username required - just use your token</li>
                                <li>Access is limited to your company's referral requests</li>
                                <li>Contact an admin if you've lost your token</li>
                            </ul>
                        </div>

                        {/* Alternative Login Links */}
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <p className="text-center text-xs text-emerald-200 mb-3">
                                Not a referrer?
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-xs font-medium text-emerald-200 hover:text-white transition-colors underline"
                                >
                                    Member Login
                                </button>
                                <span className="text-emerald-300">•</span>
                                <button
                                    type="button"
                                    onClick={() => navigate('/lead-login')}
                                    className="text-xs font-medium text-emerald-200 hover:text-white transition-colors underline"
                                >
                                    Management Login
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Security Note */}
                <div className="text-center">
                    <p className="text-xs text-emerald-300">
                        🔒 Your access token is encrypted and secure
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReferrerLogin;
