import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
    XMarkIcon,
    UserIcon,
    KeyIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon
} from 'icons';
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
                token: account.lead_token || '',  // Pre-fill with current token
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
                    <div className="fixed inset-0 bg-black/60 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] text-left shadow-sm transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-[var(--te-surface)] px-6 pt-6 pb-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--te-surface-alt)] border border-[var(--te-border)]">
                                                <ShieldCheckIcon className="h-6 w-6 text-[var(--te-text)]" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="font-display text-xl font-bold tracking-tight text-[var(--te-text)]">
                                                    Edit Privileged Account
                                                </Dialog.Title>
                                                <p className="text-sm text-[var(--te-text-dim)] mt-1">
                                                    Update username or reset token
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="te-icon-btn"
                                        >
                                            <XMarkIcon className="h-5 w-5" />
                                        </button>
                                    </div>

                                    {/* Current Account Info */}
                                    {account && (
                                        <div className="mb-6 p-4 bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-[var(--te-text)]">Current Account</span>
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${'te-badge'
                                                    }`}>
                                                    {getRoleName(account.role)}
                                                </span>
                                            </div>
                                            <p className="text-lg font-bold text-[var(--te-text)]">{account.username}</p>
                                            <p className="text-xs text-[var(--te-text-dim)] mt-1">
                                                Status: <span className={`font-semibold ${account.is_active ? 'text-[var(--te-text)]' : 'text-red-600'}`}>
                                                    {account.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </p>
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {error && (
                                        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
                                            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                                        </div>
                                    )}

                                    {/* Form */}
                                    <form onSubmit={handleSubmit} className="space-y-5">
                                        {/* Username */}
                                        <div>
                                            <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                                Username
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <UserIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.username}
                                                    onChange={(e) => handleChange('username', e.target.value)}
                                                    className="te-input pl-10"
                                                    placeholder="Enter new username"
                                                />
                                            </div>
                                            <p className="mt-1.5 text-xs text-[var(--te-text-dim)]">
                                                Leave blank to keep current username
                                            </p>
                                        </div>

                                        {/* Token */}
                                        <div>
                                            <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                                Access Token
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <KeyIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.token}
                                                    onChange={(e) => handleChange('token', e.target.value)}
                                                    className="te-input pl-10"
                                                    placeholder="Enter token"
                                                />
                                            </div>
                                            <p className="mt-1.5 text-xs text-[var(--te-text-dim)]">
                                                Current token is shown. Modify to change or leave blank to keep current.
                                            </p>
                                        </div>

                                        {/* Active Status Toggle */}
                                        <div className="flex items-center justify-between p-4 bg-[var(--te-surface-alt)] rounded-lg border border-[var(--te-border)]">
                                            <div>
                                                <label className="block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                                    Account Status
                                                </label>
                                                <p className="text-xs text-[var(--te-text-dim)] mt-0.5">
                                                    {formData.is_active ? 'Account is active' : 'Account is deactivated'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleChange('is_active', !formData.is_active)}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--te-ring)] ${formData.is_active ? 'bg-[var(--te-primary)]' : 'bg-[var(--te-surface-alt)]'}`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--te-surface)] ring-0 transition duration-200 ease-in-out ${formData.is_active ? 'translate-x-5' : 'translate-x-0'
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
                                                className="te-btn-secondary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="te-btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
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