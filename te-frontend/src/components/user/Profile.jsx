import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
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
    UserGroupIcon
} from '@heroicons/react/24/outline'
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../axiosConfig';
import CreateLeadAdmin from './CreateLeadAdmin';
import EditPrivilegedAccount from './EditPrivilegedAccount';

const Profile = () => {
    const navigate = useNavigate();
    const { userInfo, setUserInfo } = useData();
    const { userId, accessToken, userRole } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
    const [errors, setErrors] = useState({});
    const [showCreateLeadAdmin, setShowCreateLeadAdmin] = useState(false);
    const [showEditPrivileged, setShowEditPrivileged] = useState(false);

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
            const response = await axiosInstance.patch(
                `/users/${userId}`,
                editedInfo,
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
        } catch (error) {
            console.error('Error updating profile:', error);
            setNotification({
                type: 'error',
                message: error.response?.data?.detail || 'Failed to update profile. Please try again.'
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
            {/* Create Lead/Admin Modal */}
            <CreateLeadAdmin
                show={showCreateLeadAdmin}
                onClose={() => setShowCreateLeadAdmin(false)}
            />

            {/* Header */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Profile
                            </h1>
                            <p className="text-sm text-gray-600">
                                {isPrivilegedUser ? 'Administrative account management' : 'Manage your personal information and preferences'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {/* Admin-only: Account Management button */}
                            {isAdmin && (
                                <button
                                    onClick={() => navigate('/workspace/account-management')}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                    <UserGroupIcon className="h-4 w-4" />
                                    <span>Account Management</span>
                                </button>
                            )}

                            {/* Admin-only: Create Privileged Account button */}
                            {isAdmin && (
                                <button
                                    onClick={() => setShowCreateLeadAdmin(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                    <ShieldCheckIcon className="h-4 w-4" />
                                    <span>Create Privileged Account</span>
                                </button>
                            )}

                            {/* Only show edit for Member users */}
                            {!isPrivilegedUser && !isEditing && (
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                    <span>Edit Profile</span>
                                </button>
                            )}

                            {!isPrivilegedUser && isEditing && (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                        <span>Cancel</span>
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-red-50 border-red-200'
                            } animate-fade-in`}>
                            <div className="flex items-center gap-3">
                                {notification.type === 'success' ? (
                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                ) : (
                                    <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                                )}
                                <p className={`text-sm font-semibold ${notification.type === 'success' ? 'text-emerald-900' : 'text-red-900'
                                    }`}>
                                    {notification.message}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Privileged User Profile */}
                {isPrivilegedUser ? (
                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 h-32"></div>
                        <div className="px-8 py-8">
                            <div className="flex items-start gap-6 -mt-16">
                                <div className="w-32 h-32 bg-white rounded-2xl border-4 border-white shadow-xl flex items-center justify-center">
                                    <ShieldCheckIcon className="h-20 w-20 text-purple-600" />
                                </div>
                                <div className="flex-1 mt-16">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-bold text-gray-900">
                                            {userRoleInt === 5 && 'System Administrator'}
                                            {userRoleInt === 4 && 'Lead Account'}
                                            {userRoleInt === 3 && 'Volunteer Account'}
                                            {userRoleInt === 2 && 'Referrer Account'}
                                        </h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${userRoleInt === 5 ? 'bg-purple-100 text-purple-700' :
                                            userRoleInt === 4 ? 'bg-blue-100 text-blue-700' :
                                                userRoleInt === 3 ? 'bg-green-100 text-green-700' :
                                                    'bg-cyan-100 text-cyan-700'
                                            }`}>
                                            {userRoleInt === 5 && 'ADMIN'}
                                            {userRoleInt === 4 && 'LEAD'}
                                            {userRoleInt === 3 && 'VOLUNTEER'}
                                            {userRoleInt === 2 && 'REFERRER'}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-4">
                                        User ID: <code className="bg-gray-100 px-2 py-1 rounded text-sm">{userId}</code>
                                    </p>
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        {userRoleInt === 5 && (
                                            <>
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                                                    <p className="text-xs text-purple-600 font-semibold mb-1">Permissions</p>
                                                    <p className="text-sm text-purple-900 font-medium">Full System Access</p>
                                                </div>
                                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2">
                                                    <p className="text-xs text-indigo-600 font-semibold mb-1">Capabilities</p>
                                                    <p className="text-sm text-indigo-900 font-medium">Create/Manage All Accounts</p>
                                                </div>
                                            </>
                                        )}
                                        {userRoleInt === 4 && (
                                            <>
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
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
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Role Type</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {userRoleInt === 5 && 'Administrator - Full System Control'}
                                                {userRoleInt === 4 && 'Lead - Team Management'}
                                                {userRoleInt === 3 && 'Volunteer - Company Management'}
                                                {userRoleInt === 2 && 'Referrer - Company Specific'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Access Level</p>
                                            <p className="text-sm font-medium text-gray-900">Level {userRoleInt} of 5</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Security</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Authentication</p>
                                            <p className="text-sm font-medium text-gray-900">Token-based login</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Session</p>
                                            <p className="text-sm font-medium text-gray-900">Tab-specific (sessionStorage)</p>
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
                        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
                            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 h-32"></div>
                            <div className="px-8 pb-8">
                                <div className="flex items-start gap-6 -mt-16">
                                    <div className="w-32 h-32 bg-white rounded-2xl border-4 border-white shadow-xl flex items-center justify-center">
                                        <UserCircleIcon className="h-28 w-28 text-gray-400" />
                                    </div>
                                    <div className="flex-1 mt-16">
                                        <div>
                                            <label className="text-sm font-semibold text-gray-700 mb-1 block">Full Name {isEditing && <span className="text-red-500">*</span>}</label>
                                            {isEditing ? (
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={editedInfo.full_name}
                                                        onChange={(e) => handleChange('full_name', e.target.value)}
                                                        className={`text-2xl font-bold text-gray-900 border-b-2 ${errors.full_name ? 'border-red-500' : 'border-blue-500'} focus:outline-none bg-transparent w-full`}
                                                        placeholder="Enter your full name"
                                                    />
                                                    {errors.full_name && (
                                                        <p className="text-red-600 text-xs mt-1">{errors.full_name}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <h2 className="text-2xl font-bold text-gray-900">
                                                    {editedInfo.full_name || 'Not provided'}
                                                </h2>
                                            )}
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-gray-600">
                                            <EnvelopeIcon className="h-5 w-5" />
                                            <span className="text-sm">{editedInfo.email || 'No email provided'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Contact Information */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <EnvelopeIcon className="h-6 w-6 text-blue-600" />
                                    Contact Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">
                                            Email {isEditing && <span className="text-red-500">*</span>}
                                        </label>
                                        {isEditing ? (
                                            <div>
                                                <input
                                                    type="email"
                                                    value={editedInfo.email}
                                                    onChange={(e) => handleChange('email', e.target.value)}
                                                    className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:border-blue-500 focus:outline-none`}
                                                    placeholder="your.email@example.com"
                                                />
                                                {errors.email && (
                                                    <p className="text-red-600 text-xs mt-1">{errors.email}</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-gray-900 flex items-center gap-2">
                                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                                {editedInfo.email || 'Not provided'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Phone</label>
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                value={editedInfo.contact}
                                                onChange={(e) => handleChange('contact', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                                placeholder="+233 XX XXX XXXX"
                                            />
                                        ) : (
                                            <p className="text-gray-900 flex items-center gap-2">
                                                <PhoneIcon className="h-5 w-5 text-gray-400" />
                                                {editedInfo.contact || 'Not provided'}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Address</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedInfo.address}
                                                onChange={(e) => handleChange('address', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                                placeholder="City, Country"
                                            />
                                        ) : (
                                            <p className="text-gray-900 flex items-center gap-2">
                                                <MapPinIcon className="h-5 w-5 text-gray-400" />
                                                {editedInfo.address || 'Not provided'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Education & Personal */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <AcademicCapIcon className="h-6 w-6 text-purple-600" />
                                    Education & Personal
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">University</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editedInfo.university}
                                                onChange={(e) => handleChange('university', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                                placeholder="Your University"
                                            />
                                        ) : (
                                            <p className="text-gray-900">{editedInfo.university || 'Not provided'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-1 block">Date of Birth</label>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editedInfo.date_of_birth}
                                                onChange={(e) => handleChange('date_of_birth', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                            />
                                        ) : (
                                            <p className="text-gray-900">{editedInfo.date_of_birth || 'Not provided'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

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

