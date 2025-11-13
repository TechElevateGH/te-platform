import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
    XMarkIcon,
    UserIcon,
    KeyIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';

const EditPrivilegedAccount = ({ show, onClose, account, onSuccess }) => {
    const { accessToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        token: '',
        is_active: true
    });

    useEffect(() => {
        if (account) {
            setFormData({
                username: account.username || '',
                token: '', // Don't pre-fill token for security
                is_active: account.is_active !== false
            });
        }
    }, [account]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Only send fields that are filled
            const updateData = {};
            if (formData.username.trim()) {
                updateData.username = formData.username.trim();
            }
            if (formData.token.trim()) {
                updateData.token = formData.token.trim();
            }
            updateData.is_active = formData.is_active;

            const response = await axiosInstance.patch(
                `/users/privileged/${account.id}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.data) {
                onSuccess && onSuccess(response.data);
                onClose();
                setFormData({ username: '', token: '', is_active: true });
            }
        } catch (err) {
            console.error('Error updating privileged account:', err);
            setError(err.response?.data?.detail || 'Failed to update account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (error) setError('');
    };

    const getRoleName = (role) => {
        const roles = {
            2: 'Referrer',
            3: 'Volunteer',
            4: 'Lead',
            5: 'Admin'
        };
        return roles[role] || 'Unknown';
    };

    return (
        <Transition.Root show={show} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white px-6 pt-6 pb-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
                                                <ShieldCheckIcon className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-bold text-gray-900">
                                                    Edit Privileged Account
                                                </Dialog.Title>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Update username or reset token
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Current Account Info */}
                                    {account && (
                                        <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-gray-700">Current Account</span>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${account.role === 5 ? 'bg-purple-100 text-purple-700' :
                                                        account.role === 4 ? 'bg-blue-100 text-blue-700' :
                                                            account.role === 3 ? 'bg-green-100 text-green-700' :
                                                                'bg-cyan-100 text-cyan-700'
                                                    }`}>
                                                    {getRoleName(account.role)}
                                                </span>
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">{account.username}</p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Status: <span className={`font-semibold ${account.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                                    {account.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {error && (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-red-800 font-medium">{error}</p>
                                        </div>
                                    )}

                                    {/* Form */}
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {/* Username */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Username
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.username}
                                                    onChange={(e) => handleChange('username', e.target.value)}
                                                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                    placeholder="Enter new username"
                                                />
                                            </div>
                                            <p className="mt-1.5 text-xs text-gray-500">
                                                Leave blank to keep current username
                                            </p>
                                        </div>

                                        {/* Token */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                New Access Token
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <KeyIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.token}
                                                    onChange={(e) => handleChange('token', e.target.value)}
                                                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                    placeholder="Enter new token (optional)"
                                                />
                                            </div>
                                            <p className="mt-1.5 text-xs text-gray-500">
                                                Leave blank to keep current token
                                            </p>
                                        </div>

                                        {/* Active Status Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">
                                                    Account Status
                                                </label>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {formData.is_active ? 'Account is active' : 'Account is deactivated'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleChange('is_active', !formData.is_active)}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${formData.is_active ? 'bg-green-600' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.is_active ? 'translate-x-5' : 'translate-x-0'
                                                        }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                disabled={loading}
                                                className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                        <span>Updating...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShieldCheckIcon className="h-5 w-5" />
                                                        <span>Update Account</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default EditPrivilegedAccount;