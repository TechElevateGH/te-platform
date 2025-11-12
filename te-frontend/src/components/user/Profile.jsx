import { useState, useEffect } from 'react'
import {
    UserCircleIcon,
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
    ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../axiosConfig';
import EditPrivilegedAccount from './EditPrivilegedAccount';

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

    // Check user role (Admin=5, Lead=4, Volunteer=3, Referrer=2, Member=1)
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const isAdmin = userRoleInt === 5;
    const isPrivilegedUser = userRoleInt >= 2; // Referrer, Volunteer, Lead, or Admin

    const [editedInfo, setEditedInfo] = useState({
        full_name: '',
        email: '',
        contact: '',
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
                contact: userInfo.contact || '',
                university: userInfo.university || '',
                date_of_birth: userInfo.date_of_birth || '',
                address: userInfo.address || '',
                image: userInfo.image || ''
            });
        }
    }, [userInfo]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

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

                const response = await axiosInstance.patch(
                    `/users/${userId}`,
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
                contact: userInfo.contact || '',
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900/50 transition-colors">
            {/* Header */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                                Profile
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                {isPrivilegedUser ? 'Administrative account management' : 'Manage your personal information and preferences'}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {/* Admin: Edit My Account button (when viewing own privileged account) */}
                            {isAdmin && isPrivilegedUser && (
                                <button
                                    onClick={() => setShowEditPrivileged(true)}
                                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Edit My Account</span>
                                    <span className="sm:hidden">Edit</span>
                                </button>
                            )}

                            {/* Only show edit for Member users */}
                            {!isPrivilegedUser && !isEditing && (
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                    <span>Edit Profile</span>
                                </button>
                            )}

                            {!isPrivilegedUser && isEditing && (
                                <div className="flex gap-2 sm:gap-3">
                                    <button
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                        <span className="hidden sm:inline">Cancel</span>
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckIcon className="h-4 w-4" />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notification Banner */}
                    {notification && (
                        <div className={`mt-4 p-4 rounded-lg border ${notification.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
                            : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
                            } animate-fade-in`}>
                            <div className="flex items-center gap-3">
                                {notification.type === 'success' ? (
                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                                ) : (
                                    <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0" />
                                )}
                                <p className={`text-sm font-semibold ${notification.type === 'success' ? 'text-emerald-900 dark:text-emerald-200' : 'text-red-900 dark:text-red-200'
                                    }`}>
                                    {notification.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Privileged User Profile */}
                {isPrivilegedUser ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 h-24 sm:h-32"></div>
                        <div className="px-4 sm:px-8 py-6 sm:py-8">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 -mt-12 sm:-mt-16">
                                <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center">
                                    <ShieldCheckIcon className="h-12 w-12 sm:h-20 sm:w-20 text-purple-600 dark:text-purple-500" />
                                </div>
                                <div className="flex-1 sm:mt-16">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                        <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                                            {userRoleInt === 5 && 'System Administrator'}
                                            {userRoleInt === 4 && 'Lead Account'}
                                            {userRoleInt === 3 && 'Volunteer Account'}
                                            {userRoleInt === 2 && 'Referrer Account'}
                                        </h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${userRoleInt === 5 ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' :
                                            userRoleInt === 4 ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
                                                userRoleInt === 3 ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                                                    'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300'
                                            }`}>
                                            {userRoleInt === 5 && 'ADMIN'}
                                            {userRoleInt === 4 && 'LEAD'}
                                            {userRoleInt === 3 && 'VOLUNTEER'}
                                            {userRoleInt === 2 && 'REFERRER'}
                                        </span>
                                    </div>
                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 break-all">
                                        User ID: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs sm:text-sm">{userId}</code>
                                    </p>
                                    <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                                        {userRoleInt === 5 && (
                                            <>
                                                <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg px-3 sm:px-4 py-2">
                                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">Permissions</p>
                                                    <p className="text-sm text-purple-900 dark:text-purple-300 font-medium">Full System Access</p>
                                                </div>
                                                <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-2">
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-1">Capabilities</p>
                                                    <p className="text-sm text-indigo-900 dark:text-indigo-300 font-medium">Create/Manage All Accounts</p>
                                                </div>
                                            </>
                                        )}
                                        {userRoleInt === 4 && (
                                            <>
                                                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
                                                    <p className="text-xs text-blue-600 font-semibold mb-1">Permissions</p>
                                                    <p className="text-sm text-blue-900 font-medium">Full Data Access</p>
                                                </div>
                                                <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-2">
                                                    <p className="text-xs text-cyan-600 font-semibold mb-1">Capabilities</p>
                                                    <p className="text-sm text-cyan-900 font-medium">Manage Members & Referrals</p>
                                                </div>
                                            </>
                                        )}
                                        {userRoleInt === 3 && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                                                <p className="text-xs text-green-600 font-semibold mb-1">Capabilities</p>
                                                <p className="text-sm text-green-900 font-medium">Add Referral Companies</p>
                                            </div>
                                        )}
                                        {userRoleInt === 2 && (
                                            <div className="bg-cyan-50 border border-cyan-200 rounded-lg px-4 py-2">
                                                <p className="text-xs text-cyan-600 font-semibold mb-1">Assigned Company</p>
                                                <p className="text-sm text-cyan-900 font-medium">Company-Specific Access</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Admin Info Section */}
                            <div className="mt-8 grid md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Information</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Role Type</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {userRoleInt === 5 && 'Administrator - Full System Control'}
                                                {userRoleInt === 4 && 'Lead - Team Management'}
                                                {userRoleInt === 3 && 'Volunteer - Company Management'}
                                                {userRoleInt === 2 && 'Referrer - Company Specific'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Access Level</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Level {userRoleInt} of 5</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Security</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Authentication</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Token-based login</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-1">Session</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Tab-specific (sessionStorage)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Member Profile */
                    <>
                        {/* Profile Header Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6 sm:mb-8">
                            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-24 sm:h-32"></div>
                            <div className="px-4 sm:px-6 md:px-8 pb-6 sm:pb-8">
                                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 -mt-12 sm:-mt-16">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center flex-shrink-0">
                                        <UserCircleIcon className="h-20 w-20 sm:h-28 sm:w-28 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <div className="flex-1 mt-12 sm:mt-16 w-full">
                                        <div>
                                            <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Full Name {isEditing && <span className="text-red-500">*</span>}</label>
                                            {isEditing ? (
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={editedInfo.full_name}
                                                        onChange={(e) => handleChange('full_name', e.target.value)}
                                                        className={`text-xl sm:text-2xl font-bold text-gray-900 dark:text-white border-b-2 ${errors.full_name ? 'border-red-500' : 'border-blue-500'} focus:outline-none bg-transparent w-full`}
                                                        placeholder="Enter your full name"
                                                    />
                                                    {errors.full_name && (
                                                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.full_name}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                                    {editedInfo.full_name || 'Not provided'}
                                                </h2>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                            <span className="text-xs sm:text-sm truncate">{editedInfo.email || 'No email provided'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            {/* Contact Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                                    <EnvelopeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-500" />
                                    Contact Information
                                </h3>
                                <div className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                                            Email {isEditing && <span className="text-red-500">*</span>}
                                        </label>
                                        {isEditing ? (
                                            <div>
                                                <input
                                                    type="email"
                                                    value={editedInfo.email}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                    className={`w-full px-3 sm:px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none text-sm sm:text-base dark:placeholder-gray-500`}
                                                    placeholder="your.email@example.com"
                                                />
                                                {errors.email && (
                                                    <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.email}</p>
                                                )}
                                                {editedInfo.email !== userInfo?.email && (
                                                    <div className="mt-2 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                                        <ShieldCheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                        <p className="text-xs text-blue-700 dark:text-blue-300">
                                                            Email changes require verification. You'll receive a code at your new email address.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                                                <EnvelopeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                <span className="truncate">{editedInfo.email || 'Not provided'}</span>
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Phone</label>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={editedInfo.contact}
                                                onChange={(e) => handleChange('contact', e.target.value)}
                                                className="w-full px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none text-sm sm:text-base dark:placeholder-gray-500"
                                                placeholder="+233 XX XXX XXXX"
                                            />
                                        ) : (
                                            <p className="text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                                                <PhoneIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                {editedInfo.contact || 'Not provided'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Address</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedInfo.address}
                                                onChange={(e) => handleChange('address', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:placeholder-gray-500"
                                                placeholder="City, Country"
                                            />
                                        ) : (
                                            <p className="text-gray-900 dark:text-white flex items-center gap-2">
                                                <MapPinIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                                {editedInfo.address || 'Not provided'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Education & Personal */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <AcademicCapIcon className="h-6 w-6 text-purple-600 dark:text-purple-500" />
                                    Education & Personal
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">University</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedInfo.university}
                                                onChange={(e) => handleChange('university', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:placeholder-gray-500"
                                                placeholder="Your University"
                                            />
                                        ) : (
                                            <p className="text-gray-900 dark:text-white">{editedInfo.university || 'Not provided'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Date of Birth</label>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editedInfo.date_of_birth}
                                                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none dark:placeholder-gray-500"
                                            />
                                        ) : (
                                            <p className="text-gray-900 dark:text-white">{editedInfo.date_of_birth || 'Not provided'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Password Confirmation Modal for Email Change */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Confirm Email Change
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            You are changing your email to <span className="font-semibold text-blue-600 dark:text-blue-400">{pendingEmailChange}</span>.
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
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
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
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none"
                                placeholder="Enter your password"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handlePasswordModalClose}
                                disabled={isSaving}
                                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordConfirm}
                                disabled={isSaving}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? 'Confirming...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Verification Modal */}
            {showVerificationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
                        <div className="text-center mb-6">
                            <div className="flex justify-center mb-4">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl">
                                    <EnvelopeIcon className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Verify Your New Email
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                We sent a 6-digit code to
                            </p>
                            <p className="text-blue-600 dark:text-blue-400 font-semibold mt-1">
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
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 text-center">
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
                                        className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none transition-colors"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                                Code expires in 15 minutes
                            </p>
                        </div>

                        {/* Verify Button */}
                        <button
                            onClick={handleVerifyEmail}
                            disabled={isVerifying}
                            className="w-full mb-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isVerifying ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                'Verify Email'
                            )}
                        </button>

                        {/* Resend Code */}
                        <div className="text-center mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Didn't receive the code?
                            </p>
                            <button
                                onClick={handleResendVerificationCode}
                                disabled={isVerifying || resendCooldown > 0}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                            className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
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

