import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon, KeyIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

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
            const response = await axiosInstance.post('/auth/lead-login', {
                username,
                token
            });

            if (response.data.access_token) {
                // Store auth data
                login(
                    response.data.access_token,
                    response.data.user.id,
                    response.data.user.role
                );

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Back to Member Login */}
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-sm font-medium text-blue-200 hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Member Login
                </button>

                {/* Header */}
                <div className="text-center">
                    <div className="flex justify-center">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl">
                            <ShieldCheckIcon className="h-12 w-12 text-white" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-white">
                        Management Login
                    </h2>
                    <p className="mt-2 text-sm text-blue-200">
                        Enter your username and access token
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

                        {/* Username Field */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-blue-100 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-blue-300" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        {/* Token Field */}
                        <div>
                            <label htmlFor="token" className="block text-sm font-medium text-blue-100 mb-2">
                                Access Token
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyIcon className="h-5 w-5 text-blue-300" />
                                </div>
                                <input
                                    id="token"
                                    name="token"
                                    type="password"
                                    required
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-lg bg-white/5 text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                    placeholder="Enter your access token"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheckIcon className="h-5 w-5 mr-2" />
                                        Sign In
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="mt-6 bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                            <p className="text-xs text-blue-100">
                                <strong>Note:</strong> Management accounts can only be created by Admins. If you need access, please contact your administrator.
                            </p>
                        </div>

                        {/* Alternative Login Links */}
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <p className="text-center text-xs text-blue-200 mb-3">
                                Not a lead or admin?
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="text-xs font-medium text-blue-200 hover:text-white transition-colors underline"
                                >
                                    Member Login
                                </button>
                                <span className="text-blue-300">•</span>
                                <button
                                    type="button"
                                    onClick={() => navigate('/referrer-login')}
                                    className="text-xs font-medium text-blue-200 hover:text-white transition-colors underline"
                                >
                                    Referrer Access
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LeadLogin;
