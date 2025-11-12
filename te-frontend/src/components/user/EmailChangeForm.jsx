import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../axiosConfig';
import {
    XCircleIcon,
    CheckCircleIcon,
    EnvelopeIcon,
    LockClosedIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const EmailChangeForm = ({ currentEmail, onCancel }) => {
    const navigate = useNavigate();
    const [newEmail, setNewEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!newEmail || !password) {
            setError('Please fill in all fields');
            return;
        }

        if (newEmail === currentEmail) {
            setError('New email must be different from current email');
            return;
        }

        setLoading(true);

        try {
            await axiosInstance.post('/verification/request-email-change', {
                new_email: newEmail,
                password: password
            });

            // Navigate to verification page
            navigate('/verify-email', {
                state: {
                    email: currentEmail,
                    newEmail: newEmail,
                    verificationType: 'email_change'
                }
            });
        } catch (error) {
            setError(error.response?.data?.detail || 'Failed to request email change. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Email Address</h3>

            {/* Warning */}
            <div className="mb-6 rounded-xl bg-amber-50 p-4 border border-amber-200">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
                    <div className="ml-3">
                        <p className="text-sm text-amber-800">
                            You will need to verify your new email address before the change takes effect.
                            A verification code will be sent to your new email.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200">
                    <div className="flex">
                        <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                        <p className="ml-3 text-sm text-red-800">{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current email (read-only) */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Current Email
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            value={currentEmail}
                            disabled
                            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* New email */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        New Email Address *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="new@example.com"
                        />
                    </div>
                </div>

                {/* Password confirmation */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Enter your password"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Enter your password to confirm this change
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Sending...</span>
                            </div>
                        ) : (
                            <>
                                <span>Request Change</span>
                                <CheckCircleIcon className="h-5 w-5" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmailChangeForm;
