import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../axiosConfig';
import {
    XCircleIcon,
    CheckCircleIcon,
    EnvelopeIcon,
    ArrowPathIcon
} from 'icons';

const EmailVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resendSuccess, setResendSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Get email from navigation state
    const email = location.state?.email || '';
    const verificationType = location.state?.verificationType || 'registration';
    const newEmail = location.state?.newEmail || '';
    const returnTo = location.state?.returnTo || '/workspace';

    useEffect(() => {
        if (!email) {
            navigate('/login');
        }
    }, [email, navigate]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleCodeChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');
        setResendSuccess('');

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`code-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            document.getElementById(`code-${index - 1}`)?.focus();
        }
        // Handle paste
        if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then(text => {
                const digits = text.replace(/\D/g, '').slice(0, 6);
                const newCode = digits.split('').concat(Array(6).fill('')).slice(0, 6);
                setCode(newCode);
                if (digits.length === 6) {
                    document.getElementById('code-5')?.focus();
                }
            });
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const verificationCode = code.join('');

        if (verificationCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');
        setResendSuccess('');

        try {
            if (verificationType === 'email_change') {
                await axiosInstance.post('/verification/verify-email-change', {
                    new_email: newEmail,
                    code: verificationCode
                });
                setSuccess('Email updated successfully!');
                setTimeout(() => navigate(returnTo), 2000);
            } else {
                await axiosInstance.post('/verification/verify-email', {
                    email: email,
                    code: verificationCode
                });
                setSuccess('Email verified successfully! You can now log in.');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (error) {
            setError(error.response?.data?.detail || 'Verification failed. Please try again.');
            setCode(['', '', '', '', '', '']);
            document.getElementById('code-0')?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError('');
        setSuccess('');
        setResendSuccess('');

        try {
            await axiosInstance.post('/verification/send-code', {
                email: email
            });
            setResendSuccess('Verification code sent! Please check your email.');
            setResendCooldown(60); // 60 second cooldown
            setCode(['', '', '', '', '', '']);
            document.getElementById('code-0')?.focus();
        } catch (error) {
            setError(error.response?.data?.detail || 'Failed to resend code. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="min-h-screen te-grid-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="relative max-w-md w-full">
                {/* Logo and header */}
                <div className="mb-8 text-center">
                    <div className="mb-4 flex justify-center">
                        <img src="/te-mark.svg" alt="TechElevate Logo" className="h-20 w-20 select-none" />
                    </div>
                    <span className="te-eyebrow justify-center">{'// verification'}</span>
                    <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--te-text)]">
                        Verify your email
                    </h2>
                    <p className="mt-3 text-[var(--te-text-dim)]">
                        Enter the 6-digit code sent to
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold text-[var(--te-text)]">
                        {verificationType === 'email_change' ? newEmail : email}
                    </p>
                </div>

                {/* Main card */}
                <div className="te-card rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] p-8 shadow-sm">
                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30 animate-fade-in">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                                <p className="ml-3 text-sm text-red-800 dark:text-red-200">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20 animate-fade-in">
                            <div className="flex">
                                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <p className="ml-3 text-sm text-green-800 dark:text-green-200">{success}</p>
                            </div>
                        </div>
                    )}

                    {resendSuccess && (
                        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20 animate-fade-in">
                            <div className="flex">
                                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <p className="ml-3 text-sm text-green-800 dark:text-green-200">{resendSuccess}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleVerify}>
                        {/* Code input */}
                        <div className="mb-8">
                            <label className="mb-4 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                Enter Verification Code
                            </label>
                            <div className="flex justify-center gap-2">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`code-${index}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="h-14 w-12 rounded-xl border border-[var(--te-border)] bg-[var(--te-surface)] text-center font-mono text-2xl font-bold text-[var(--te-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--te-ring)]"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                            <p className="mt-3 text-xs text-[var(--te-text-dim)]">
                                Code expires in 15 minutes
                            </p>
                        </div>

                        {/* Verify button */}
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="te-btn-primary te-btn-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Verifying…</span>
                                </div>
                            ) : (
                                <>
                                    <span>Verify email</span>
                                    <CheckCircleIcon className="h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Resend code */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-[var(--te-text-dim)] mb-2">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={resendLoading || resendCooldown > 0 || success}
                            className="te-link inline-flex items-center gap-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <ArrowPathIcon className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
                            {resendCooldown > 0 ? (
                                <span>Resend code in {resendCooldown}s</span>
                            ) : (
                                <span>Resend code</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Back to login */}
                {verificationType !== 'email_change' && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="te-link inline-flex items-center gap-2 text-sm"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailVerification;
