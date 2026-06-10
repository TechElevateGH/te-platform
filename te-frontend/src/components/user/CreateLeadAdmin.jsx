import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../axiosConfig';
import {
    ShieldCheckIcon,
    UserPlusIcon,
    XMarkIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    BuildingOfficeIcon,
} from 'icons';

const CreateLeadAdmin = ({ show, onClose, userRole }) => {
    const { accessToken } = useAuth();
    const isLead = userRole === 4;

    const [accountType, setAccountType] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [formData, setFormData] = useState({
        username: '',
        token: '',
        role: isLead ? '3' : '4', // Default to Volunteer (3) for Lead, Lead (4) for Admin
        company_id: '', // For referrer accounts
    });
    const [createdCredentials, setCreatedCredentials] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Reset accountType when modal opens
    useEffect(() => {
        if (show) {
            setAccountType(null); // Reset to null to show account type selector
            setFormData(prev => ({
                ...prev,
                role: isLead ? '3' : '4'
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    // Fetch companies when modal opens and accountType is referrer
    const fetchCompanies = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/referrals/companies/list', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setCompanies(response.data.companies || []);
        } catch (err) {
            console.error('Error fetching companies:', err);
            setError('Failed to load companies');
        }
    }, [accessToken]);

    // Fetch companies when accountType is referrer
    useEffect(() => {
        if (show && accountType === 'referrer') {
            fetchCompanies();
        }
    }, [show, accountType, fetchCompanies]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let response;
            if (accountType === 'referrer') {
                // Create referrer account
                response = await axiosInstance.post(
                    '/users/privileged/referrers',
                    {
                        username: formData.username,
                        token: formData.token,
                        company_id: formData.company_id,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                // Show the created credentials
                setCreatedCredentials({
                    username: response.data.referrer.username,
                    token: formData.token,
                    role: 'Referrer',
                    company: companies.find(c => c.id === formData.company_id)?.name || 'Unknown',
                });
            } else if (accountType === 'volunteer') {
                // Create volunteer account
                response = await axiosInstance.post(
                    '/users/privileged/volunteers',
                    {
                        username: formData.username,
                        token: formData.token,
                        role: 3, // Volunteer role
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                // Show the created credentials
                setCreatedCredentials({
                    username: response.data.volunteer.username,
                    token: formData.token,
                    role: 'Volunteer',
                });
            } else {
                // Create management account (Lead/Admin/Volunteer via role dropdown)
                const roleInt = parseInt(formData.role);
                const endpoint = roleInt === 3
                    ? '/users/privileged/volunteers'
                    : '/users/privileged/leads';

                response = await axiosInstance.post(
                    endpoint,
                    {
                        username: formData.username,
                        token: formData.token,
                        role: roleInt,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                // Show the created credentials
                const roleNames = { 3: 'Volunteer', 4: 'Lead', 5: 'Admin' };
                setCreatedCredentials({
                    username: response.data.volunteer?.username || response.data.lead?.username,
                    token: formData.token,
                    role: roleNames[roleInt] || 'Unknown',
                });
            }

            // Reset form
            setFormData({
                username: '',
                token: '',
                role: isLead ? '3' : '4',
                company_id: '',
            });
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCredentials = () => {
        if (createdCredentials) {
            let text = `Username: ${createdCredentials.username}\nToken: ${createdCredentials.token}\nRole: ${createdCredentials.role}`;
            if (createdCredentials.company) {
                text += `\nCompany: ${createdCredentials.company}`;
            }
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setCreatedCredentials(null);
        setError('');
        setAccountType(null); // Reset to show account type selector on next open
        setFormData({
            username: '',
            token: '',
            role: isLead ? '3' : '4',
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
                        <ShieldCheckIcon className="h-6 w-6 text-te-green" />
                        <div>
                            <span className="te-eyebrow">{'// access'}</span>
                            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--te-text)]">
                                Create Management Account
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="te-icon-btn"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Success Message - Show Created Credentials */}
                {createdCredentials && (
                    <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-[var(--te-text)] mb-1">
                                    Account Created Successfully!
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
                                <span className="text-xs font-semibold text-[var(--te-text-dim)]">Role:</span>
                                <p className="text-sm text-[var(--te-text)]">{createdCredentials.role}</p>
                            </div>
                            {createdCredentials.company && (
                                <div>
                                    <span className="text-xs font-semibold text-[var(--te-text-dim)]">Company:</span>
                                    <p className="text-sm text-[var(--te-text)]">{createdCredentials.company}</p>
                                </div>
                            )}
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
                            Create Another Account
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="border-b border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
                        <div className="flex items-start gap-3">
                            <ExclamationCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    </div>
                )}

                {/* Form */}
                {!createdCredentials && (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Account Type Selector */}
                        <div>
                            <label className="mb-2 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                Account Type *
                            </label>
                            <div className={`grid ${isLead ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                                {/* Lead/Admin/Volunteer - Show for Admin only as one option with role dropdown */}
                                {!isLead && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAccountType('management');
                                            setFormData({ ...formData, company_id: '', role: '4' });
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${accountType === 'management'
                                            ? 'bg-[var(--te-primary)] text-[var(--te-on-primary)] shadow-none'
                                            : 'bg-[var(--te-surface-alt)]  text-[var(--te-text)] hover:bg-[var(--te-hover)] border border-[var(--te-border)]'
                                            }`}
                                    >
                                        <ShieldCheckIcon className="h-5 w-5" />
                                        <span className="text-xs sm:text-sm">Management</span>
                                    </button>
                                )}

                                {/* Volunteer - Show for Lead */}
                                {isLead && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAccountType('volunteer');
                                            setFormData({ ...formData, company_id: '', role: '3' });
                                        }}
                                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${accountType === 'volunteer'
                                            ? 'bg-[var(--te-primary)] text-[var(--te-on-primary)] shadow-none'
                                            : 'bg-[var(--te-surface-alt)]  text-[var(--te-text)] hover:bg-[var(--te-hover)] border border-[var(--te-border)]'
                                            }`}
                                    >
                                        <ShieldCheckIcon className="h-5 w-5" />
                                        <span className="text-xs sm:text-sm">Volunteer</span>
                                    </button>
                                )}

                                {/* Referrer - Show for both */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAccountType('referrer');
                                        setFormData({ ...formData, role: '2' });
                                    }}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${accountType === 'referrer'
                                        ? 'bg-[var(--te-primary)] text-[var(--te-on-primary)] shadow-none'
                                        : 'bg-[var(--te-surface-alt)]  text-[var(--te-text)] hover:bg-[var(--te-hover)] border border-[var(--te-border)]'
                                        }`}
                                >
                                    <BuildingOfficeIcon className="h-5 w-5" />
                                    <span className="text-xs sm:text-sm">Referrer</span>
                                </button>
                            </div>
                        </div>

                        {/* Show form fields only when account type is selected */}
                        {accountType && (
                            <>
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
                                        placeholder="e.g., love"
                                    />
                                    <p className="text-xs text-[var(--te-text-dim)] mt-1">
                                        {accountType === 'referrer'
                                            ? 'Internal identifier (not used for login)'
                                            : 'Username for login authentication'
                                        }
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
                                        placeholder="e.g., peace"
                                    />
                                    <p className="text-xs text-[var(--te-text-dim)] mt-1">
                                        {accountType === 'referrer'
                                            ? 'Referrers authenticate with token only'
                                            : accountType === 'volunteer'
                                                ? 'Volunteers authenticate with username and token'
                                                : 'Access token for authentication (minimum 8 characters recommended)'
                                        }
                                    </p>
                                </div>

                                {accountType === 'management' ? (
                                    <div>
                                        <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                            Role *
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="te-select"
                                        >
                                            <option value="3">Volunteer</option>
                                            <option value="4">Lead</option>
                                            <option value="5">Admin</option>
                                        </select>
                                    </div>
                                ) : accountType === 'volunteer' ? (
                                    <div className="bg-[var(--te-surface-alt)]  border border-[var(--te-border)] rounded-lg p-4">
                                        <p className="text-sm text-[var(--te-text-dim)]">
                                            <span className="font-semibold">Role:</span> Volunteer (3)
                                        </p>
                                        <p className="text-xs text-[var(--te-text-dim)] mt-1">
                                            We really appreciate our Volunteers!
                                        </p>
                                    </div>
                                ) : accountType === 'referrer' ? (
                                    <div>
                                        <label className="mb-1.5 block font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[var(--te-text-dim)]">
                                            Assigned Company *
                                        </label>
                                        <select
                                            value={formData.company_id}
                                            onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                                            required
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
                                            Referrer will manage referrals for this company
                                        </p>
                                    </div>
                                ) : null}

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
                                                Create Account
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
                            </>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default CreateLeadAdmin;
