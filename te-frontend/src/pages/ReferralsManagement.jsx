import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import ReferralManagement from '../components/referral/ReferralManagement';
import { getCompanyLogoUrl, handleCompanyLogoError } from '../utils';
import {
    PlusIcon,
    BuildingOfficeIcon,
    ClockIcon,
    CheckCircleIcon,
    PaperAirplaneIcon,
    EyeIcon,
    XMarkIcon,
    AdjustmentsHorizontalIcon,
    ChartBarIcon,
    ArrowDownTrayIcon,
    PencilIcon
} from '@heroicons/react/24/outline';
import { ClipboardDocumentIcon } from '@heroicons/react/20/solid';

const ReferralsManagement = () => {
    const { accessToken, userRole } = useAuth();
    const { userInfo } = useData();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddCompany, setShowAddCompany] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // Empty = show all statuses
    const [memberFilter, setMemberFilter] = useState('');
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState(null);
    const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

    // Check if user is a referrer (role = 2) - use sessionStorage as fallback for immediate availability
    const storedRole = sessionStorage.getItem('userRole');
    const effectiveRole = userRole || parseInt(storedRole) || 0;
    const isReferrer = effectiveRole === 2;
    const isLead = effectiveRole >= 3; // Volunteers, Leads, Admins
    const isAdmin = effectiveRole >= 4; // Leads and Admins

    // Company filter - only initialize for non-referrers
    const [companyFilter, setCompanyFilter] = useState('');

    // Clear company filter immediately if user is a referrer
    useEffect(() => {
        if (isReferrer) {
            setCompanyFilter('');
        }
    }, [isReferrer]);

    // Show welcome message for referrers once per session and auto-hide after 3 seconds
    useEffect(() => {
        if (isReferrer) {
            const hasSeenWelcome = sessionStorage.getItem('hasSeenReferrerWelcome');
            if (!hasSeenWelcome) {
                setShowWelcomeMessage(true);
                sessionStorage.setItem('hasSeenReferrerWelcome', 'true');
                const timer = setTimeout(() => {
                    setShowWelcomeMessage(false);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }
    }, [isReferrer]);

    // Advanced Features State
    const [sortField, setSortField] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        company: true,
        jobTitle: true,
        member: true,
        phone_number: true,
        status: true,
        actions: true,
        email: false,
        resume: false,
        essay: false
    });

    // Tab Management
    const [activeTab, setActiveTab] = useState('referrals'); // 'referrals' or 'companies'
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showCompanyModal, setShowCompanyModal] = useState(false);

    // Column Management
    const toggleColumn = (column) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    const resetColumns = () => {
        setVisibleColumns({
            company: true,
            jobTitle: true,
            member: true,
            phone_number: true,
            status: true,
            actions: true,
            email: false,
            resume: false,
            essay: false
        });
    };

    const showAllColumns = () => {
        setVisibleColumns({
            company: true,
            jobTitle: true,
            member: true,
            email: true,
            phone_number: true,
            status: true,
            resume: true,
            essay: true,
            actions: true
        });
    };

    // Add Company Form
    const [companyForm, setCompanyForm] = useState({
        name: '',
        image: '',
        description: '',
        website: '',
        industry: '',
        size: '',
        headquarters: '',
        referral_link: '',
        requires_resume: true,
        requires_phone_number: true,
        requires_essay: true,
    });

    // Edit Company State
    const [showEditCompany, setShowEditCompany] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [editCompanyForm, setEditCompanyForm] = useState({
        name: '',
        image: '',
        description: '',
        website: '',
        industry: '',
        size: '',
        headquarters: '',
        referral_link: '',
        requires_resume: true,
        requires_phone_number: true,
        requires_essay: true,
    });

    // Fetch all referrals
    const fetchAllReferrals = useCallback(async () => {
        try {
            // Calculate role inside callback to avoid stale closure
            const currentRole = parseInt(userRole || sessionStorage.getItem('userRole') || '0');
            const currentIsReferrer = currentRole === 2;

            // Build endpoint: for referrers explicitly include company_id
            let endpoint = '/referrals';
            if (currentIsReferrer && userInfo?.company_id) {
                endpoint = `/referrals?company_id=${userInfo.company_id}`;
            }

            const response = await axiosInstance.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const rawReferrals = response.data?.referrals || [];
            const enriched = rawReferrals.map(r => ({
                ...r,
                submitted_date: r.submitted_date || r.date || '',
                has_resume: r.has_resume !== undefined ? r.has_resume : Boolean(r.resume),
                has_essay: r.has_essay !== undefined ? r.has_essay : Boolean(r.essay),
            }));
            setReferrals(enriched);
        } catch (error) {
            console.error('Error fetching referrals:', error);
            setReferrals([]);
        }
    }, [accessToken, userRole, userInfo?.company_id]);

    // Fetch all companies
    const fetchCompanies = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/referrals/companies', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setCompanies(response.data?.companies || []);
        } catch (error) {
            console.error('Error fetching companies:', error);
            setCompanies([]);
        }
    }, [accessToken]);

    // Unified initial + role-change fetch (runs when accessToken/role ready)
    useEffect(() => {
        if (!accessToken) return;

        // Wait for userRole to load from AuthContext (comes from localStorage on mount)
        if (!userRole && !sessionStorage.getItem('userRole')) return;

        const currentRole = parseInt(userRole || sessionStorage.getItem('userRole') || '0');
        const currentIsReferrer = currentRole === 2;
        const currentIsLead = currentRole >= 3;
        const currentIsAdmin = currentRole >= 4;

        setLoading(true);

        const run = async () => {
            try {
                if (currentIsReferrer || currentIsLead || currentIsAdmin) {
                    await fetchAllReferrals();
                    if (currentIsLead || currentIsAdmin) {
                        await fetchCompanies();
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [accessToken, userRole, userInfo?.company_id, fetchAllReferrals, fetchCompanies]);

    // Safety re-fetch: If initial render missed because role/userInfo wasn't ready yet
    useEffect(() => {
        if (!accessToken) return;
        if (isReferrer && userInfo?.company_id && referrals.length === 0 && !loading) {
            fetchAllReferrals();
        }
    }, [accessToken, isReferrer, userInfo?.company_id, referrals.length, loading, fetchAllReferrals]);

    // Refetch when company_id appears (covers race: referrals fetch ran before userInfo hydrated)
    useEffect(() => {
        if (isReferrer && accessToken && userInfo?.company_id && referrals.length === 0) {
            fetchAllReferrals();
        }
    }, [isReferrer, accessToken, userInfo?.company_id, referrals.length, fetchAllReferrals]);

    // Add new company
    const handleAddCompany = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/referrals/companies', companyForm, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setCompanyForm({
                name: '',
                referral_link: '',
                requires_resume: true,
                requires_phone_number: true,
                requires_essay: true,
            });
            setShowAddCompany(false);
            alert('Referral company added successfully!');
        } catch (error) {
            console.error('Error adding referral company:', error);
            alert('Failed to add referral company. Please try again.');
        }
    };

    // Handle opening edit company modal
    const handleEditCompanyOpen = (company) => {
        setEditingCompany(company);
        // Populate form with company data
        setEditCompanyForm({
            name: company.name || '',
            image: company.image || '',
            description: company.metadata?.description || '',
            website: company.domain || '',
            industry: company.metadata?.industry || '',
            size: company.metadata?.size || '',
            headquarters: company.metadata?.headquarters || '',
            referral_link: company.referral_link || '',
            requires_resume: company.referral_materials?.resume ?? true,
            requires_phone_number: company.referral_materials?.phone_number ?? true,
            requires_essay: company.referral_materials?.essay ?? true,
        });
        setShowEditCompany(true);
    };

    // Handle edit company submission
    const handleEditCompany = async (e) => {
        e.preventDefault();
        if (!editingCompany) return;

        try {
            await axiosInstance.patch(`/referrals/companies/${editingCompany.id}`, editCompanyForm, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setShowEditCompany(false);
            setEditingCompany(null);
            alert('Company updated successfully!');
        } catch (error) {
            console.error('Error updating company:', error);
            alert(error.response?.data?.detail || 'Failed to update company. Please try again.');
        }
    };


    // Handle referral update from modal
    // Handle referral update from modal
    const handleReferralUpdate = (updatedReferral) => {
        setReferrals(prevReferrals =>
            prevReferrals.map(ref =>
                ref.id === updatedReferral.id ? updatedReferral : ref
            )
        );
    };

    // Handle inline status update
    const handleInlineStatusUpdate = async (referralId, newStatus) => {
        try {
            const response = await axiosInstance.patch(
                `/referrals/${referralId}`,
                { status: newStatus },
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
    const copyToClipboard = async (text, fieldName) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Filter referrals
    const filteredReferrals = referrals.filter(ref => {
        const matchesSearch = !searchQuery ||
            ref.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ref.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ref.job_title?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = !statusFilter || ref.status === statusFilter;

        const matchesMember = !memberFilter ||
            ref.user_name?.toLowerCase().includes(memberFilter.toLowerCase()) ||
            ref.user_email?.toLowerCase().includes(memberFilter.toLowerCase());

        // Only apply company filter for non-referrers
        const matchesCompany = isReferrer || !companyFilter ||
            ref.company?.name?.toLowerCase().includes(companyFilter.toLowerCase());

        const matchesDateRange = (!dateRange.start || new Date(ref.submitted_date) >= new Date(dateRange.start)) &&
            (!dateRange.end || new Date(ref.submitted_date) <= new Date(dateRange.end));

        return matchesSearch && matchesStatus && matchesMember && matchesCompany && matchesDateRange;
    });

    // Sorting logic
    const sortedReferrals = [...filteredReferrals].sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
            case 'date':
                comparison = new Date(a.submitted_date || 0) - new Date(b.submitted_date || 0);
                break;
            case 'company':
                comparison = (a.company?.name || '').localeCompare(b.company?.name || '');
                break;
            case 'member':
                comparison = (a.user_name || '').localeCompare(b.user_name || '');
                break;
            case 'status':
                comparison = (a.status || '').localeCompare(b.status || '');
                break;
            default:
                comparison = 0;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });


    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setMemberFilter('');
        if (!isReferrer) {
            setCompanyFilter('');
        }
        setDateRange({ start: '', end: '' });
    };

    // CSV Export
    const exportToCSV = () => {
        const headers = ['Company', 'Job Title', 'Member', 'Email', 'Phone Number', 'Status', 'Resume', 'Essay'];
        const rows = sortedReferrals.map(ref => [
            ref.company?.name || '',
            ref.job_title || '',
            ref.user_name || '',
            ref.user_email || '',
            ref.phone_number || '',
            ref.status || '',
            ref.has_resume ? 'Yes' : 'No',
            ref.has_essay ? 'Yes' : 'No'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `referrals_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Statistics
    const stats = {
        total: referrals.length,
        pending: referrals.filter(r => r?.status === 'Pending').length,
        approved: referrals.filter(r => r?.status === 'Approved').length,
        declined: referrals.filter(r => r?.status === 'Declined').length,
        completed: referrals.filter(r => r?.status === 'Completed').length,
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loading />
            </div>
        );
    }

    return (
        <div className="min-h-screen h-full bg-gray-50 dark:bg-gray-900 transition-colors pb-20 md:pb-4 overflow-x-hidden">
            {/* Compact Sticky Header */}
            <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                <div className="max-w-7xl mx-auto px-3 md:px-4 py-2 md:py-3">
                    {/* Title and Actions Row */}
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        {/* Left: Title */}
                        <div className="flex-shrink-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-base md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <PaperAirplaneIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                                    <span className="hidden sm:inline">Referral Management</span>
                                    <span className="sm:hidden">Referrals</span>
                                </h1>
                                {/* Company Pill for Referrers */}
                                {isReferrer && userInfo?.company_name && (
                                    <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg text-xs md:text-sm">
                                        <BuildingOfficeIcon className="h-3 w-3 md:h-4 md:w-4" />
                                        <span className="font-semibold">
                                            {userInfo.company_name}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <p className="text-left text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">
                                {isReferrer ? 'View and manage referral requests for your company' : 'Process member referral requests and manage companies'}
                            </p>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 overflow-x-auto">
                            {/* Column Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                                    className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                                >
                                    <AdjustmentsHorizontalIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                    <span className="hidden sm:inline">Columns</span>
                                </button>
                                {showColumnSelector && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-3 z-50">
                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                                            <span className="text-left text-xs font-bold text-gray-900 dark:text-white">Visible Columns</span>
                                            <button onClick={() => setShowColumnSelector(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                <XMarkIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {Object.keys(visibleColumns).map(col => (
                                                <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns[col]}
                                                        onChange={() => toggleColumn(col)}
                                                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-left text-sm text-gray-700 dark:text-gray-300 capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <button onClick={resetColumns} className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500">Reset</button>
                                            <button onClick={showAllColumns} className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700">Show All</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Export CSV */}
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-1.5 text-[10px] md:text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                            >
                                <ArrowDownTrayIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                <span className="hidden sm:inline">Export</span>
                            </button>

                            {/* Add Company Button - Only for non-referrers */}
                            {!isReferrer && (
                                <button
                                    onClick={() => setShowAddCompany(true)}
                                    className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[10px] md:text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30 whitespace-nowrap"
                                >
                                    <PlusIcon className="h-3 w-3 md:h-3.5 md:w-3.5" />
                                    <span className="hidden sm:inline">Add Company</span>
                                    <span className="sm:hidden">Add</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Welcome Message for Referrers */}
            {isReferrer && showWelcomeMessage && (
                <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 md:px-6 py-3 md:py-4 rounded-lg shadow-2xl border-2 border-blue-400 max-w-md w-full pointer-events-auto">
                        <div className="flex items-start gap-2 md:gap-3">
                            <div className="flex-1">
                                <h3 className="font-bold text-base md:text-lg mb-1">Thank You! 🎉</h3>
                                <p className="text-xs md:text-sm text-blue-50">
                                    Thank you for referring members of our community. We greatly appreciate you!
                                </p>
                            </div>
                            <button
                                onClick={() => setShowWelcomeMessage(false)}
                                className="text-white/80 hover:text-white transition-colors flex-shrink-0"
                            >
                                <XMarkIcon className="h-4 w-4 md:h-5 md:w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-3 md:px-4 py-2 md:py-3">

                {/* Tabs - Only for Lead+ users */}
                {(isLead || isAdmin) && (
                    <div className="mb-3">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('referrals')}
                                    className={`${activeTab === 'referrals'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                        } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Member Referrals
                                </button>
                                <button
                                    onClick={() => setActiveTab('companies')}
                                    className={`${activeTab === 'companies'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                        } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    Companies
                                </button>
                            </nav>
                        </div>
                    </div>
                )}

                {/* Stats + Filters for Member Referrals Tab */}
                {activeTab === 'referrals' && (
                    <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2 md:p-2.5 mb-3 transition-colors">
                        {/* Stats Section - Mobile: Full Width, Desktop: Side by Side */}
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
                            {/* Stats - Horizontal scroll on mobile */}
                            <div className="flex items-center gap-2 md:gap-2.5 text-[10px] md:text-xs flex-shrink-0 pb-1 overflow-x-auto">
                                {!isReferrer && (
                                    <>
                                        <div className="flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
                                            <ChartBarIcon className="h-3 w-3 md:h-3.5 md:w-3.5 text-gray-400 dark:text-gray-500" />
                                            <span className="text-gray-500 dark:text-gray-400">Total:</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{stats.total}</span>
                                        </div>
                                        <div className="h-3 w-px bg-gray-300 dark:bg-gray-600"></div>
                                    </>
                                )}
                                <div className="flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
                                    <ClockIcon className="h-3 w-3 md:h-3.5 md:w-3.5 text-yellow-500" />
                                    <span className="text-gray-500 dark:text-gray-400">Pending:</span>
                                    <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</span>
                                </div>
                                <div className="h-3 w-px bg-gray-300 dark:bg-gray-600"></div>
                                <div className="flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
                                    <CheckCircleIcon className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-500" />
                                    <span className="text-gray-500 dark:text-gray-400">Completed:</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{stats.completed}</span>
                                </div>
                            </div>

                            {/* Vertical Divider - Hidden on mobile and for referrers */}
                            {!isReferrer && <div className="hidden md:block h-8 w-px bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>}

                            {/* Filters Section - Only for non-referrers */}
                            {!isReferrer && (
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-12 gap-2 items-end">
                                    {/* Status Filter */}
                                    <div className="col-span-1 md:col-span-2">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full px-2 md:px-2.5 py-1.5 text-[10px] md:text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                                        >
                                            <option value="">All Status</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Declined">Declined</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    {/* Member Filter */}
                                    <div className="col-span-1 md:col-span-4">
                                        <input
                                            type="text"
                                            placeholder="Member..."
                                            value={memberFilter}
                                            onChange={(e) => setMemberFilter(e.target.value)}
                                            className="w-full px-2 md:px-2.5 py-1.5 text-[10px] md:text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                                        />
                                    </div>

                                    {/* Company Filter */}
                                    <div className="col-span-1 md:col-span-3">
                                        <input
                                            type="text"
                                            placeholder="Company..."
                                            value={companyFilter}
                                            onChange={(e) => setCompanyFilter(e.target.value)}
                                            className="w-full px-2 md:px-2.5 py-1.5 text-[10px] md:text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                                        />
                                    </div>




                                    {/* Date Range Toggle */}
                                    <div className="col-span-2 md:col-span-1">
                                        <button
                                            onClick={() => setShowDateFilter(!showDateFilter)}
                                            className={`w-full px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-sm border ${showDateFilter || dateRange.start || dateRange.end ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'} rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1`}
                                            title="Date Range Filter"
                                        >
                                            <span>📅</span>
                                            <span className="hidden sm:inline text-xs">Date</span>
                                            {(dateRange.start || dateRange.end) && <span className="text-xs">●</span>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Simple Filters for Referrers - Just Status and Member */}
                            {isReferrer && (
                                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                    {/* Status Filter */}
                                    <div className="flex-1">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
                                        >
                                            <option value="">All Status</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>

                                    {/* Member Filter */}
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Search by member name..."
                                            value={memberFilter}
                                            onChange={(e) => setMemberFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date Range - Collapsible Section - Only for non-referrers */}
                        {!isReferrer && showDateFilter && (
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <div className="md:col-span-6">
                                    <label className="block text-left text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        Date Range
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                            placeholder="Start date"
                                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                                        />
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                            placeholder="End date"
                                            className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Filters & Clear - Simplified for referrers */}
                        {(searchQuery || statusFilter || memberFilter || (!isReferrer && (companyFilter || dateRange.start || dateRange.end))) && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-left text-xs text-gray-500 dark:text-gray-400">Active:</span>
                                    {statusFilter && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                            Status: {statusFilter}
                                        </span>
                                    )}
                                    {memberFilter && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                            Member: {memberFilter}
                                        </span>
                                    )}
                                    {!isReferrer && companyFilter && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                            Company: {companyFilter}
                                        </span>
                                    )}
                                    {!isReferrer && (dateRange.start || dateRange.end) && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                            Date: {dateRange.start || '...'} to {dateRange.end || '...'}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={clearAllFilters}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                    <XMarkIcon className="h-3 w-3" />
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Referrals Table - Desktop / Cards - Mobile */}
                {activeTab === 'referrals' && (
                    <>
                        {/* Desktop Table View - Hidden on mobile */}
                        <div className="hidden md:block bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-700/50 border-b border-gray-200 dark:border-gray-600 transition-colors">
                                            {visibleColumns.company && (
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Company
                                                </th>
                                            )}
                                            {visibleColumns.jobTitle && (
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Position
                                                </th>
                                            )}
                                            {visibleColumns.member && (
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Member
                                                </th>
                                            )}
                                            {visibleColumns.email && (
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Email
                                                </th>
                                            )}
                                            {visibleColumns.phone_number && (
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Phone Number
                                                </th>
                                            )}
                                            {visibleColumns.status && (
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            )}
                                            {visibleColumns.resume && (
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Resume
                                                </th>
                                            )}
                                            {visibleColumns.essay && (
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Essay
                                                </th>
                                            )}
                                            {visibleColumns.actions && (
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 transition-colors">
                                        {sortedReferrals.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No referral requests found
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedReferrals.map((ref) => (
                                                <tr
                                                    key={ref.id}
                                                    className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-gray-700/30 dark:hover:to-gray-600/30 transition-all"
                                                >
                                                    {visibleColumns.company && (
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded border border-gray-200 dark:border-gray-600 bg-white p-0.5 flex-shrink-0">
                                                                    <img
                                                                        src={getCompanyLogoUrl(ref.company?.name)}
                                                                        alt={ref.company?.name}
                                                                        className="h-full w-full object-contain"
                                                                        onError={handleCompanyLogoError}
                                                                    />
                                                                </div>
                                                                <span className="text-left font-medium text-gray-900 dark:text-white text-sm">
                                                                    {ref.company?.name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.jobTitle && (
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <div className="text-left font-semibold text-gray-900 dark:text-white text-sm">{ref.job_title}</div>
                                                                <div className="text-left text-xs text-gray-500 dark:text-gray-400">{ref.role}</div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.member && (
                                                        <td className="px-4 py-3">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-left font-medium text-gray-900 dark:text-white text-sm">{ref.user_name}</span>
                                                                    <button
                                                                        onClick={() => copyToClipboard(ref.user_name, `name-${ref.id}`)}
                                                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Copy name"
                                                                    >
                                                                        {copiedField === `name-${ref.id}` ? (
                                                                            <CheckCircleIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                                        ) : (
                                                                            <ClipboardDocumentIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-left text-xs text-gray-600 dark:text-gray-400">{ref.user_email}</span>
                                                                    <button
                                                                        onClick={() => copyToClipboard(ref.user_email, `email-${ref.id}`)}
                                                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Copy email"
                                                                    >
                                                                        {copiedField === `email-${ref.id}` ? (
                                                                            <CheckCircleIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                                        ) : (
                                                                            <ClipboardDocumentIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.email && (
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-left text-xs text-gray-600 dark:text-gray-400">{ref.user_email}</span>
                                                                <button
                                                                    onClick={() => copyToClipboard(ref.user_email, `email-standalone-${ref.id}`)}
                                                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Copy email"
                                                                >
                                                                    {copiedField === `email-standalone-${ref.id}` ? (
                                                                        <CheckCircleIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                                    ) : (
                                                                        <ClipboardDocumentIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.phone_number && (
                                                        <td className="px-4 py-3">
                                                            {ref.phone_number ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-left text-sm text-gray-700 dark:text-gray-200">{ref.phone_number}</span>
                                                                    <button
                                                                        onClick={() => copyToClipboard(ref.phone_number, `phone-${ref.id}`)}
                                                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Copy phone number"
                                                                    >
                                                                        {copiedField === `phone-${ref.id}` ? (
                                                                            <CheckCircleIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                                        ) : (
                                                                            <ClipboardDocumentIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span className="text-left text-xs text-gray-400 dark:text-gray-500 italic">Not provided</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    {visibleColumns.status && (
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-start">
                                                                <select
                                                                    value={ref.status}
                                                                    onChange={(e) => handleInlineStatusUpdate(ref.id, e.target.value)}
                                                                    className={`text-xs font-bold rounded-lg border-2 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${ref.status === 'Completed'
                                                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 focus:ring-emerald-500'
                                                                        : ref.status === 'Pending'
                                                                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700 focus:ring-amber-500'
                                                                            : ref.status === 'Declined'
                                                                                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 focus:ring-red-500'
                                                                                : ref.status === 'Cancelled'
                                                                                    ? 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 focus:ring-gray-500'
                                                                                    : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 focus:ring-blue-500'
                                                                        }`}
                                                                >
                                                                    <option value="Pending">Pending</option>
                                                                    <option value="Completed">Completed</option>
                                                                    {!isReferrer && <option value="Declined">Declined</option>}
                                                                    {!isReferrer && <option value="Cancelled">Cancelled</option>}
                                                                </select>
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.resume && (
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-start">
                                                                {ref.has_resume ? (
                                                                    <span className="inline-block px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                                                                        Yes
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-block px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
                                                                        No
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.essay && (
                                                        <td className="px-4 py-3">
                                                            <div className="flex justify-start">
                                                                {ref.has_essay ? (
                                                                    <span className="inline-block px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 rounded">
                                                                        Yes
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-block px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
                                                                        No
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {visibleColumns.actions && (
                                                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-start gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedReferral(ref);
                                                                        setIsManagementModalOpen(true);
                                                                    }}
                                                                    className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                                >
                                                                    <EyeIcon className="h-3.5 w-3.5" />
                                                                    View
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Card View - Hidden on desktop */}
                        <div className="md:hidden space-y-2.5">
                            {sortedReferrals.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No referral requests found</p>
                                </div>
                            ) : (
                                sortedReferrals.map((ref) => (
                                    <div
                                        key={ref.id}
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        {/* Compact Header */}
                                        <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                                            {visibleColumns.company && (
                                                <div className="h-9 w-9 rounded border border-gray-200 dark:border-gray-600 bg-white p-1 flex-shrink-0">
                                                    <img
                                                        src={getCompanyLogoUrl(ref.company?.name)}
                                                        alt={ref.company?.name}
                                                        className="h-full w-full object-contain"
                                                        onError={handleCompanyLogoError}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                    {ref.job_title}
                                                </h3>
                                                {visibleColumns.company && (
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                        {ref.company?.name}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Compact Status Badge */}
                                            {visibleColumns.status && (
                                                <select
                                                    value={ref.status}
                                                    onChange={(e) => handleInlineStatusUpdate(ref.id, e.target.value)}
                                                    className={`text-[9px] font-bold rounded-md px-2 py-1 focus:outline-none border ${ref.status === 'Completed'
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                                                        : ref.status === 'Pending'
                                                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                                                            : ref.status === 'Declined'
                                                                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                                                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                                                        }`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Completed">Completed</option>
                                                    {!isReferrer && <option value="Declined">Declined</option>}
                                                    {!isReferrer && <option value="Cancelled">Cancelled</option>}
                                                </select>
                                            )}
                                        </div>

                                        {/* Compact Body */}
                                        <div className="px-3 py-2.5">
                                            {/* Member Info - Condensed */}
                                            {visibleColumns.member && (
                                                <div className="space-y-1 mb-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Member</span>
                                                        <span className="text-xs font-semibold text-gray-900 dark:text-white truncate ml-2">
                                                            {ref.user_name}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Email</span>
                                                        <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate ml-2">
                                                            {ref.user_email}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Phone & Materials - Compact */}
                                            {(visibleColumns.phone_number || visibleColumns.resume || visibleColumns.essay) && (
                                                <div className="flex items-center gap-3 py-2 mb-2.5 border-y border-gray-100 dark:border-gray-700">
                                                    {visibleColumns.phone_number && ref.phone_number && (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">📱</span>
                                                            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                                                                {ref.phone_number}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {visibleColumns.resume && (
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-xs ${ref.has_resume ? 'text-green-600 dark:text-green-400' : 'text-gray-300 dark:text-gray-600'}`}>
                                                                📄
                                                            </span>
                                                            <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400">
                                                                {ref.has_resume ? 'Resume' : 'No Resume'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {visibleColumns.essay && (
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-xs ${ref.has_essay ? 'text-purple-600 dark:text-purple-400' : 'text-gray-300 dark:text-gray-600'}`}>
                                                                ✍️
                                                            </span>
                                                            <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400">
                                                                {ref.has_essay ? 'Essay' : 'No Essay'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Glassy View Button */}
                                            {visibleColumns.actions && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedReferral(ref);
                                                        setIsManagementModalOpen(true);
                                                    }}
                                                    className="w-full px-3 py-2 bg-gradient-to-r from-blue-500/90 to-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold rounded-md shadow-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-1.5 border border-blue-400/20"
                                                >
                                                    <EyeIcon className="h-3.5 w-3.5" />
                                                    View Details
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}                {/* Companies Table - Only for Lead+ */}
                {activeTab === 'companies' && (isLead || isAdmin) && (
                    <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-700/50 border-b border-gray-200 dark:border-gray-600 transition-colors">
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Company
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Referral Link
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Requirements
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {companies.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No companies found
                                            </td>
                                        </tr>
                                    ) : (
                                        companies.map((company) => (
                                            <tr
                                                key={company.id}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setSelectedCompany(company);
                                                    setShowCompanyModal(true);
                                                }}
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {company.image && (
                                                            <img
                                                                src={company.image}
                                                                alt={company.name}
                                                                className="h-8 w-8 rounded object-cover"
                                                            />
                                                        )}
                                                        <div className="flex justify-start">
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {company.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-start">
                                                        {company.referral_link ? (
                                                            <a
                                                                href={company.referral_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs"
                                                            >
                                                                {company.referral_link}
                                                            </a>
                                                        ) : (
                                                            <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex justify-start gap-1 flex-wrap">
                                                        {company.referral_materials?.requires_resume && (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                                Resume
                                                            </span>
                                                        )}
                                                        {company.referral_materials?.requires_essay && (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                                                Essay
                                                            </span>
                                                        )}
                                                        {company.referral_materials?.requires_phone_number && (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                                                Phone
                                                            </span>
                                                        )}
                                                        {!company.referral_materials?.requires_resume &&
                                                            !company.referral_materials?.requires_essay &&
                                                            !company.referral_materials?.requires_phone_number && (
                                                                <span className="text-sm text-gray-400 dark:text-gray-500">None</span>
                                                            )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex justify-start">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditCompanyOpen(company);
                                                            }}
                                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Results Count */}
                {sortedReferrals.length > 0 && (
                    <div className="mt-3 text-center text-sm text-gray-600 dark:text-gray-400">
                        Showing {sortedReferrals.length} of {referrals.length} referral requests
                    </div>
                )}
            </div>

            {/* Add Company Modal */}
            {showAddCompany && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-3 rounded-t-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BuildingOfficeIcon className="h-5 w-5" />
                                    <h2 className="text-base font-bold">Add New Referral Company</h2>
                                </div>
                                <button
                                    onClick={() => setShowAddCompany(false)}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleAddCompany} className="p-4 space-y-3">
                            {/* Company Name */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={companyForm.name}
                                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="e.g., Google, Microsoft"
                                />
                                <p className="mt-1 text-left text-xs text-gray-500 dark:text-gray-400">
                                    Enter the full company name
                                </p>
                            </div>

                            {/* Referral Link */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Referral Link
                                </label>
                                <input
                                    type="url"
                                    value={companyForm.referral_link}
                                    onChange={(e) => setCompanyForm({ ...companyForm, referral_link: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="https://company.com/referral-portal"
                                />
                                <p className="mt-1 text-left text-xs text-gray-500 dark:text-gray-400">
                                    Optional: Direct link to company's referral portal
                                </p>
                            </div>

                            {/* Referral Requirements */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                    Referral Requirements
                                </label>
                                <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded p-2.5 space-y-1.5">
                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-white dark:hover:bg-gray-700 p-1.5 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={companyForm.requires_resume}
                                            onChange={(e) => setCompanyForm({ ...companyForm, requires_resume: e.target.checked })}
                                            className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600"
                                        />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">Resume</span>
                                    </label>

                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-white dark:hover:bg-gray-700 p-1.5 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={companyForm.requires_phone_number}
                                            onChange={(e) => setCompanyForm({ ...companyForm, requires_phone_number: e.target.checked })}
                                            className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600"
                                        />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">Phone Number</span>
                                    </label>

                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-white dark:hover:bg-gray-700 p-1.5 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={companyForm.requires_essay}
                                            onChange={(e) => setCompanyForm({ ...companyForm, requires_essay: e.target.checked })}
                                            className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600"
                                        />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">Referral Essay</span>
                                    </label>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="submit"
                                    className="flex-1 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded transition-all"
                                >
                                    Add Company
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddCompany(false)}
                                    className="px-4 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Company Modal */}
            {showCompanyModal && selectedCompany && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-t-lg sticky top-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {selectedCompany.image && (
                                        <img
                                            src={selectedCompany.image}
                                            alt={selectedCompany.name}
                                            className="h-10 w-10 rounded object-cover"
                                        />
                                    )}
                                    <h2 className="text-lg font-bold">{selectedCompany.name}</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            handleEditCompanyOpen(selectedCompany);
                                            setShowCompanyModal(false);
                                        }}
                                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                        title="Edit Company"
                                    >
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowCompanyModal(false);
                                            setSelectedCompany(null);
                                        }}
                                        className="text-white/80 hover:text-white transition-colors"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Referral Link - Always show */}
                            <div>
                                <h3 className="text-left text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Referral Link</h3>
                                {selectedCompany.referral_link ? (
                                    <a
                                        href={selectedCompany.referral_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-left text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                                    >
                                        {selectedCompany.referral_link}
                                    </a>
                                ) : (
                                    <p className="text-left text-sm text-gray-500 dark:text-gray-400">Not provided</p>
                                )}
                            </div>

                            {/* Requirements - Always show */}
                            <div>
                                <h3 className="text-left text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Required Materials</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {selectedCompany.referral_materials?.requires_resume && (
                                        <span className="px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                            Resume
                                        </span>
                                    )}
                                    {selectedCompany.referral_materials?.requires_essay && (
                                        <span className="px-3 py-1 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                            Essay
                                        </span>
                                    )}
                                    {selectedCompany.referral_materials?.requires_phone_number && (
                                        <span className="px-3 py-1 text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                            Phone Number
                                        </span>
                                    )}
                                    {!selectedCompany.referral_materials?.requires_resume &&
                                        !selectedCompany.referral_materials?.requires_essay &&
                                        !selectedCompany.referral_materials?.requires_phone_number && (
                                            <span className="text-left text-sm text-gray-500 dark:text-gray-400">No special requirements</span>
                                        )}
                                </div>
                            </div>

                            {/* Description */}
                            {selectedCompany.description && (
                                <div>
                                    <h3 className="text-left text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                                    <p className="text-left text-sm text-gray-600 dark:text-gray-400">{selectedCompany.description}</p>
                                </div>
                            )}

                            {/* Company Details Grid */}
                            {(selectedCompany.metadata?.industry || selectedCompany.metadata?.size || selectedCompany.metadata?.headquarters) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Industry */}
                                    {selectedCompany.metadata?.industry && (
                                        <div>
                                            <h3 className="text-left text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Industry</h3>
                                            <p className="text-left text-sm text-gray-600 dark:text-gray-400">{selectedCompany.metadata.industry}</p>
                                        </div>
                                    )}

                                    {/* Size */}
                                    {selectedCompany.metadata?.size && (
                                        <div>
                                            <h3 className="text-left text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Company Size</h3>
                                            <p className="text-left text-sm text-gray-600 dark:text-gray-400">{selectedCompany.metadata.size}</p>
                                        </div>
                                    )}

                                    {/* Headquarters */}
                                    {selectedCompany.metadata?.headquarters && (
                                        <div>
                                            <h3 className="text-left text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Headquarters</h3>
                                            <p className="text-left text-sm text-gray-600 dark:text-gray-400">{selectedCompany.metadata.headquarters}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Company Modal */}
            {showEditCompany && editingCompany && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-3 rounded-t-lg sticky top-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BuildingOfficeIcon className="h-5 w-5" />
                                    <h2 className="text-base font-bold">Edit Company: {editingCompany.name}</h2>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowEditCompany(false);
                                        setEditingCompany(null);
                                    }}
                                    className="text-white/80 hover:text-white transition-colors"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleEditCompany} className="p-4 space-y-3">
                            {/* Company Name */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    value={editCompanyForm.name}
                                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, name: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="e.g., Google, Microsoft"
                                />
                            </div>

                            {/* Website */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={editCompanyForm.website}
                                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, website: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="https://company.com"
                                />
                            </div>

                            {/* Referral Link */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                    Referral Link
                                </label>
                                <input
                                    type="url"
                                    value={editCompanyForm.referral_link}
                                    onChange={(e) => setEditCompanyForm({ ...editCompanyForm, referral_link: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="https://company.com/referral-portal"
                                />
                            </div>

                            {/* Referral Requirements */}
                            <div>
                                <label className="block text-left text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                                    Referral Requirements
                                </label>
                                <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded p-2.5 space-y-1.5">
                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-white dark:hover:bg-gray-700 p-1.5 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={editCompanyForm.requires_resume}
                                            onChange={(e) => setEditCompanyForm({ ...editCompanyForm, requires_resume: e.target.checked })}
                                            className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600"
                                        />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">Resume</span>
                                    </label>

                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-white dark:hover:bg-gray-700 p-1.5 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={editCompanyForm.requires_phone_number}
                                            onChange={(e) => setEditCompanyForm({ ...editCompanyForm, requires_phone_number: e.target.checked })}
                                            className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600"
                                        />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">Phone Number</span>
                                    </label>

                                    <label className="flex items-start gap-2 cursor-pointer group hover:bg-white dark:hover:bg-gray-700 p-1.5 rounded transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={editCompanyForm.requires_essay}
                                            onChange={(e) => setEditCompanyForm({ ...editCompanyForm, requires_essay: e.target.checked })}
                                            className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600"
                                        />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">Referral Essay</span>
                                    </label>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="submit"
                                    className="flex-1 px-3 py-1.5 text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-orange-700 hover:to-amber-700 text-white font-medium rounded transition-all"
                                >
                                    Update Company
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditCompany(false);
                                        setEditingCompany(null);
                                    }}
                                    className="px-4 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Referral Management Modal */}
            {selectedReferral && isManagementModalOpen && (
                <ReferralManagement
                    referral={selectedReferral}
                    isOpen={isManagementModalOpen}
                    setIsOpen={setIsManagementModalOpen}
                    onUpdate={handleReferralUpdate}
                />
            )}
        </div>
    );
};

export default ReferralsManagement;
