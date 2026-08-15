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
} from 'icons';

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="te-card w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] shadow-sm">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between border-b border-[var(--te-border)] bg-[var(--te-surface)] px-6 py-4 text-[var(--te-text)]">
                    <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-6 w-6 text-te-green" />
                        <div>
                            <span className="te-eyebrow">Referrals</span>
                            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--te-text)]">Create Referrer Account</h2>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="te-icon-btn"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Success Message */}
                {createdCredentials && (
                    <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-[var(--te-text)] mb-1">
                                    Referrer Account Created Successfully!
                                </h3>
                                <p className="text-sm text-[var(--te-text-dim)]">
                                    Save these credentials - the token won't be shown again.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[var(--te-surface)] rounded-lg p-4 space-y-2 border border-[var(--te-border)]">
                            <div>
                                <span className="text-xs font-semibold text-[var(--te-text-dim)]">Username:</span>
                                <p className="font-mono text-sm font-bold text-[var(--te-text)]">
                                    {createdCredentials.username}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-[var(--te-text-dim)]">Token:</span>
                                <p className="font-mono text-sm font-bold text-[var(--te-text)]">
                                    {createdCredentials.token}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-[var(--te-text-dim)]">Company:</span>
                                <p className="text-sm text-[var(--te-text)]">{createdCredentials.company_name}</p>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-[var(--te-text-dim)]">Role:</span>
                                <p className="text-sm text-[var(--te-text)]">Referrer</p>
                            </div>
                        </div>

                        <button
                            onClick={handleCopyCredentials}
                            className="te-btn-primary mt-4 w-full"
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
                            className="te-btn-secondary mt-2 w-full"
                        >
                            Create Another Referrer
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="border-b border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
                        <div className="flex items-start gap-3">
                            <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                {!createdCredentials && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                Username *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value })
                                }
                                className="te-input"
                                placeholder="e.g., google_referrer"
                            />
                            <p className="text-xs text-[var(--te-text-dim)] mt-1">
                                Username for login authentication
                            </p>
                        </div>

                        <div>
                            <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                Token *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.token}
                                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                                className="te-input font-mono"
                                placeholder="e.g., mysecuretoken123"
                            />
                            <p className="text-xs text-[var(--te-text-dim)] mt-1">
                                Access token for authentication (minimum 8 characters recommended)
                            </p>
                        </div>

                        <div>
                            <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                Assigned Company *
                            </label>
                            <select
                                required
                                value={formData.company_id}
                                onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                                className="te-select"
                            >
                                <option value="">Select a company...</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-[var(--te-text-dim)] mt-1">
                                Referrer will only see referral requests for this company
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="te-btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
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
                                className="te-btn-secondary px-6"
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
