import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../axiosConfig';
import {
    XCircleIcon,
    CheckCircleIcon,
    EnvelopeIcon,
    LockClosedIcon,
    ExclamationTriangleIcon
} from 'icons';

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
        <div className="te-panel p-6">
            <span className="te-eyebrow">Email</span>
            <h3 className="mb-4 mt-3 font-display text-xl font-bold tracking-tight text-[var(--te-text)]">Change Email Address</h3>

            {/* Warning */}
            <div className="mb-6 rounded-xl border border-[var(--te-gold)] bg-[var(--te-gold-soft)] p-4">
                <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-te-gold flex-shrink-0" />
                    <div className="ml-3">
                        <p className="text-sm text-[var(--te-text)]">
                            You will need to verify your new email address before the change takes effect.
                            A verification code will be sent to your new email.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
                    <div className="flex">
                        <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                        <p className="ml-3 text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current email (read-only) */}
                <div>
                    <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                        Current Email
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                        </div>
                        <input
                            type="email"
                            value={currentEmail}
                            disabled
                            className="te-input pl-12 bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* New email */}
                <div>
                    <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                        New Email Address *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                        </div>
                        <input
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="te-input pl-12"
                            placeholder="new@example.com"
                        />
                    </div>
                </div>

                {/* Password confirmation */}
                <div>
                    <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                        Confirm Password *
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="te-input pl-12"
                            placeholder="Enter your password"
                        />
                    </div>
                    <p className="mt-1 text-xs text-[var(--te-text-dim)]">
                        Enter your password to confirm this change
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="te-btn-secondary flex-1"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="te-btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Sending…</span>
                            </div>
                        ) : (
                            <>
                                <span>Request change</span>
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
