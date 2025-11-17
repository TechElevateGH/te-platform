import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import axiosInstance from '../../axiosConfig';
import SlackInviteModal from '../_custom/SlackInviteModal';

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [hasProcessed, setHasProcessed] = useState(false);
    const [showSlackModal, setShowSlackModal] = useState(false);
    const [userId, setUserId] = useState(null);

    console.log('OAuthCallback component loaded!');
    console.log('Current URL:', window.location.href);

    useEffect(() => {
        if (hasProcessed) return; // Prevent double processing

        const handleOAuthCallback = () => {
            setHasProcessed(true);

            console.log('=== OAuth Callback Handler Started ===');
            console.log('Current URL:', window.location.href);
            console.log('Current pathname:', window.location.pathname);

            // Get parameters from URL
            const token = searchParams.get('token');
            const userId = searchParams.get('user_id');
            const role = searchParams.get('role');
            const error = searchParams.get('error');
            const stateParam = searchParams.get('state');

            console.log('OAuth Callback - URL params:', {
                token: token ? 'present' : 'missing',
                userId: userId ? 'present' : 'missing',
                role: role ? 'present' : 'missing',
                error: error
            });

            // Mark that OAuth is in progress
            sessionStorage.setItem('oauthInProgress', 'true');

            if (error) {
                console.error('OAuth error from backend:', error);
                setStatus('error');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
                return;
            }

            // Optional: warn if state not returned (should be, but we only hard-fail on mismatch at backend)
            if (!stateParam) {
                console.warn('No state parameter present in callback URL. Backend performed verification, proceeding.');
            }

            if (token && userId && role) {
                console.log('Valid OAuth params received');
                console.log('Token:', token.substring(0, 20) + '...');
                console.log('User ID:', userId);
                console.log('Role:', role);

                // IMPORTANT: Save to localStorage IMMEDIATELY and SYNCHRONOUSLY
                console.log('Saving credentials to localStorage...');
                localStorage.setItem('accessToken', token);
                localStorage.setItem('userId', userId);
                localStorage.setItem('userRole', role);

                // Set privileged user flag for proper redirect after session expiry
                const isPrivileged = parseInt(role) >= 2;
                localStorage.setItem('wasPrivilegedUser', isPrivileged.toString());

                // Clear any stale redirect paths that might cause premature navigation
                localStorage.removeItem('oauthRedirectPath');
                localStorage.removeItem('redirectAfterLogin');
                localStorage.removeItem('prevPage');
                localStorage.removeItem('sessionExpired');

                // Mark OAuth as complete
                sessionStorage.removeItem('oauthInProgress');
                localStorage.setItem('lastSuccessfulLogin', Date.now().toString());

                // Verify it was saved
                const savedToken = localStorage.getItem('accessToken');
                console.log('Verification - Token in localStorage:', savedToken ? 'YES (' + savedToken.substring(0, 20) + '...)' : 'NO');

                setStatus('success');
                console.log('OAuth Login successful!');

                // Check if user is a Member (role 1) and hasn't joined Slack
                if (parseInt(role) === 1) {
                    // Fetch user profile to check slack_joined status
                    axiosInstance.get(`/users/${userId}`)
                        .then(response => {
                            const userData = response.data.user;
                            console.log('User slack_joined status:', userData.slack_joined);

                            if (!userData.slack_joined) {
                                // Show Slack modal for new members
                                console.log('Showing Slack invite modal for new member');
                                setUserId(userId);
                                setShowSlackModal(true);
                            } else {
                                // Redirect to workspace immediately
                                console.log('User already joined Slack, redirecting to workspace');
                                setTimeout(() => {
                                    window.location.replace('/workspace');
                                }, 300);
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching user data:', error);
                            // On error, just redirect to workspace
                            setTimeout(() => {
                                window.location.replace('/workspace');
                            }, 300);
                        });
                } else {
                    // For non-members, redirect directly to workspace
                    setTimeout(() => {
                        console.log('=== REDIRECTING NOW ===');
                        console.log('Final localStorage check - accessToken:', localStorage.getItem('accessToken') ? 'present' : 'MISSING');
                        window.location.replace('/workspace');
                    }, 300);
                }
            } else {
                console.error('Missing required OAuth parameters');
                console.error('Received - token:', !!token, 'userId:', !!userId, 'role:', !!role);
                setStatus('error');
                setTimeout(() => {
                    navigate('/login?error=oauth_missing_params');
                }, 3000);
            }
        };

        handleOAuthCallback();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]); // Only depend on searchParams to prevent re-runs

    const handleSlackJoin = async () => {
        // Update user's slack_joined status
        if (userId) {
            try {
                await axiosInstance.patch(`/users/${userId}`, {
                    slack_joined: true
                });
                console.log('Updated slack_joined status to true');
            } catch (error) {
                console.error('Error updating slack_joined status:', error);
            }
        }
        // Redirect to workspace after modal closes
        setTimeout(() => {
            window.location.replace('/workspace');
        }, 200);
    };

    const handleSlackSkip = () => {
        // Just close modal and redirect (don't update slack_joined)
        setShowSlackModal(false);
        setTimeout(() => {
            window.location.replace('/workspace');
        }, 200);
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 flex items-center justify-center py-12 px-4 transition-colors">
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 dark:bg-blue-500/30 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/20 dark:bg-cyan-500/30 rounded-full blur-3xl"></div>
                </div>

                <div className="relative max-w-md w-full">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
                        <div className="text-center">
                            {status === 'processing' && (
                                <>
                                    <div className="flex justify-center mb-4">
                                        <ArrowPathIcon className="h-16 w-16 text-blue-600 dark:text-blue-400 animate-spin" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        Completing Sign In
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Please wait while we verify your account...
                                    </p>
                                </>
                            )}

                            {status === 'success' && (
                                <>
                                    <div className="flex justify-center mb-4">
                                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        Success!
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Redirecting to your workspace...
                                    </p>
                                </>
                            )}

                            {status === 'error' && (
                                <>
                                    <div className="flex justify-center mb-4">
                                        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                            <XCircleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                        Authentication Failed
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Redirecting to login page...
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Slack Invite Modal */}
            <SlackInviteModal
                isOpen={showSlackModal}
                onClose={handleSlackSkip}
                onJoin={handleSlackJoin}
            />
        </>
    );
};

export default OAuthCallback;
