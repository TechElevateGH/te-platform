import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import ReferralManagement from '../components/referral/ReferralManagement';
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
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { ClipboardDocumentIcon } from '@heroicons/react/20/solid';

const ReferralsManagement = () => {
    const { accessToken, userRole } = useAuth();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddCompany, setShowAddCompany] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('Pending');
    const [memberFilter, setMemberFilter] = useState('');
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState(null);

    // Check if user is a referrer (role = 2) - use sessionStorage as fallback for immediate availability
    const storedRole = sessionStorage.getItem('userRole');
    const isReferrer = userRole === 2 || parseInt(storedRole) === 2;

    // Company filter - only initialize for non-referrers
    const [companyFilter, setCompanyFilter] = useState('');

    // Clear company filter immediately if user is a referrer
    useEffect(() => {
        if (isReferrer) {
            setCompanyFilter('');
        }
    }, [isReferrer]);

    // Advanced Features State
    const [sortBy, setSortBy] = useState('date_desc');
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

    // Fetch all referrals
    const fetchAllReferrals = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/referrals/all', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setReferrals(response.data?.referrals || []);
        } catch (error) {
            console.error('Error fetching referrals:', error);
            setReferrals([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchAllReferrals();
        }
    }, [accessToken, fetchAllReferrals]);

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
        switch (sortBy) {
            case 'date_desc':
                return new Date(b.submitted_date || 0) - new Date(a.submitted_date || 0);
            case 'date_asc':
                return new Date(a.submitted_date || 0) - new Date(b.submitted_date || 0);
            case 'company_asc':
                return (a.company?.name || '').localeCompare(b.company?.name || '');
            case 'company_desc':
                return (b.company?.name || '').localeCompare(a.company?.name || '');
            case 'member_asc':
                return (a.user_name || '').localeCompare(b.user_name || '');
            case 'member_desc':
                return (b.user_name || '').localeCompare(a.user_name || '');
            case 'status_asc':
                return (a.status || '').localeCompare(b.status || '');
            case 'status_desc':
                return (b.status || '').localeCompare(a.status || '');
            default:
                return 0;
        }
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Compact Sticky Header */}
            <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    {/* Title and Actions Row */}
                    <div className="flex items-center justify-between">
                        {/* Left: Title */}
                        <div className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <PaperAirplaneIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                Referral Management
                            </h1>
                            <p className="text-left text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {isReferrer ? 'View and manage referral requests for your company' : 'Process member referral requests and manage companies'}
                            </p>
                        </div>

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Column Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                                    Columns
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
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                            >
                                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                Export
                            </button>

                            {/* Add Company Button - Only for non-referrers */}
                            {!isReferrer && (
                                <button
                                    onClick={() => setShowAddCompany(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
                                >
                                    <PlusIcon className="h-3.5 w-3.5" />
                                    Add Company
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-3">

                {/* Stats + Filters Combined in One Row */}
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2.5 mb-3 transition-colors">
                    <div className="flex items-end gap-4">
                        {/* Stats Section - Left Side (Compact) */}
                        <div className="flex items-center gap-2.5 text-xs flex-shrink-0 pb-1 min-w-fit">
                            {!isReferrer && (
                                <>
                                    <div className="flex items-center gap-1.5">
                                        <ChartBarIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                        <span className="text-gray-500 dark:text-gray-400">Total:</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{stats.total}</span>
                                    </div>
                                    <div className="h-3 w-px bg-gray-300 dark:bg-gray-600"></div>
                                </>
                            )}
                            <div className="flex items-center gap-1.5">
                                <ClockIcon className="h-3.5 w-3.5 text-yellow-500" />
                                <span className="text-gray-500 dark:text-gray-400">Pending:</span>
                                <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</span>
                            </div>
                            <div className="h-3 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircleIcon className="h-3.5 w-3.5 text-blue-500" />
                                <span className="text-gray-500 dark:text-gray-400">Completed:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.completed}</span>
                            </div>
                        </div>

                        {/* Vertical Divider */}
                        <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>

                        {/* Filters Section - Right Side (Narrower) */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                            {/* Status Filter */}
                            <div className={isReferrer ? "md:col-span-3" : "md:col-span-2"}>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Declined">Declined</option>
                                    <option value="Completed">Completed</option>
                                    {!isReferrer && <option value="Cancelled">Cancelled</option>}
                                </select>
                            </div>

                            {/* Member Filter */}
                            <div className={isReferrer ? "md:col-span-5" : "md:col-span-4"}>
                                <input
                                    type="text"
                                    placeholder="Filter by member..."
                                    value={memberFilter}
                                    onChange={(e) => setMemberFilter(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                                />
                            </div>

                            {/* Company Filter - Hidden for referrers */}
                            {!isReferrer && (
                                <div className="md:col-span-3">
                                    <input
                                        type="text"
                                        placeholder="Company..."
                                        value={companyFilter}
                                        onChange={(e) => setCompanyFilter(e.target.value)}
                                        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                                    />
                                </div>
                            )}

                            {/* Sort Dropdown */}
                            <div className={isReferrer ? "md:col-span-2" : "md:col-span-2"}>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                                >
                                    <option value="date_desc">Date ↓</option>
                                    <option value="date_asc">Date ↑</option>
                                    <option value="company_asc">Company A-Z</option>
                                    <option value="company_desc">Company Z-A</option>
                                    <option value="member_asc">Member A-Z</option>
                                    <option value="member_desc">Member Z-A</option>
                                    <option value="status_asc">Status A-Z</option>
                                    <option value="status_desc">Status Z-A</option>
                                </select>
                            </div>

                            {/* Date Range Toggle */}
                            <div className={isReferrer ? "md:col-span-2" : "md:col-span-1"}>
                                <button
                                    onClick={() => setShowDateFilter(!showDateFilter)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
                                >
                                    <span>{dateRange.start || dateRange.end ? '📅' : '📅'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Date Range - Collapsible Section */}
                    {showDateFilter && (
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

                    {/* Active Filters & Clear */}
                    {(searchQuery || statusFilter || memberFilter || (!isReferrer && companyFilter) || dateRange.start || dateRange.end) && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
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
                                {(dateRange.start || dateRange.end) && (
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

                {/* Referrals Table */}
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors">
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
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
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
                                            onClick={() => {
                                                setSelectedReferral(ref);
                                                setIsManagementModalOpen(true);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelectedReferral(ref);
                                                    setIsManagementModalOpen(true);
                                                }
                                            }}
                                            tabIndex={0}
                                            role="button"
                                            aria-label={`View referral request for ${ref.user_name || 'member'} at ${ref.company?.name || 'company'}`}
                                            className="group hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-gray-700/30 dark:hover:to-gray-600/30 transition-all cursor-pointer"
                                        >
                                            {visibleColumns.company && (
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {ref.company?.image && (
                                                            <div className="h-8 w-8 rounded border border-gray-200 dark:border-gray-600 bg-white p-0.5 flex-shrink-0">
                                                                <img
                                                                    src={ref.company.image}
                                                                    alt={ref.company.name}
                                                                    className="h-full w-full object-contain"
                                                                />
                                                            </div>
                                                        )}
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
                                                        <option value="Declined">Declined</option>
                                                        {!isReferrer && <option value="Cancelled">Cancelled</option>}
                                                    </select>
                                                </td>
                                            )}
                                            {visibleColumns.resume && (
                                                <td className="px-4 py-3">
                                                    {ref.has_resume ? (
                                                        <span className="inline-block px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
                                                            No
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.essay && (
                                                <td className="px-4 py-3">
                                                    {ref.has_essay ? (
                                                        <span className="inline-block px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 rounded">
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
                                                            No
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.actions && (
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-2">
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
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-t-lg">
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
                                    className="flex-1 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded transition-all"
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
