import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../axiosConfig';
import {
    BuildingOfficeIcon,
    UserPlusIcon,
    XMarkIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const CreateReferrer = ({ show, onClose }) => {
    const { accessToken } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        token: '',
        company_id: '',
    });
    const [companies, setCompanies] = useState([]);
    const [createdCredentials, setCreatedCredentials] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Fetch companies when component mounts
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await axiosInstance.get('/referrals/companies', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                setCompanies(response.data.companies || []);
            } catch (err) {
                console.error('Failed to fetch companies:', err);
            }
        };

        if (show && accessToken) {
            fetchCompanies();
        }
    }, [show, accessToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Find the selected company to get its name
            const selectedCompany = companies.find(c => c.id === formData.company_id);
            
            const response = await axiosInstance.post(
                '/users/privileged/referrers',
                {
                    username: formData.username,
                    token: formData.token,
                    company_id: formData.company_id,
                    company_name: selectedCompany?.name || '', // Include company name
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            // Show the created credentials
            setCreatedCredentials({
                username: formData.username,
                token: formData.token,
                company_name: response.data.referrer.company_name,
            });

            // Reset form
            setFormData({
                username: '',
                token: '',
                company_id: '',
            });
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create referrer account');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCredentials = () => {
        if (createdCredentials) {
            const text = `Username: ${createdCredentials.username}\nToken: ${createdCredentials.token}\nCompany: ${createdCredentials.company_name}\nRole: Referrer`;
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
            company_id: '',
        });
        onClose();
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-6 w-6" />
                        <h2 className="text-xl font-bold">Create Referrer Account</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Success Message */}
                {createdCredentials && (
                    <div className="p-6 bg-green-50 border-b border-green-200">
                        <div className="flex items-start gap-3 mb-4">
                            <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-green-900 mb-1">
                                    Referrer Account Created Successfully!
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
                                <p className="font-mono text-sm font-bold text-purple-600">
                                    {createdCredentials.token}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-600">Company:</span>
                                <p className="text-sm text-gray-900">{createdCredentials.company_name}</p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-gray-600">Role:</span>
                                <p className="text-sm text-gray-900">Referrer</p>
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
                            Create Another Referrer
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
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                placeholder="e.g., google_referrer"
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
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                                placeholder="e.g., mysecuretoken123"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Access token for authentication (minimum 8 characters recommended)
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Assigned Company *
                            </label>
                            <select
                                required
                                value={formData.company_id}
                                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="">Select a company...</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                Referrer will only see referral requests for this company
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <UserPlusIcon className="h-5 w-5" />
                                        Create Referrer
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

export default CreateReferrer;
