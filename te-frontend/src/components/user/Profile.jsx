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
    ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../axiosConfig';
import CreateLeadAdmin from './CreateLeadAdmin';

const Profile = () => {
    const { userInfo, setUserInfo } = useData();
    const { userId, accessToken, userRole } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
    const [errors, setErrors] = useState({});
    const [showCreateLeadAdmin, setShowCreateLeadAdmin] = useState(false);

    // Check if user is Admin (role === 3)
    const isAdmin = userRole && parseInt(userRole) === 3;

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
                                Manage your personal information and preferences
                            </p>
                        </div>
                        <div className="flex gap-3">
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

                            {!isEditing ? (
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                    <PencilIcon className="h-4 w-4" />
                                    <span>Edit Profile</span>
                                </button>
                            ) : (
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
            </div>
        </div>
    )
}

export default Profile;