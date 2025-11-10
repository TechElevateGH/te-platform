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
    SparklesIcon,
    BellAlertIcon,
    ArrowDownTrayIcon
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

    // Determine if user has elevated privileges (Lead or Admin)
    // UserRoles: Guest=0, Member=1, Lead=2, Admin=3
    const isLeadOrAdmin = userRole && parseInt(userRole) >= 2;
    const isMember = userRole && parseInt(userRole) === 1; // Only Members can request referrals

    // State for view toggle
    const [viewMode, setViewMode] = useState('companies'); // 'companies', 'my-requests', or 'all-requests'
    const [allReferrals, setAllReferrals] = useState([]);
    const [loadingAllReferrals, setLoadingAllReferrals] = useState(false);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedReferralIds, setSelectedReferralIds] = useState([]);
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);

    const [referralCompanyId, setReferralCompanyId] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

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
                            {/* View Toggle */}
                            <div className="flex items-center gap-0.5 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 p-0.5 transition-colors">
                                <button
                                    onClick={() => setViewMode('companies')}
                                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${viewMode === 'companies'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    Companies
                                </button>
                                <button
                                    onClick={() => setViewMode('my-requests')}
                                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${viewMode === 'my-requests'
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    My Requests
                                </button>
                                {isLeadOrAdmin && (
                                    <button
                                        onClick={() => setViewMode('all-requests')}
                                        className={`px-2.5 py-1 rounded text-xs font-medium transition-all relative ${viewMode === 'all-requests'
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        All Requests
                                        {pendingReferralsCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 w-4 text-[10px] font-bold bg-red-500 text-white rounded-full border-2 border-white dark:border-gray-700 animate-pulse transition-colors">
                                                {pendingReferralsCount}
                                            </span>
                                        )}
                                    </button>
                                )}
                            </div>
                            {!fetchReferralCompanies && viewMode === 'companies' && referralCompanies.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-md border border-emerald-200 dark:border-emerald-700/50 transition-colors">
                                    <SparklesIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <div className="leading-none">
                                        <p className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-0.5 transition-colors">Available</p>
                                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 transition-colors">{referralCompanies.length}</p>
                                    </div>
                                </div>
                            )}
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
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredCompanies.map((company, index) => (
                                                    <tr
                                                        key={company.id}
                                                        className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 transition-all duration-150 group"
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
                                                        <td className="px-6 py-4 whitespace-nowrap">
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
                            <MyReferrals />
                        </div>
                    )}

                    {/* All Requests View (for Lead/Admin) */}
                    {viewMode === 'all-requests' && isLeadOrAdmin && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Filters */}
                            <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors">
                                <div className="flex items-center gap-4 flex-wrap">
                                    {/* Status Filter */}
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
                                    {(statusFilter !== 'Pending' || companyFilter || memberFilter) && (
                                        <div className="flex items-end">
                                            <button
                                                onClick={() => {
                                                    setStatusFilter('Pending');
                                                    setCompanyFilter('');
                                                    setMemberFilter('');
                                                }}
                                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                                            >
                                                Clear Filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Export Controls */}
                            {filteredAllReferrals.length > 0 && (
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
                                                        Member
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Company
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Role
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Job Title
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                        Date
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
                                                        className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all duration-150"
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
                                                            <div>
                                                                <div className="font-semibold text-gray-900 dark:text-white">{referral.user_name}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{referral.user_email}</div>
                                                            </div>
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
                                                            <span className="text-sm text-gray-700 dark:text-gray-200">{referral.role}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-700 dark:text-gray-200">{referral.job_title}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full ${referral.status === 'Completed'
                                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                                : referral.status === 'Pending'
                                                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                    : referral.status === 'Declined'
                                                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                                                        : referral.status === 'Canceled'
                                                                            ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                                                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                                }`}>
                                                                {referral.status === 'Pending' && (
                                                                    <span className="relative flex h-2 w-2">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                                    </span>
                                                                )}
                                                                {referral.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-sm text-gray-600 dark:text-gray-300">{referral.date}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedReferral(referral);
                                                                    setIsManagementModalOpen(true);
                                                                }}
                                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all"
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
