import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import ReferralCreate from '../components/referral/ReferralCreate'
import ReferralManagement from '../components/referral/ReferralManagement'
import MyReferrals from '../components/referral/MyReferrals'
import SignInPrompt from '../components/_custom/Alert/SignInPrompt'
import {
    CheckCircleIcon,
    XCircleIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    BellAlertIcon,
    ArrowDownTrayIcon,
    ClipboardDocumentIcon
} from '@heroicons/react/20/solid'
import {
    CheckBadgeIcon,
    ClockIcon
} from '@heroicons/react/24/outline'
import { Loading } from '../components/_custom/Loading'
import axiosInstance from '../axiosConfig'

// Mock data for demo purposes
const mockReferralCompanies = [
    {
        id: 1,
        name: 'Microsoft',
        image: 'https://logo.clearbit.com/microsoft.com',
        referral_materials: {
            resume: true,
            referralEssay: true,
            contact: true
        }
    },
    {
        id: 2,
        name: 'Amazon',
        image: 'https://logo.clearbit.com/amazon.com',
        referral_materials: {
            resume: true,
            referralEssay: false,
            contact: true
        }
    },
    {
        id: 3,
        name: 'Google',
        image: 'https://logo.clearbit.com/google.com',
        referral_materials: {
            resume: true,
            referralEssay: true,
            contact: false
        }
    },
    {
        id: 4,
        name: 'Apple',
        image: 'https://logo.clearbit.com/apple.com',
        referral_materials: {
            resume: true,
            referralEssay: false,
            contact: false
        }
    },
    {
        id: 5,
        name: 'Netflix',
        image: 'https://logo.clearbit.com/netflix.com',
        referral_materials: {
            resume: false,
            referralEssay: false,
            contact: false
        }
    }
];


const Referrals = () => {
    const { userRole, accessToken } = useAuth();
    const {
        fetchReferralCompanies,
        setFetchReferralCompanies,
        referralCompanies,
        setReferralCompanies,
        resumes,
        userInfo
    } = useData();

    // Determine if user has elevated privileges (Referrer and above)
    // UserRoles: Guest=0, Member=1, Referrer=2, Volunteer=3, Lead=4, Admin=5
    const isLeadOrAdmin = userRole && parseInt(userRole) >= 2;
    const isMember = userRole && parseInt(userRole) === 1; // Only Members can request referrals
    const isReferrer = userRole && parseInt(userRole) === 2; // Referrer role

    // State for view toggle
    const [viewMode, setViewMode] = useState('companies'); // 'companies', 'my-requests', or 'all-requests'
    const [allReferrals, setAllReferrals] = useState([]);
    const [loadingAllReferrals, setLoadingAllReferrals] = useState(false);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedReferralIds, setSelectedReferralIds] = useState([]);
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);
    const [copiedField, setCopiedField] = useState(null); // Track which field was copied

    const [referralCompanyId, setReferralCompanyId] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [myReferralsFeedbackCount, setMyReferralsFeedbackCount] = useState(0);

    // Memoized callback to prevent unnecessary re-renders
    const handleFeedbackCount = useCallback((count) => {
        setMyReferralsFeedbackCount(count);
    }, []);

    // Filters for All Requests view
    const [statusFilter, setStatusFilter] = useState('Pending'); // Default to Pending
    const [companyFilter, setCompanyFilter] = useState('');
    const [memberFilter, setMemberFilter] = useState('');

    // Check if user is authenticated
    useEffect(() => {
        if (!accessToken) {
            setShowSignInPrompt(true);
        }
    }, [accessToken]);

    // Fetch all referrals for Lead/Admin users
    const fetchAllReferrals = useCallback(async () => {
        if (!isLeadOrAdmin) return;

        setLoadingAllReferrals(true);
        try {
            const response = await axiosInstance.get('/referrals/all', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setAllReferrals(response.data.referrals || []);
        } catch (error) {
            console.error('Error fetching all referrals:', error);
            setAllReferrals([]);
        } finally {
            setLoadingAllReferrals(false);
        }
    }, [isLeadOrAdmin, accessToken]);

    // Count pending referrals (Pending status)
    const pendingReferralsCount = allReferrals.filter(r => r && r.status === 'Pending').length;

    // Apply filters to all referrals
    const filteredAllReferrals = allReferrals.filter(referral => {
        if (!referral || !referral.status) return false;

        // Status filter
        if (statusFilter && referral.status !== statusFilter) return false;

        // Company filter (case-insensitive partial match)
        if (companyFilter && !referral.company.name.toLowerCase().includes(companyFilter.toLowerCase())) return false;

        // Member filter (search in both name and email, case-insensitive)
        if (memberFilter) {
            const searchTerm = memberFilter.toLowerCase();
            const nameMatch = referral.user_name?.toLowerCase().includes(searchTerm);
            const emailMatch = referral.user_email?.toLowerCase().includes(searchTerm);
            if (!nameMatch && !emailMatch) return false;
        }

        return true;
    });

    // Handle export to Google Sheets
    const handleExportToSheets = async () => {
        setIsExporting(true);
        try {
            const response = await axiosInstance.post(
                '/referrals/export/google-sheets',
                { referral_ids: selectedReferralIds.length > 0 ? selectedReferralIds : null },
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );

            if (response.data.sheet_url) {
                // Open the sheet in a new tab
                window.open(response.data.sheet_url, '_blank');
                alert('Referrals exported successfully!');
            }
        } catch (error) {
            console.error('Error exporting to Google Sheets:', error);
            alert('Failed to export to Google Sheets. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    // Handle referral update from management modal
    const handleReferralUpdate = (updatedReferral) => {
        setAllReferrals(prev =>
            prev.map(ref => ref.id === updatedReferral.id ? updatedReferral : ref)
        );
    };

    // Handle inline status update
    const handleInlineStatusUpdate = async (referralId, newStatus) => {
        try {
            const response = await axiosInstance.patch(
                `/referrals/${referralId}`,
                {
                    status: newStatus,
                    review_note: '' // Empty note for inline updates
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.data.referral) {
                handleReferralUpdate(response.data.referral);
            }
        } catch (error) {
            console.error('Error updating referral status:', error);
            alert('Failed to update status. Please try again.');
        }
    };

    // Copy to clipboard function
    const copyToClipboard = async (text, fieldId) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldId);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Toggle referral selection for export
    const toggleReferralSelection = (referralId) => {
        setSelectedReferralIds(prev =>
            prev.includes(referralId)
                ? prev.filter(id => id !== referralId)
                : [...prev, referralId]
        );
    };

    useEffect(() => {
        // Fetch referral companies for member view
        if (referralCompanies.length === 0) {
            setReferralCompanies(mockReferralCompanies);
        }
        setFetchReferralCompanies(false);

        // Fetch all referrals if user is Lead/Admin and viewing all requests
        if (isLeadOrAdmin && viewMode === 'all-requests') {
            fetchAllReferrals();
        }
    }, [referralCompanies.length, setFetchReferralCompanies, setReferralCompanies, isLeadOrAdmin, viewMode, fetchAllReferrals]);

    // Helper function to check if all requirements are met
    const checkRequirementsMet = (company) => {
        const requirements = [];
        // Check actual resumes from context, not displayResumes which includes mock data
        if (company.referral_materials.resume) requirements.push(resumes.length !== 0);
        if (company.referral_materials.referralEssay) requirements.push(userInfo?.essay && userInfo.essay.trim() !== '');
        if (company.referral_materials.contact) requirements.push(userInfo?.contact && userInfo.contact.trim() !== '');

        if (requirements.length === 0) return 'No Requirements';
        const allMet = requirements.every(req => req);
        const someMet = requirements.some(req => req);

        if (allMet) return 'Ready';
        if (someMet) return 'Incomplete';
        return 'Pending';
    };

    // Filter referral companies
    const filteredCompanies = referralCompanies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900/50 transition-colors">
            {/* Ultra Compact Header */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between mb-2.5">
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-white mb-0.5 transition-colors">
                                Referrals
                            </h1>
                            <p className="text-xs text-gray-600 dark:text-gray-300 transition-colors">
                                {viewMode === 'companies'
                                    ? 'Browse companies and request employee referrals'
                                    : viewMode === 'my-requests'
                                        ? 'Track your referral requests and their status'
                                        : 'Manage all referral requests from members'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Modern View Toggle */}
                            <div className="inline-flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setViewMode('companies')}
                                    className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${viewMode === 'companies'
                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <span className="relative z-10">Companies</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('my-requests')}
                                    className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${viewMode === 'my-requests'
                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <span className="relative z-10">My Requests</span>
                                    {myReferralsFeedbackCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-[10px] font-bold bg-red-500 text-white rounded-full border-2 border-white dark:border-gray-800 shadow-sm">
                                            {myReferralsFeedbackCount}
                                        </span>
                                    )}
                                </button>
                                {isLeadOrAdmin && (
                                    <button
                                        onClick={() => setViewMode('all-requests')}
                                        className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${viewMode === 'all-requests'
                                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <span className="relative z-10">All Requests</span>
                                        {pendingReferralsCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-[10px] font-bold bg-red-500 text-white rounded-full border-2 border-white dark:border-gray-800 shadow-sm">
                                                {pendingReferralsCount}
                                            </span>
                                        )}
                                    </button>
                                )}
                            </div>

                            {viewMode === 'all-requests' && !loadingAllReferrals && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-md border border-blue-200 dark:border-blue-700/50 transition-colors">
                                    <DocumentTextIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    <div className="leading-none">
                                        <p className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 uppercase mb-0.5 transition-colors">Total Requests</p>
                                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 transition-colors">{allReferrals.length}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ultra Compact Statistics Cards - Only for Companies View */}
                    {!fetchReferralCompanies && viewMode === 'companies' && referralCompanies.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                            <div className="bg-white dark:bg-gray-800 rounded-md p-2 border border-emerald-100 dark:border-emerald-700/50 hover:border-emerald-200 dark:hover:border-emerald-600/50 hover:shadow-sm dark:hover:shadow-emerald-900/20 transition-all duration-200">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded transition-colors">
                                        <CheckBadgeIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="leading-none">
                                        <p className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400 mb-0.5 transition-colors">Ready</p>
                                        <p className="text-base font-semibold text-emerald-900 dark:text-white transition-colors">
                                            {referralCompanies.filter(c => checkRequirementsMet(c) === 'Ready').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-md p-2 border border-amber-100 dark:border-amber-700/50 hover:border-amber-200 dark:hover:border-amber-600/50 hover:shadow-sm dark:hover:shadow-amber-900/20 transition-all duration-200">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded transition-colors">
                                        <ClockIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="leading-none">
                                        <p className="text-[9px] font-medium text-amber-600 dark:text-amber-400 mb-0.5 transition-colors">Incomplete</p>
                                        <p className="text-base font-semibold text-amber-900 dark:text-white transition-colors">
                                            {referralCompanies.filter(c => checkRequirementsMet(c) === 'Incomplete').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-md p-2 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600/50 hover:shadow-sm dark:hover:shadow-gray-900/20 transition-all duration-200">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded transition-colors">
                                        <ArrowPathIcon className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div className="leading-none">
                                        <p className="text-[9px] font-medium text-gray-600 dark:text-gray-400 mb-0.5 transition-colors">Pending</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-white transition-colors">
                                            {referralCompanies.filter(c => checkRequirementsMet(c) === 'Pending').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-md p-2 border border-blue-100 dark:border-blue-700/50 hover:border-blue-200 dark:hover:border-blue-600/50 hover:shadow-sm dark:hover:shadow-blue-900/20 transition-all duration-200">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded transition-colors">
                                        <BuildingOfficeIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="leading-none">
                                        <p className="text-[9px] font-medium text-blue-600 dark:text-blue-400 mb-0.5 transition-colors">Total</p>
                                        <p className="text-base font-semibold text-blue-900 dark:text-white transition-colors">{referralCompanies.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {fetchReferralCompanies && (
                <div className="flex justify-center items-center h-64">
                    <Loading />
                </div>
            )}

            {/* Main Content */}
            {(!fetchReferralCompanies) && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                    {/* Companies View (for all users) */}
                    {viewMode === 'companies' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Search and Filter Bar */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 p-5 mb-6 transition-colors">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search companies..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all text-sm font-medium"
                                        />
                                    </div>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-all text-sm"
                                        >
                                            <FunnelIcon className="h-4 w-4" />
                                            <span className="hidden sm:inline">Clear</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Companies Table */}
                            {filteredCompanies.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 p-16 text-center transition-colors">
                                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-5 transition-colors">
                                        <BuildingOfficeIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
                                        {searchQuery ? 'No companies found' : 'No referral opportunities available'}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-300 max-w-sm mx-auto font-medium transition-colors">
                                        {searchQuery
                                            ? 'Try adjusting your search criteria'
                                            : 'Check back later for new referral opportunities'}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 overflow-hidden transition-colors">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 border-b border-gray-200 dark:border-gray-700 transition-colors">
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <BuildingOfficeIcon className="h-4 w-4" />
                                                            Company
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider transition-colors">
                                                        <div className="flex items-center gap-2">
                                                            <DocumentTextIcon className="h-4 w-4" />
                                                            Requirements
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {filteredCompanies.map((company, index) => (
                                                    <tr
                                                        key={company.id}
                                                        onClick={() => {
                                                            if (!isMember) return;
                                                            setSelectedCompany(company);
                                                            setReferralCompanyId(company.id);
                                                        }}
                                                        className={`hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 transition-all duration-150 group ${isMember ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                                        title={!isMember ? "Only Members can request referrals" : "Click to request referral"}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <img
                                                                    src={company.image}
                                                                    alt={company.name}
                                                                    className="h-10 w-10 rounded-lg object-cover border border-gray-200 group-hover:shadow-md transition-shadow"
                                                                />
                                                                <div className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                    {company.name}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-2">
                                                                {company.referral_materials.resume && (
                                                                    <div className="flex items-center gap-2">
                                                                        {resumes.length !== 0 ? (
                                                                            <CheckCircleIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                                        ) : (
                                                                            <XCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0" />
                                                                        )}
                                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Resume</span>
                                                                    </div>
                                                                )}
                                                                {company.referral_materials.referralEssay && (
                                                                    <div className="flex items-center gap-2">
                                                                        {userInfo?.essay && userInfo.essay.trim() !== '' ? (
                                                                            <CheckCircleIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                                        ) : (
                                                                            <XCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0" />
                                                                        )}
                                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Referral Essay</span>
                                                                    </div>
                                                                )}
                                                                {company.referral_materials.contact && (
                                                                    <div className="flex items-center gap-2">
                                                                        {userInfo?.contact && userInfo.contact.trim() !== '' ? (
                                                                            <CheckCircleIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                                        ) : (
                                                                            <XCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0" />
                                                                        )}
                                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Contact</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => {
                                                                    if (!isMember) return;
                                                                    setSelectedCompany(company);
                                                                    setReferralCompanyId(company.id);
                                                                }}
                                                                disabled={!isMember}
                                                                title={!isMember ? "Only Members can request referrals" : ""}
                                                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${isMember
                                                                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 active:scale-95 cursor-pointer'
                                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                Request Referral
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* My Requests View (for all authenticated users) */}
                    {viewMode === 'my-requests' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <MyReferrals onFeedbackCount={handleFeedbackCount} />
                        </div>
                    )}

                    {/* All Requests View (for Lead/Admin) */}
                    {viewMode === 'all-requests' && isLeadOrAdmin && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Filters */}
                            <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                                <div className="flex items-center gap-4 flex-wrap">
                                    {/* Status Filter - Hidden for Referrers */}
                                    {!isReferrer && (
                                        <div className="flex-1 min-w-[180px]">
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                                Status
                                            </label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="Pending">Pending</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Declined">Declined</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Company Filter */}
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                            Company
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Search company..."
                                            value={companyFilter}
                                            onChange={(e) => setCompanyFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                        />
                                    </div>

                                    {/* Member Filter */}
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                            Member
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Search member..."
                                            value={memberFilter}
                                            onChange={(e) => setMemberFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                        />
                                    </div>

                                    {/* Clear Filters */}
                                    {((!isReferrer && statusFilter !== 'Pending') || companyFilter || memberFilter) && (
                                        <div className="flex items-end">
                                            <button
                                                onClick={() => {
                                                    setStatusFilter('Pending');
                                                    setCompanyFilter('');
                                                    setMemberFilter('');
                                                }}
                                                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                                            >
                                                Clear Filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Export Controls */}
                            {filteredAllReferrals.length > 0 && (
                                <>
                                    {/* Tip Banner */}
                                    <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-1">Quick Tip</h4>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    You can update the status directly in the table. To leave feedback notes, click <span className="font-semibold">"View Details"</span> and add your note before updating.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4 flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <BellAlertIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                {pendingReferralsCount} pending request{pendingReferralsCount !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {selectedReferralIds.length > 0 && (
                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                    {selectedReferralIds.length} selected
                                                </span>
                                            )}
                                            <button
                                                onClick={handleExportToSheets}
                                                disabled={isExporting}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                            >
                                                {isExporting ? (
                                                    <>
                                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                        Exporting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                                        Export to Sheets
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 overflow-hidden transition-colors">
                                {loadingAllReferrals ? (
                                    <div className="flex justify-center items-center h-64">
                                        <Loading />
                                    </div>
                                ) : filteredAllReferrals.length === 0 ? (
                                    <div className="p-16 text-center">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                            <DocumentTextIcon className="h-10 w-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            {allReferrals.length === 0 ? 'No referral requests yet' : 'No referrals match your filters'}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-300 max-w-sm mx-auto font-medium">
                                            {allReferrals.length === 0
                                                ? 'Referral requests from members will appear here'
                                                : 'Try adjusting your filters to see more results'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                                    <th className="px-3 py-4 text-left">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedReferralIds.length === filteredAllReferrals.length && filteredAllReferrals.length > 0}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedReferralIds(filteredAllReferrals.map(r => r.id));
                                                                } else {
                                                                    setSelectedReferralIds([]);
                                                                }
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                                                        />
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Company
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Position
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Member
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Contact
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {filteredAllReferrals.map((referral) => (
                                                    <tr
                                                        key={referral.id}
                                                        className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all duration-150"
                                                    >
                                                        <td className="px-3 py-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedReferralIds.includes(referral.id)}
                                                                onChange={() => toggleReferralSelection(referral.id)}
                                                                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-10 w-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1.5 flex items-center justify-center flex-shrink-0">
                                                                    <img
                                                                        src={referral.company.image}
                                                                        alt={referral.company.name}
                                                                        className="h-full w-full object-contain"
                                                                    />
                                                                </div>
                                                                <span className="font-semibold text-gray-900 dark:text-white">{referral.company.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-white">{referral.job_title}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{referral.role}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{referral.user_name}</span>
                                                                    <button
                                                                        onClick={() => copyToClipboard(referral.user_name, `name-${referral.id}`)}
                                                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Copy name"
                                                                    >
                                                                        {copiedField === `name-${referral.id}` ? (
                                                                            <CheckCircleIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                                        ) : (
                                                                            <ClipboardDocumentIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{referral.user_email}</span>
                                                                    <button
                                                                        onClick={() => copyToClipboard(referral.user_email, `email-${referral.id}`)}
                                                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Copy email"
                                                                    >
                                                                        {copiedField === `email-${referral.id}` ? (
                                                                            <CheckCircleIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                                        ) : (
                                                                            <ClipboardDocumentIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {referral.contact ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-700 dark:text-gray-200">{referral.contact}</span>
                                                                    <button
                                                                        onClick={() => copyToClipboard(referral.contact, `contact-${referral.id}`)}
                                                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Copy contact"
                                                                    >
                                                                        {copiedField === `contact-${referral.id}` ? (
                                                                            <CheckCircleIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                                        ) : (
                                                                            <ClipboardDocumentIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">Not provided</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <select
                                                                value={referral.status}
                                                                onChange={(e) => handleInlineStatusUpdate(referral.id, e.target.value)}
                                                                className={`text-xs font-bold rounded-lg border-2 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${referral.status === 'Completed'
                                                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 focus:ring-emerald-500'
                                                                    : referral.status === 'Pending'
                                                                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 focus:ring-amber-500'
                                                                        : referral.status === 'Declined'
                                                                            ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 focus:ring-red-500'
                                                                            : referral.status === 'Cancelled'
                                                                                ? 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 focus:ring-gray-500'
                                                                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 focus:ring-blue-500'
                                                                    }`}
                                                            >
                                                                <option value="Pending">Pending</option>
                                                                <option value="Completed">Completed</option>
                                                                <option value="Declined">Declined</option>
                                                                <option value="Cancelled">Cancelled</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedReferral(referral);
                                                                    setIsManagementModalOpen(true);
                                                                }}
                                                                className="px-3 py-1.5 bg-blue-600 dark:bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
                                                            >
                                                                View Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Referral Create Modal */}
            {referralCompanyId && selectedCompany && (
                <ReferralCreate
                    company={selectedCompany}
                    setReferralCompanyId={setReferralCompanyId}
                />
            )}

            {/* Referral Management Modal (for Lead/Admin) */}
            {selectedReferral && isManagementModalOpen && (
                <ReferralManagement
                    referral={selectedReferral}
                    isOpen={isManagementModalOpen}
                    setIsOpen={setIsManagementModalOpen}
                    onUpdate={handleReferralUpdate}
                />
            )}

            <SignInPrompt
                isOpen={showSignInPrompt}
                onClose={() => setShowSignInPrompt(false)}
            />
        </div>
    )
}


export default Referrals;
