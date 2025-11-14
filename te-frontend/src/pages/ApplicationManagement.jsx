import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import ApplicationInfo from '../components/application/ApplicationInfo';
import { getCompanyLogoUrl, handleCompanyLogoError } from '../utils';
import {
    MagnifyingGlassIcon,
    UserGroupIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    ChartBarIcon,
    XMarkIcon,
    AdjustmentsHorizontalIcon,
    ArrowDownTrayIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

const ApplicationManagement = () => {
    const { accessToken } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [memberFilter, setMemberFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [referredFilter, setReferredFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [sortBy, setSortBy] = useState('date_desc');
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [selectedApplicationId, setSelectedApplicationId] = useState(null);

    // Column visibility state - default visible columns
    const [visibleColumns, setVisibleColumns] = useState({
        member: true,
        company: true,
        position: true,
        level: true,
        location: false,
        referred: false,
        recruiter: false,
        status: true,
        applied: true
    });

    // Available columns configuration
    const columnConfig = [
        { key: 'member', label: 'Member', default: true },
        { key: 'company', label: 'Company', default: true },
        { key: 'position', label: 'Position', default: true },
        { key: 'level', label: 'Level', default: true },
        { key: 'location', label: 'Location', default: false },
        { key: 'referred', label: 'Referred', default: false },
        { key: 'recruiter', label: 'Recruiter', default: false },
        { key: 'status', label: 'Status', default: true },
        { key: 'applied', label: 'Applied', default: true }
    ];

    const toggleColumn = (columnKey) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const resetColumns = () => {
        const defaultColumns = {};
        columnConfig.forEach(col => {
            defaultColumns[col.key] = col.default;
        });
        setVisibleColumns(defaultColumns);
    };

    const showAllColumns = () => {
        const allColumns = {};
        columnConfig.forEach(col => {
            allColumns[col.key] = true;
        });
        setVisibleColumns(allColumns);
    };

    const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length;

    // Fetch all member applications
    const fetchAllApplications = useCallback(async () => {
        setLoading(true);
        try {
            console.log('Fetching applications from /applications...');
            const response = await axiosInstance.get('/applications', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log('Applications response:', response.data);
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            console.error('Error details:', error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    const archiveApplications = useCallback(async (applicationIds) => {
        try {
            await axiosInstance.put('/applications/archive', applicationIds, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            fetchAllApplications();
        } catch (error) {
            console.error('Error archiving applications:', error);
            alert('Failed to archive applications. Please try again.');
        }
    }, [accessToken, fetchAllApplications]);

    const deleteApplications = useCallback(async (applicationIds) => {
        try {
            await axiosInstance.put('/applications/delete', applicationIds, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            fetchAllApplications();
        } catch (error) {
            console.error('Error deleting applications:', error);
            alert('Failed to delete applications. Please try again.');
        }
    }, [accessToken, fetchAllApplications]);

    useEffect(() => {
        if (accessToken) {
            fetchAllApplications();
        }
    }, [accessToken, fetchAllApplications]);

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch = !searchQuery ||
            app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.user_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMember = !memberFilter ||
            app.user_name?.toLowerCase().includes(memberFilter.toLowerCase()) ||
            app.user_email?.toLowerCase().includes(memberFilter.toLowerCase());

        const matchesCompany = !companyFilter ||
            app.company?.toLowerCase().includes(companyFilter.toLowerCase());

        const matchesStatus = !statusFilter || app.status === statusFilter;

        const matchesLevel = !levelFilter || app.role === levelFilter;

        const matchesReferred = !referredFilter ||
            (referredFilter === 'yes' && app.referred) ||
            (referredFilter === 'no' && !app.referred);

        const matchesDateFrom = !dateFrom || new Date(app.date) >= new Date(dateFrom);
        const matchesDateTo = !dateTo || new Date(app.date) <= new Date(dateTo);

        return matchesSearch && matchesMember && matchesCompany && matchesStatus &&
            matchesLevel && matchesReferred && matchesDateFrom && matchesDateTo;
    });

    // Sort applications
    const sortedApplications = [...filteredApplications].sort((a, b) => {
        switch (sortBy) {
            case 'date_desc':
                return new Date(b.date) - new Date(a.date);
            case 'date_asc':
                return new Date(a.date) - new Date(b.date);
            case 'company_asc':
                return (a.company || '').localeCompare(b.company || '');
            case 'company_desc':
                return (b.company || '').localeCompare(a.company || '');
            case 'member_asc':
                return (a.user_name || '').localeCompare(b.user_name || '');
            case 'member_desc':
                return (b.user_name || '').localeCompare(a.user_name || '');
            case 'status':
                return (a.status || '').localeCompare(b.status || '');
            default:
                return 0;
        }
    });

    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setMemberFilter('');
        setCompanyFilter('');
        setStatusFilter('');
        setLevelFilter('');
        setReferredFilter('');
        setDateFrom('');
        setDateTo('');
    };

    // Check if any filters are active
    const hasActiveFilters = searchQuery || memberFilter || companyFilter || statusFilter ||
        levelFilter || referredFilter || dateFrom || dateTo;

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Member', 'Email', 'Company', 'Position', 'Level', 'Location', 'Referred', 'Recruiter', 'Status', 'Applied'];
        const csvData = sortedApplications.map(app => [
            app.user_name || '',
            app.user_email || '',
            app.company || '',
            app.title || '',
            app.role || '',
            app.location?.city && app.location?.country ? `${app.location.city}, ${app.location.country}` : (app.location?.country || app.location?.city || ''),
            app.referred ? 'Yes' : 'No',
            app.recruiter_name || '',
            app.status || '',
            app.date || ''
        ]);

        const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Statistics
    const stats = {
        total: applications.length,
        submitted: applications.filter(a => a.status === 'Submitted').length,
        interviewing: applications.filter(a => ['HR', 'Phone interview', 'Final interview', 'OA'].includes(a.status)).length,
        offered: applications.filter(a => a.status === 'Offer').length,
        rejected: applications.filter(a => a.status === 'Rejected').length,
    };

    const getStatusColor = (status) => {
        const colors = {
            'Submitted': 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
            'HR': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
            'Phone interview': 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
            'OA': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
            'Final interview': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
            'Offer': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
            'Rejected': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loading />
            </div>
        );
    }

    return (
        <div className="min-h-screen h-full bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Header with Stats and Actions */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                                Member Applications Dashboard
                            </h1>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                Monitor and manage all member job applications
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Column Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <EyeIcon className="h-4 w-4" />
                                    Columns ({visibleColumnCount}/{columnConfig.length})
                                </button>

                                {showColumnSelector && (
                                    <>
                                        {/* Backdrop */}
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowColumnSelector(false)}
                                        />

                                        {/* Dropdown */}
                                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                                            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                        Manage Columns
                                                    </h3>
                                                    <button
                                                        onClick={() => setShowColumnSelector(false)}
                                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={showAllColumns}
                                                        className="flex-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                    >
                                                        Show All
                                                    </button>
                                                    <button
                                                        onClick={resetColumns}
                                                        className="flex-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-2 max-h-80 overflow-y-auto">
                                                {columnConfig.map(column => (
                                                    <label
                                                        key={column.key}
                                                        className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={visibleColumns[column.key]}
                                                            onChange={() => toggleColumn(column.key)}
                                                            className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                                            {column.label}
                                                        </span>
                                                        {!column.default && (
                                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                                Optional
                                                            </span>
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={exportToCSV}
                                disabled={sortedApplications.length === 0}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                Export CSV
                            </button>
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${showAdvancedFilters
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                Advanced Filters
                                {hasActiveFilters && (
                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                                        {[memberFilter, companyFilter, statusFilter, levelFilter, referredFilter, dateFrom, dateTo].filter(Boolean).length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-6 flex-wrap text-xs">
                            <div className="flex items-center gap-2">
                                <UserGroupIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="font-medium text-gray-600 dark:text-gray-400">Total:</span>
                                <span className="font-bold text-gray-900 dark:text-white">{stats.total}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                <span className="font-medium text-green-600 dark:text-green-400">Offers:</span>
                                <span className="font-bold text-green-700 dark:text-green-400">{stats.offered}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-blue-600 dark:text-blue-400">Interviewing:</span>
                                <span className="font-bold text-blue-700 dark:text-blue-400">{stats.interviewing}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-amber-500" />
                                <span className="font-medium text-amber-600 dark:text-amber-400">Pending:</span>
                                <span className="font-bold text-amber-700 dark:text-amber-400">{stats.submitted}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <XCircleIcon className="h-4 w-4 text-red-500" />
                                <span className="font-medium text-red-600 dark:text-red-400">Rejected:</span>
                                <span className="font-bold text-red-700 dark:text-red-400">{stats.rejected}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-3">

                {/* Search and Sort Bar */}
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
                    <div className="flex items-center gap-3">
                        {/* Global Search */}
                        <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search applications (member, company, position)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                Sort by:
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="date_desc">Newest First</option>
                                <option value="date_asc">Oldest First</option>
                                <option value="company_asc">Company (A-Z)</option>
                                <option value="company_desc">Company (Z-A)</option>
                                <option value="member_asc">Member (A-Z)</option>
                                <option value="member_desc">Member (Z-A)</option>
                                <option value="status">Status</option>
                            </select>
                        </div>

                        {/* Results Count */}
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {sortedApplications.length} of {applications.length}
                        </div>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Advanced Filters</h3>
                            </div>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                    <XMarkIcon className="h-3.5 w-3.5" />
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Member Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Member
                                </label>
                                <input
                                    type="text"
                                    placeholder="Filter by member..."
                                    value={memberFilter}
                                    onChange={(e) => setMemberFilter(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Company Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Company
                                </label>
                                <input
                                    type="text"
                                    placeholder="Filter by company..."
                                    value={companyFilter}
                                    onChange={(e) => setCompanyFilter(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="OA">OA</option>
                                    <option value="Phone interview">Phone interview</option>
                                    <option value="Final interview">Final interview</option>
                                    <option value="HR">HR</option>
                                    <option value="Recruiter call">Recruiter call</option>
                                    <option value="Offer">Offer</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            {/* Level Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Level
                                </label>
                                <select
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="">All Levels</option>
                                    <option value="Intern">Intern</option>
                                    <option value="Entry">Entry</option>
                                    <option value="Mid">Mid</option>
                                    <option value="Senior">Senior</option>
                                </select>
                            </div>

                            {/* Referred Filter */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Referred
                                </label>
                                <select
                                    value={referredFilter}
                                    onChange={(e) => setReferredFilter(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="">All</option>
                                    <option value="yes">Referred</option>
                                    <option value="no">Not Referred</option>
                                </select>
                            </div>

                            {/* Date From */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Date From
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Date To
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Applications Table */}
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                    {visibleColumns.company && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Company
                                        </th>
                                    )}
                                    {visibleColumns.member && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Member
                                        </th>
                                    )}
                                    {visibleColumns.position && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Position
                                        </th>
                                    )}
                                    {visibleColumns.level && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Level
                                        </th>
                                    )}
                                    {visibleColumns.location && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Location
                                        </th>
                                    )}
                                    {visibleColumns.referred && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Referred
                                        </th>
                                    )}
                                    {visibleColumns.recruiter && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Recruiter
                                        </th>
                                    )}
                                    {visibleColumns.status && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                    )}
                                    {visibleColumns.applied && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Applied
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {sortedApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleColumnCount} className="px-3 py-6 text-center">
                                            <BuildingOfficeIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">No applications found</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {applications.length === 0
                                                    ? 'No member applications yet'
                                                    : 'Try adjusting your filters'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedApplications.map((app) => (
                                        <tr
                                            key={app.id}
                                            onClick={() => {
                                                setSelectedApplication(app);
                                                setSelectedApplicationId(app.id);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelectedApplication(app);
                                                    setSelectedApplicationId(app.id);
                                                }
                                            }}
                                            tabIndex={0}
                                            role="button"
                                            aria-label={`View details for application at ${app.company}`}
                                            className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all cursor-pointer"
                                        >
                                            {visibleColumns.company && (
                                                <td className="px-3 py-2 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative h-5 w-5 flex-shrink-0">
                                                            <img
                                                                src={getCompanyLogoUrl(app.company)}
                                                                alt={app.company}
                                                                className="h-5 w-5 rounded object-cover border border-gray-200 dark:border-gray-700 bg-white"
                                                                onError={handleCompanyLogoError}
                                                            />
                                                        </div>
                                                        <span className="font-semibold text-gray-900 dark:text-white text-xs">{app.company}</span>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.member && (
                                                <td className="px-3 py-2 text-left">
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-white text-xs">{app.user_name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{app.user_email}</div>
                                                    </div>
                                                </td>
                                            )}
                                            {visibleColumns.position && (
                                                <td className="px-3 py-2 text-left">
                                                    <span className="text-xs text-gray-700 dark:text-gray-300">{app.title}</span>
                                                </td>
                                            )}
                                            {visibleColumns.level && (
                                                <td className="px-3 py-2 text-left">
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">{app.role}</span>
                                                </td>
                                            )}
                                            {visibleColumns.location && (
                                                <td className="px-3 py-2 whitespace-nowrap text-left">
                                                    <p className="text-xs text-gray-700 dark:text-gray-300">
                                                        {app.location?.city && app.location?.country
                                                            ? `${app.location.city}, ${app.location.country}`
                                                            : app.location?.country || app.location?.city || '—'}
                                                    </p>
                                                </td>
                                            )}
                                            {visibleColumns.referred && (
                                                <td className="px-3 py-2 whitespace-nowrap text-left">
                                                    {app.referred ? (
                                                        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.recruiter && (
                                                <td className="px-3 py-2 whitespace-nowrap text-left">
                                                    {app.recruiter_name ? (
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                                                {app.recruiter_name}
                                                            </p>
                                                            {app.recruiter_email && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                                    {app.recruiter_email}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.status && (
                                                <td className="px-3 py-2 text-left">
                                                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(app.status)}`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.applied && (
                                                <td className="px-3 py-2 text-left">
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">{app.date}</span>
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
                {filteredApplications.length > 0 && (
                    <div className="mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
                        Showing {filteredApplications.length} of {applications.length} applications
                    </div>
                )}
            </div>

            {selectedApplicationId && (
                <ApplicationInfo
                    applicationId={selectedApplicationId}
                    setApplicationId={setSelectedApplicationId}
                    application={selectedApplication}
                    setApplication={setSelectedApplication}
                    archiveUserApplicationRequest={archiveApplications}
                    deleteUserApplicationRequest={deleteApplications}
                    refreshApplications={fetchAllApplications}
                />
            )}
        </div>
    );
};

export default ApplicationManagement;
