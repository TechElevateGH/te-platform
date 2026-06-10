import { useState, useEffect } from 'react'
import {
    EnvelopeIcon,
    PhoneIcon,
    AcademicCapIcon,
    MapPinIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    ShieldCheckIcon,
    XCircleIcon,
    ArrowPathIcon,
    LockClosedIcon
} from 'icons'
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../axiosConfig';
import EditPrivilegedAccount from './EditPrivilegedAccount';
import { getUserEndpoint } from '../../utils/userEndpoints';

const Profile = () => {
    const { userInfo, setUserInfo } = useData();
    const { userId, accessToken, userRole } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
    const [errors, setErrors] = useState({});
    const [showEditPrivileged, setShowEditPrivileged] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [pendingEmailChange, setPendingEmailChange] = useState(null);
    const [storedPassword, setStoredPassword] = useState(''); // Store password for resend
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [verificationError, setVerificationError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    const [resetStep, setResetStep] = useState('request');
    const [resetEmail, setResetEmail] = useState('');
    const [resetCode, setResetCode] = useState(['', '', '', '', '', '']);
    const [resetRequestToken, setResetRequestToken] = useState('');
    const [resetSessionToken, setResetSessionToken] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');
    const [resetConfirmPassword, setResetConfirmPassword] = useState('');
    const [resetStatus, setResetStatus] = useState({ type: null, message: '' });
    const [resetLoading, setResetLoading] = useState(false);
    const [resetResendCooldown, setResetResendCooldown] = useState(0);

    // Check user role (Admin=5, Lead=4, Volunteer=3, Referrer=2, Member=1)
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const isAdmin = userRoleInt === 5;
    const isPrivilegedUser = userRoleInt >= 2; // Referrer, Volunteer, Lead, or Admin
    const passwordResetSteps = [
        { id: 'request', label: 'Request Code' },
        { id: 'verify', label: 'Verify code' },
        { id: 'complete', label: 'Set Password' },
    ];
    const normalizedResetStep = resetStep === 'done' ? 'complete' : resetStep;
    const activeResetStepIndex = Math.max(
        0,
        passwordResetSteps.findIndex((step) => step.id === normalizedResetStep)
    );

    const [editedInfo, setEditedInfo] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        university: '',
        date_of_birth: '',
        address: '',
        image: ''
    });

    // Initialize editedInfo when userInfo changes
    useEffect(() => {
        if (userInfo) {
            setEditedInfo({
                full_name: userInfo.full_name || '',
                email: userInfo.email || '',
                phone_number: userInfo.phone_number || '',
                university: userInfo.university || '',
                date_of_birth: userInfo.date_of_birth || '',
                address: userInfo.address || '',
                image: userInfo.image || ''
            });
            setResetEmail(userInfo.email || '');
        }
    }, [userInfo]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    useEffect(() => {
        if (resetResendCooldown > 0) {
            const timer = setTimeout(() => setResetResendCooldown(resetResendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resetResendCooldown]);

    const validateForm = () => {
        const newErrors = {};

        if (!editedInfo.full_name.trim()) {
            newErrors.full_name = 'Full name is required';
        }

        if (!editedInfo.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedInfo.email)) {
            newErrors.email = 'Invalid email format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEdit = () => {
        setIsEditing(true);
        setNotification(null);
        setErrors({});
    };

    const handleSave = async () => {
        if (!validateForm()) {
            setNotification({
                type: 'error',
                message: 'Please fix the errors before saving'
            });
            return;
        }

        setIsSaving(true);
        setNotification(null);

        try {
            // Check if email has changed
            const emailChanged = editedInfo.email !== userInfo.email;

            if (emailChanged) {
                // Store the new email and show password confirmation modal
                setPendingEmailChange(editedInfo.email);
                setShowPasswordModal(true);
                setIsSaving(false);
                return; // Wait for password confirmation
            } else {
                // Normal profile update (no email change)
                const updateData = { ...editedInfo };
                delete updateData.email; // Remove email from update

                const endpoint = getUserEndpoint(userRole, userId);
                const response = await axiosInstance.patch(
                    endpoint,
                    updateData,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                // Update the context with the new user info
                setUserInfo(response.data.user);

                setIsEditing(false);
                setNotification({
                    type: 'success',
                    message: 'Profile updated successfully!'
                });

                // Auto-hide success notification after 3 seconds
                setTimeout(() => setNotification(null), 3000);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMessage = typeof error.response?.data?.detail === 'string'
                ? error.response.data.detail
                : 'Failed to update profile. Please try again.';
            setNotification({
                type: 'error',
                message: errorMessage
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset to original values
        if (userInfo) {
            setEditedInfo({
                full_name: userInfo.full_name || '',
                email: userInfo.email || '',
                phone_number: userInfo.phone_number || '',
                university: userInfo.university || '',
                date_of_birth: userInfo.date_of_birth || '',
                address: userInfo.address || '',
                image: userInfo.image || ''
            });
        }
        setIsEditing(false);
        setErrors({});
        setNotification(null);
    };

    const handleChange = (field, value) => {
        setEditedInfo(prev => ({
            ...prev,
            [field]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handlePasswordConfirm = async () => {
        if (!password) {
            setPasswordError('Password is required');
            return;
        }

        setPasswordError('');
        setIsSaving(true);

        try {
            // Request email change with password
            await axiosInstance.post('/verification/request-email-change', {
                new_email: pendingEmailChange,
                password: password
            });

            // Close password modal and open verification modal
            setShowPasswordModal(false);
            setStoredPassword(password); // Store password for potential resend
            setPassword('');
            setShowVerificationModal(true);
            setResendCooldown(60); // Start 60 second cooldown
        } catch (error) {
            console.error('Error requesting email change:', error);
            const errorMessage = typeof error.response?.data?.detail === 'string'
                ? error.response.data.detail
                : 'Failed to request email change. Please try again.';
            setPasswordError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordModalClose = () => {
        setShowPasswordModal(false);
        setPassword('');
        setPasswordError('');
        setPendingEmailChange(null);
        // Reset email to original value
        setEditedInfo(prev => ({
            ...prev,
            email: userInfo.email
        }));
    };

    const handleVerificationCodeChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);
        setVerificationError('');

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`verify-code-${index + 1}`)?.focus();
        }
    };

    const handleVerificationKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            document.getElementById(`verify-code-${index - 1}`)?.focus();
        }
        // Handle paste
        if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then(text => {
                const digits = text.replace(/\D/g, '').slice(0, 6);
                const newCode = digits.split('').concat(Array(6).fill('')).slice(0, 6);
                setVerificationCode(newCode);
                if (digits.length === 6) {
                    document.getElementById('verify-code-5')?.focus();
                }
            });
        }
    };

    const handleVerifyEmail = async () => {
        const code = verificationCode.join('');

        if (code.length !== 6) {
            setVerificationError('Please enter all 6 digits');
            return;
        }

        setIsVerifying(true);
        setVerificationError('');

        try {
            await axiosInstance.post('/verification/verify-email-change', {
                new_email: pendingEmailChange,
                code: code
            });

            // Success - update user info and close modal
            setUserInfo(prev => ({ ...prev, email: pendingEmailChange }));
            setShowVerificationModal(false);
            setVerificationCode(['', '', '', '', '', '']);
            setPendingEmailChange(null);

            setNotification({
                type: 'success',
                message: 'Email updated successfully!'
            });
            setTimeout(() => setNotification(null), 3000);
        } catch (error) {
            console.error('Error verifying email change:', error);
            const errorMessage = typeof error.response?.data?.detail === 'string'
                ? error.response.data.detail
                : 'Verification failed. Please try again.';
            setVerificationError(errorMessage);
            setVerificationCode(['', '', '', '', '', '']);
            document.getElementById('verify-code-0')?.focus();
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendVerificationCode = async () => {
        setIsVerifying(true);
        setVerificationError('');

        try {
            await axiosInstance.post('/verification/request-email-change', {
                new_email: pendingEmailChange,
                password: storedPassword
            });

            setNotification({
                type: 'success',
                message: 'Verification code sent! Please check your email.'
            });
            setTimeout(() => setNotification(null), 3000);
            setResendCooldown(60);
            setVerificationCode(['', '', '', '', '', '']);
            document.getElementById('verify-code-0')?.focus();
        } catch (error) {
            const errorMessage = typeof error.response?.data?.detail === 'string'
                ? error.response.data.detail
                : 'Failed to resend code. Please try again.';
            setVerificationError(errorMessage);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerificationModalClose = () => {
        setShowVerificationModal(false);
        setVerificationCode(['', '', '', '', '', '']);
        setVerificationError('');
        setPendingEmailChange(null);
        setStoredPassword(''); // Clear stored password
        setResendCooldown(0);
        // Reset email to original value
        setEditedInfo(prev => ({
            ...prev,
            email: userInfo.email
        }));
    };

    const openPasswordResetModal = () => {
        console.log('🔓 Opening password reset modal...', { userInfo, email: userInfo?.email });
        setShowPasswordResetModal(true);
        setResetStep('request');
        setResetCode(['', '', '', '', '', '']);
        setResetRequestToken('');
        setResetSessionToken('');
        setResetNewPassword('');
        setResetConfirmPassword('');
        setResetStatus({ type: null, message: '' });
        setResetResendCooldown(0);
        setResetEmail(userInfo?.email || '');
        console.log('✅ Password reset modal state updated');
    };

    const closePasswordResetModal = () => {
        setShowPasswordResetModal(false);
        setResetStatus({ type: null, message: '' });
    };

    const extractErrorMessage = (error, fallback) => {
        if (typeof error?.response?.data?.detail === 'string') {
            return error.response.data.detail;
        }
        if (typeof error?.response?.data?.message === 'string') {
            return error.response.data.message;
        }
        return fallback;
    };

    const handlePasswordResetRequest = async () => {
        if (!resetEmail?.trim()) {
            setResetStatus({ type: 'error', message: 'Please provide the email associated with your account.' });
            return;
        }

        setResetLoading(true);
        setResetStatus({ type: null, message: '' });

        try {
            const { data } = await axiosInstance.post('auth/password-reset/request', {
                email: resetEmail.trim().toLowerCase(),
            });

            setResetRequestToken(data.token || '');
            setResetStep('verify');
            setResetStatus({
                type: 'success',
                message: data.message || 'Check your email for the 6-digit reset code.',
            });
            setResetResendCooldown(60);
        } catch (error) {
            setResetStatus({
                type: 'error',
                message: extractErrorMessage(error, 'Unable to send reset code. Please try again.'),
            });
        } finally {
            setResetLoading(false);
        }
    };

    const handlePasswordResetResend = async () => {
        if (resetResendCooldown > 0) return;
        await handlePasswordResetRequest();
    };

    const handlePasswordResetCodeChange = (index, value) => {
        if (value && !/^[0-9]$/.test(value)) return;
        const next = [...resetCode];
        next[index] = value;
        setResetCode(next);
        if (value && index < 5) {
            document.getElementById(`reset-code-${index + 1}`)?.focus();
        }
    };

    const handlePasswordResetCodeKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !resetCode[index] && index > 0) {
            document.getElementById(`reset-code-${index - 1}`)?.focus();
        }
        if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then((text) => {
                const digits = text.replace(/\D/g, '').slice(0, 6).split('');
                const padded = [...digits, '', '', '', '', '', ''].slice(0, 6);
                setResetCode(padded);
                if (digits.length === 6) {
                    document.getElementById('reset-code-5')?.focus();
                }
            });
        }
    };

    const handlePasswordResetVerify = async () => {
        if (!resetRequestToken) {
            setResetStatus({
                type: 'error',
                message: 'Please request a reset code first.',
            });
            return;
        }

        const code = resetCode.join('');
        if (code.length !== 6) {
            setResetStatus({ type: 'error', message: 'Enter the 6-digit verification code.' });
            return;
        }

        setResetLoading(true);
        setResetStatus({ type: null, message: '' });

        try {
            const { data } = await axiosInstance.post('auth/password-reset/verify', {
                email: resetEmail.trim().toLowerCase(),
                code,
                token: resetRequestToken,
            });

            setResetSessionToken(data.token || '');
            setResetStep('complete');
            setResetCode(['', '', '', '', '', '']);
            setResetStatus({
                type: 'success',
                message: 'Code verified! You can now set a new password.',
            });
        } catch (error) {
            setResetStatus({
                type: 'error',
                message: extractErrorMessage(error, 'Verification failed. Please double-check the code.'),
            });
        } finally {
            setResetLoading(false);
        }
    };

    const handlePasswordResetComplete = async () => {
        if (!resetSessionToken) {
            setResetStatus({ type: 'error', message: 'Verification required before setting a new password.' });
            return;
        }

        if (resetNewPassword.length < 8) {
            setResetStatus({ type: 'error', message: 'Password must be at least 8 characters long.' });
            return;
        }

        if (resetNewPassword !== resetConfirmPassword) {
            setResetStatus({ type: 'error', message: 'Passwords do not match.' });
            return;
        }

        setResetLoading(true);
        setResetStatus({ type: null, message: '' });

        try {
            const { data } = await axiosInstance.post('auth/password-reset/complete', {
                token: resetSessionToken,
                new_password: resetNewPassword,
            });

            setResetStatus({
                type: 'success',
                message: data.message || 'Password updated successfully. You can sign in with your new password now.',
            });
            setResetStep('done');
        } catch (error) {
            setResetStatus({
                type: 'error',
                message: extractErrorMessage(error, 'Unable to update password. Please try again.'),
            });
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--te-bg)] text-[var(--te-text)] transition-colors">
            {/* Header */}
            <div className="border-b border-[var(--te-border)] bg-[var(--te-bg)]">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <span className="te-eyebrow">{'// settings'}</span>
                            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-[var(--te-text)] sm:text-4xl">
                                Profile
                            </h1>
                            <p className="mt-3 text-sm leading-6 text-[var(--te-text-dim)] sm:text-base">
                                {isPrivilegedUser ? 'Review privileged access and account security.' : 'Manage your account, contact details, and security settings.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button onClick={openPasswordResetModal} className="te-btn-secondary">
                                <LockClosedIcon className="h-4 w-4" />
                                <span>Reset password</span>
                            </button>

                            {isAdmin && isPrivilegedUser && (
                                <button onClick={() => setShowEditPrivileged(true)} className="te-btn-secondary">
                                    <PencilIcon className="h-4 w-4" />
                                    <span>Edit account</span>
                                </button>
                            )}

                            {!isPrivilegedUser && !isEditing && (
                                <button onClick={handleEdit} className="te-btn-primary">
                                    <PencilIcon className="h-4 w-4" />
                                    <span>Edit profile</span>
                                </button>
                            )}

                            {!isPrivilegedUser && isEditing && (
                                <>
                                    <button onClick={handleCancel} disabled={isSaving} className="te-btn-secondary disabled:cursor-not-allowed disabled:opacity-50">
                                        <XMarkIcon className="h-4 w-4" />
                                        <span>Cancel</span>
                                    </button>
                                    <button onClick={handleSave} disabled={isSaving} className="te-btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                                        {isSaving ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--te-on-primary)] border-t-transparent" />
                                                <span>Saving…</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon className="h-4 w-4" />
                                                <span>Save changes</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notification Banner */}
                    {notification && (
                        <div className={`mt-6 rounded-2xl border px-4 py-3 ${notification.type === 'success'
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30'
                            } animate-fade-in`}>
                            <div className="flex items-start gap-3">
                                {notification.type === 'success' ? (
                                    <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                                ) : (
                                    <ExclamationCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                                )}
                                <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-900 dark:text-red-200'}`}>
                                    {notification.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {isPrivilegedUser ? (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <section className="te-panel p-6 sm:p-8">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                                <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                    <ShieldCheckIcon className="h-12 w-12 text-[var(--te-text-dim)]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="te-eyebrow">{'// account'}</span>
                                    <div className="mt-3 flex flex-wrap items-center gap-3">
                                        <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--te-text)] sm:text-3xl">
                                            {userRoleInt === 5 && 'System Administrator'}
                                            {userRoleInt === 4 && 'Lead Account'}
                                            {userRoleInt === 3 && 'Volunteer Account'}
                                            {userRoleInt === 2 && 'Referrer Account'}
                                        </h2>
                                        <span className="te-chip-gold font-mono">
                                            {userRoleInt === 5 && 'ADMIN'}
                                            {userRoleInt === 4 && 'LEAD'}
                                            {userRoleInt === 3 && 'VOLUNTEER'}
                                            {userRoleInt === 2 && 'REFERRER'}
                                        </span>
                                    </div>
                                    <p className="mt-4 break-all font-mono text-xs text-[var(--te-text-dim)]">
                                        user_id: <code className="rounded-md border border-[var(--te-border)] bg-[var(--te-surface-alt)] px-2 py-1 text-[var(--te-text)]">{userId}</code>
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="te-panel p-6 sm:p-8">
                            <span className="te-eyebrow">{'// access'}</span>
                            <div className="mt-5 space-y-5">
                                <div>
                                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--te-text-dim)]">Role type</p>
                                    <p className="mt-2 text-sm font-medium text-[var(--te-text)]">
                                        {userRoleInt === 5 && 'Administrator - Full System Control'}
                                        {userRoleInt === 4 && 'Lead - Team Management'}
                                        {userRoleInt === 3 && 'Volunteer - Company Management'}
                                        {userRoleInt === 2 && 'Referrer - Company Specific'}
                                    </p>
                                </div>
                                <div className="te-divider" />
                                <div>
                                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--te-text-dim)]">Access level</p>
                                    <p className="mt-2 text-sm font-medium text-[var(--te-text)]">Level {userRoleInt} of 5</p>
                                </div>
                                <div className="te-divider" />
                                <div>
                                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--te-text-dim)]">Session</p>
                                    <p className="mt-2 text-sm font-medium text-[var(--te-text)]">Token-based login · sessionStorage</p>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                        <aside className="te-panel h-fit p-6">
                            <div className="flex flex-col items-start">
                                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                    <span className="font-mono text-3xl font-semibold uppercase text-[var(--te-text)]">
                                        {(editedInfo.full_name || editedInfo.email || 'TE').trim().slice(0, 2)}
                                    </span>
                                </div>
                                <span className="te-eyebrow mt-6">{'// account'}</span>
                                <span className="te-chip-green mt-3 font-mono">MEMBER</span>
                                {isEditing ? (
                                    <div className="mt-3 w-full">
                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                            Full name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editedInfo.full_name}
                                            onChange={(e) => handleChange('full_name', e.target.value)}
                                            className={`te-input ${errors.full_name ? 'border-red-500' : ''}`}
                                            placeholder="Enter your full name"
                                        />
                                        {errors.full_name && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.full_name}</p>}
                                    </div>
                                ) : (
                                    <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-[var(--te-text)]">
                                        {editedInfo.full_name || 'Not provided'}
                                    </h2>
                                )}
                                <p className="mt-3 flex max-w-full items-center gap-2 truncate text-sm text-[var(--te-text-dim)]">
                                    <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />
                                    <span className="truncate">{editedInfo.email || 'No email provided'}</span>
                                </p>
                            </div>
                        </aside>

                        <div className="space-y-6">
                            <section className="te-panel p-6 sm:p-8">
                                <span className="te-eyebrow">{'// contact'}</span>
                                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                            Email {isEditing && <span className="text-red-500">*</span>}
                                        </label>
                                        {isEditing ? (
                                            <div>
                                                <div className="relative">
                                                    <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--te-text-dim)]" />
                                                    <input
                                                        type="email"
                                                        value={editedInfo.email}
                                                        onChange={(e) => handleChange('email', e.target.value)}
                                                        className={`te-input pl-12 ${errors.email ? 'border-red-500' : ''}`}
                                                        placeholder="your.email@example.com"
                                                    />
                                                </div>
                                                {errors.email && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
                                                {editedInfo.email !== userInfo?.email && (
                                                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                                                        <ShieldCheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-te-gold" />
                                                        <p className="text-xs text-[var(--te-text-dim)]">
                                                            Email changes require verification. You'll receive a code at your new email address.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="flex items-center gap-2 text-sm text-[var(--te-text)]">
                                                <EnvelopeIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                                <span className="truncate">{editedInfo.email || 'Not provided'}</span>
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">Phone</label>
                                        {isEditing ? (
                                            <input type="tel" value={editedInfo.phone_number} onChange={(e) => handleChange('phone_number', e.target.value)} className="te-input" placeholder="+233 XX XXX XXXX" />
                                        ) : (
                                            <p className="flex items-center gap-2 text-sm text-[var(--te-text)]"><PhoneIcon className="h-4 w-4 text-[var(--te-text-dim)]" />{editedInfo.phone_number || 'Not provided'}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">Address</label>
                                        {isEditing ? (
                                            <input type="text" value={editedInfo.address} onChange={(e) => handleChange('address', e.target.value)} className="te-input" placeholder="City, Country" />
                                        ) : (
                                            <p className="flex items-center gap-2 text-sm text-[var(--te-text)]"><MapPinIcon className="h-4 w-4 text-[var(--te-text-dim)]" />{editedInfo.address || 'Not provided'}</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="te-panel p-6 sm:p-8">
                                <span className="te-eyebrow">{'// education'}</span>
                                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">University</label>
                                        {isEditing ? (
                                            <input type="text" value={editedInfo.university} onChange={(e) => handleChange('university', e.target.value)} className="te-input" placeholder="Your University" />
                                        ) : (
                                            <p className="flex items-center gap-2 text-sm text-[var(--te-text)]"><AcademicCapIcon className="h-4 w-4 text-[var(--te-text-dim)]" />{editedInfo.university || 'Not provided'}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">Date of birth</label>
                                        {isEditing ? (
                                            <input type="date" value={editedInfo.date_of_birth} onChange={(e) => handleChange('date_of_birth', e.target.value)} className="te-input" />
                                        ) : (
                                            <p className="text-sm text-[var(--te-text)]">{editedInfo.date_of_birth || 'Not provided'}</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}
            </div>

            {/* Password Confirmation Modal for Email Change */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="te-card w-full max-w-md rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] p-6 shadow-sm sm:p-8">
                        <h3 className="mb-4 font-display text-2xl font-bold tracking-tight text-[var(--te-text)]">
                            Confirm Email Change
                        </h3>
                        <p className="text-sm text-[var(--te-text-dim)] mb-6">
                            You are changing your email to <span className="font-semibold text-[var(--te-text)]">{pendingEmailChange}</span>.
                            Please enter your password to confirm.
                        </p>

                        {passwordError && (
                            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
                                <div className="flex items-start">
                                    <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="ml-3 text-sm text-red-800 dark:text-red-300">{passwordError}</p>
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setPasswordError('');
                                }}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handlePasswordConfirm();
                                    }
                                }}
                                className="te-input"
                                placeholder="Enter your password"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handlePasswordModalClose}
                                disabled={isSaving}
                                className="te-btn-secondary flex-1 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordConfirm}
                                disabled={isSaving}
                                className="flex-1 px-4 py-3 te-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Confirming…' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Verification Modal */}
            {showVerificationModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="te-card w-full max-w-md rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] p-6 shadow-sm sm:p-8">
                        <div className="text-center mb-6">
                            <div className="flex justify-center mb-4">
                                <div className="h-16 w-16 rounded-full bg-[var(--te-surface-alt)] border border-[var(--te-border)] flex items-center justify-center shadow-sm">
                                    <EnvelopeIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <h3 className="mb-2 font-display text-2xl font-bold tracking-tight text-[var(--te-text)]">
                                Verify Your New Email
                            </h3>
                            <p className="text-sm text-[var(--te-text-dim)]">
                                We sent a 6-digit code to
                            </p>
                            <p className="text-[var(--te-text)] font-semibold mt-1">
                                {pendingEmailChange}
                            </p>
                        </div>

                        {verificationError && (
                            <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
                                <div className="flex items-start">
                                    <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="ml-3 text-sm text-red-800 dark:text-red-300">{verificationError}</p>
                                </div>
                            </div>
                        )}

                        {/* 6-Digit Code Input */}
                        <div className="mb-6">
                            <label className="mb-3 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                Enter Verification Code
                            </label>
                            <div className="flex gap-2 justify-center">
                                {verificationCode.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`verify-code-${index}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleVerificationKeyDown(index, e)}
                                        className="h-12 w-12 rounded-xl border border-[var(--te-border)] bg-[var(--te-surface)] text-center font-mono text-xl font-bold text-[var(--te-text)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--te-ring)]"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-[var(--te-text-dim)] mt-3">
                                Code expires in 15 minutes
                            </p>
                        </div>

                        {/* Verify Button */}
                        <button
                            onClick={handleVerifyEmail}
                            disabled={isVerifying}
                            className="w-full mb-4 px-4 py-3 te-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isVerifying ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    <span>Verifying…</span>
                                </div>
                            ) : (
                                'Verify email'
                            )}
                        </button>

                        {/* Resend Code */}
                        <div className="text-center mb-4">
                            <p className="text-sm text-[var(--te-text-dim)] mb-2">
                                Didn't receive the code?
                            </p>
                            <button
                                onClick={handleResendVerificationCode}
                                disabled={isVerifying || resendCooldown > 0}
                                className="te-link inline-flex items-center gap-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <ArrowPathIcon className={`h-4 w-4 ${isVerifying ? 'animate-spin' : ''}`} />
                                {resendCooldown > 0 ? (
                                    <span>Resend code in {resendCooldown}s</span>
                                ) : (
                                    <span>Resend code</span>
                                )}
                            </button>
                        </div>

                        {/* Cancel Button */}
                        <button
                            onClick={handleVerificationModalClose}
                            disabled={isVerifying}
                            className="te-btn-secondary w-full disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {showPasswordResetModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="te-card w-full max-w-lg rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] p-6 shadow-sm sm:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="te-eyebrow mb-1">Secure Reset</p>
                                <h3 className="mb-2 font-display text-2xl font-bold tracking-tight text-[var(--te-text)]">Reset your password</h3>
                                <p className="text-sm text-[var(--te-text-dim)]">
                                    We'll send a one-time code to <span className="font-semibold">{resetEmail || 'your email'}</span> and walk you through setting a new password.
                                </p>
                            </div>
                            <button
                                onClick={closePasswordResetModal}
                                className="te-icon-btn"
                                aria-label="Close password reset"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-3">
                            {passwordResetSteps.map((step, index) => {
                                const isComplete = index < activeResetStepIndex;
                                const isActive = index === activeResetStepIndex;
                                return (
                                    <div key={step.id} className="flex flex-col items-center text-center">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-full border font-mono text-sm font-bold ${isComplete || isActive
                                                ? 'border-green-600 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-900/20 dark:text-green-300 '
                                                : 'border-[var(--te-border)] text-[var(--te-text-dim)]'
                                                }`}
                                        >
                                            {isComplete ? <CheckIcon className="h-5 w-5" /> : index + 1}
                                        </div>
                                        <span className={`mt-2 text-xs font-semibold ${isComplete || isActive ? 'text-[var(--te-text)]' : 'text-[var(--te-text-dim)]'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {resetStatus.message && (
                            <div
                                className={`mt-6 rounded-lg border px-4 py-3 text-sm font-medium ${resetStatus.type === 'error'
                                    ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                                    }`}
                            >
                                {resetStatus.message}
                            </div>
                        )}

                        {/* Step Content */}
                        <div className="mt-6 space-y-5">
                            {resetStep === 'request' && (
                                <>
                                    <div>
                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                            Account Email
                                        </label>
                                        <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="te-input"
                                        />
                                        <p className="text-xs text-[var(--te-text-dim)] mt-2">
                                            We recommend using your current profile email so we can match your account instantly.
                                        </p>
                                    </div>

                                    <div className="rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] px-4 py-3 text-xs text-[var(--te-text)] flex items-start gap-3">
                                        <ShieldCheckIcon className="h-5 w-5 text-[var(--te-text-dim)] flex-shrink-0" />
                                        <p>Reset links expire in 15 minutes and codes are single-use. You can always request another if it expires.</p>
                                    </div>

                                    <button
                                        onClick={handlePasswordResetRequest}
                                        disabled={resetLoading}
                                        className="te-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {resetLoading ? (
                                            <>
                                                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                                <span>Sending code…</span>
                                            </>
                                        ) : (
                                            <>
                                                <EnvelopeIcon className="h-5 w-5" />
                                                <span>Send Reset Code</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}

                            {resetStep === 'verify' && (
                                <>
                                    <p className="text-sm text-[var(--te-text-dim)]">
                                        Enter the six-digit code we emailed to <span className="font-semibold">{resetEmail}</span>.
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                        {resetCode.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`reset-code-${index}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handlePasswordResetCodeChange(index, e.target.value)}
                                                onKeyDown={(e) => handlePasswordResetCodeKeyDown(index, e)}
                                                className="h-14 w-12 rounded-xl border border-[var(--te-border)] bg-[var(--te-surface)] text-center font-mono text-xl font-bold text-[var(--te-text)] focus:border-[var(--te-border-strong)] focus:ring-2 focus:ring-[var(--te-ring)] sm:h-16 sm:w-14"
                                            />
                                        ))}
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                                        <button
                                            onClick={handlePasswordResetResend}
                                            disabled={resetLoading || resetResendCooldown > 0}
                                            className="te-link inline-flex items-center gap-2 text-sm font-semibold disabled:opacity-60"
                                        >
                                            <ArrowPathIcon className="h-4 w-4" />
                                            {resetResendCooldown > 0 ? `Resend in ${resetResendCooldown}s` : 'Resend code'}
                                        </button>
                                        <button
                                            onClick={handlePasswordResetVerify}
                                            disabled={resetLoading}
                                            className="te-btn-primary disabled:opacity-60"
                                        >
                                            {resetLoading ? 'Verifying…' : 'Verify code'}
                                        </button>
                                    </div>
                                </>
                            )}

                            {resetStep === 'complete' && (
                                <>
                                    <div>
                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={resetNewPassword}
                                            onChange={(e) => setResetNewPassword(e.target.value)}
                                            className="te-input"
                                            placeholder="At least 8 characters"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={resetConfirmPassword}
                                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                                            className="te-input"
                                            placeholder="Re-enter new password"
                                        />
                                    </div>
                                    <button
                                        onClick={handlePasswordResetComplete}
                                        disabled={resetLoading}
                                        className="te-btn-primary w-full disabled:opacity-60"
                                    >
                                        {resetLoading ? 'Updating…' : 'Update Password'}
                                    </button>
                                </>
                            )}

                            {resetStep === 'done' && (
                                <div className="text-center py-8">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                                        <CheckCircleIcon className="h-10 w-10" />
                                    </div>
                                    <h4 className="text-xl font-bold text-[var(--te-text)] mb-2">Password updated!</h4>
                                    <p className="text-sm text-[var(--te-text-dim)] mb-6">
                                        You can now sign in with your new password. For security, consider logging out of other sessions.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={() => {
                                                setResetStep('request');
                                                setResetStatus({ type: null, message: '' });
                                                setResetNewPassword('');
                                                setResetConfirmPassword('');
                                                setResetRequestToken('');
                                                setResetSessionToken('');
                                                setResetResendCooldown(0);
                                            }}
                                            className="te-btn-secondary flex-1"
                                        >
                                            Start another reset
                                        </button>
                                        <button
                                            onClick={closePasswordResetModal}
                                            className="te-btn-primary flex-1"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Privileged Account Modal (Admin only) */}
            {isAdmin && userInfo && (
                <EditPrivilegedAccount
                    show={showEditPrivileged}
                    onClose={() => setShowEditPrivileged(false)}
                    account={{
                        id: userId,
                        username: userInfo.username || 'Unknown',
                        role: userRoleInt,
                        is_active: userInfo.is_active !== undefined ? userInfo.is_active : true
                    }}
                    onUpdate={(updatedAccount) => {
                        // Refresh user info after update
                        setUserInfo(prev => ({ ...prev, ...updatedAccount }));
                        setNotification({
                            type: 'success',
                            message: 'Account updated successfully'
                        });
                        setTimeout(() => setNotification(null), 5000);
                    }}
                />
            )}
        </div>
    );
}

export default Profile;
