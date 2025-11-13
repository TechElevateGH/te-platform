import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../axiosConfig';
import {
    ShieldCheckIcon,
    UserPlusIcon,
    XMarkIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const CreateLeadAdmin = ({ show, onClose }) => {
    const { accessToken } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        token: '',
        role: '3', // Default to Lead (3)
    });
    const [createdCredentials, setCreatedCredentials] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post(
                '/users/leads',
                {
                    username: formData.username,
                    token: formData.token,
                    role: parseInt(formData.role),
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            // Show the created credentials
            setCreatedCredentials({
                username: response.data.username,
                token: formData.token, // Use the token from form
                role: response.data.role === 5 ? 'Admin' : 'Lead',
            });

            // Reset form
            setFormData({
                username: '',
                token: '',
                role: '3',
            });
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCredentials = () => {
        if (createdCredentials) {
            const text = `Username: ${createdCredentials.username}\nToken: ${createdCredentials.token}\nRole: ${createdCredentials.role}`;
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setCreatedCredentials(null);
        setError('');
        setFormData({
            username: '',
            token: '',
            role: '3',
        });
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="h-6 w-6" />
                        <h2 className="text-xl font-bold">Create Lead/Admin Account</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Success Message - Show Created Credentials */}
                {createdCredentials && (
                    <div className="p-6 bg-green-50 border-b border-green-200">
                        <div className="flex items-start gap-3 mb-4">
                            <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-green-900 mb-1">
                                    Account Created Successfully!
                                </h3>
                                <p className="text-sm text-green-700">
                                    Save these credentials - the token won't be shown again.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 space-y-2 border border-green-300">
                            <div>
                                <span className="text-xs font-semibold text-gray-600">Username:</span>
                                <p className="font-mono text-sm font-bold text-gray-900">
                                    {createdCredentials.username}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-600">Token:</span>
                                <p className="font-mono text-sm font-bold text-blue-600">
                                    {createdCredentials.token}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-600">Role:</span>
                                <p className="text-sm text-gray-900">{createdCredentials.role}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleCopyCredentials}
                            className="w-full mt-4 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {copied ? (
                                <>
                                    <CheckCircleIcon className="h-5 w-5" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <ClipboardDocumentIcon className="h-5 w-5" />
                                    Copy Credentials
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => setCreatedCredentials(null)}
                            className="w-full mt-2 px-4 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Create Another Account
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border-b border-red-200">
                        <div className="flex items-start gap-3">
                            <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                {!createdCredentials && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Username *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value })
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., love"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Username for login authentication
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Token *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.token}
                                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                placeholder="e.g., peace"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Access token for authentication (minimum 8 characters recommended)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Role *
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="3">Lead</option>
                                <option value="5">Admin</option>
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <UserPlusIcon className="h-5 w-5" />
                                        Create Account
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateLeadAdmin;
