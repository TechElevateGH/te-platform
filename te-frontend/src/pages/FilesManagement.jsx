import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import Toast from '../components/_custom/Toast';
import {
    DocumentIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    UserGroupIcon,
    FolderIcon,
    XMarkIcon,
    ChartBarIcon,
    DocumentTextIcon,
    UserCircleIcon,
    CheckCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const FilesManagement = () => {
    const { accessToken, userRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [resumeReviews, setResumeReviews] = useState([]);
    const [privilegedUsers, setPrivilegedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Check user role first to set default tab
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const isAdmin = userRoleInt === 5;
    const isLeadOrAbove = userRoleInt >= 4; // Lead or Admin
    const isVolunteerOrAbove = userRoleInt >= 3; // Volunteer, Lead, or Admin

    // Default tab: Resumes for Lead+, Reviews for Volunteer
    const [activeTab, setActiveTab] = useState(userRoleInt >= 4 ? 'resumes' : 'reviews');
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState('');
    const [memberFilter, setMemberFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [assigningReview, setAssigningReview] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [reviewStatus, setReviewStatus] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [resumeReviewStatusFilter, setResumeReviewStatusFilter] = useState('active'); // Default to Pending + In Review
    const [toast, setToast] = useState(null);

    // Column visibility state - default visible columns
    const [visibleColumns, setVisibleColumns] = useState({
        member: true,
        email: true,
        resumes: true,
        essays: true,
        totalFiles: true,
        actions: true
    });

    const columnConfig = [
        { key: 'member', label: 'Member Name', default: true },
        { key: 'email', label: 'Email', default: true },
        { key: 'resumes', label: 'Resumes', default: true },
        { key: 'essays', label: 'Essays', default: true },
        { key: 'totalFiles', label: 'Total Files', default: true },
        { key: 'actions', label: 'Actions', default: true }
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

    // Fetch all users with their files
    const fetchAllUsersFiles = useCallback(async () => {
        setLoading(true);
        try {
            // This endpoint should return all users with their files
            const response = await axiosInstance.get('/users/all-files', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users files:', error);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    // Fetch resume review requests
    const fetchResumeReviews = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/resume-reviews/all', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setResumeReviews(response.data?.reviews || []);
        } catch (error) {
            console.error('Error fetching resume reviews:', error);
        }
    }, [accessToken]);

    // Fetch privileged users for assignment
    const fetchPrivilegedUsers = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/users/privileged', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            // Filter out admins (role === 5) from the assignment list
            const nonAdminUsers = (response.data?.users || []).filter(user => parseInt(user.role) !== 5);
            setPrivilegedUsers(nonAdminUsers);
        } catch (error) {
            console.error('Error fetching privileged users:', error);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchAllUsersFiles();
            fetchResumeReviews();
            fetchPrivilegedUsers();
        }
    }, [accessToken, fetchAllUsersFiles, fetchResumeReviews, fetchPrivilegedUsers]);

    // Assign review to a reviewer
    const handleAssignReview = async (reviewId, reviewerId, reviewerName) => {
        try {
            await axiosInstance.patch(`/resume-reviews/${reviewId}`, {
                status: 'In Review'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setToast({ message: `Review assigned to ${reviewerName}`, type: 'success' });
            fetchResumeReviews();
            setAssigningReview(null);
        } catch (error) {
            console.error('Error assigning review:', error);
            setToast({ message: 'Failed to assign review', type: 'error' });
        }
    };

    // Open review modal
    const handleViewReview = (review) => {
        setSelectedReview(review);
        setReviewFeedback(review.feedback || '');
        setReviewStatus(review.status || 'Pending');
        setShowReviewModal(true);
    };

    // Close review modal
    const handleCloseReviewModal = () => {
        setShowReviewModal(false);
        setSelectedReview(null);
        setReviewFeedback('');
        setReviewStatus('');
    };

    // Submit review feedback
    const handleSubmitReview = async () => {
        if (!selectedReview) return;

        setSubmittingReview(true);
        try {
            await axiosInstance.patch(`/resume-reviews/${selectedReview.id}`, {
                feedback: reviewFeedback,
                status: reviewStatus
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setToast({ message: 'Review updated successfully', type: 'success' });
            fetchResumeReviews();
            handleCloseReviewModal();
        } catch (error) {
            console.error('Error updating review:', error);
            setToast({ message: 'Failed to update review', type: 'error' });
        } finally {
            setSubmittingReview(false);
        }
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = !searchQuery ||
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMember = !memberFilter ||
            user.full_name?.toLowerCase().includes(memberFilter.toLowerCase()) ||
            user.email?.toLowerCase().includes(memberFilter.toLowerCase());

        const hasFiles = fileTypeFilter === 'resume'
            ? (user.resumes && user.resumes.length > 0)
            : fileTypeFilter === 'essay'
                ? (user.essays && user.essays.length > 0)
                : (user.resumes?.length > 0 || user.essays?.length > 0);

        return matchesSearch && matchesMember && hasFiles;
    });

    // Sort users
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        switch (sortBy) {
            case 'name_asc':
                return (a.full_name || '').localeCompare(b.full_name || '');
            case 'name_desc':
                return (b.full_name || '').localeCompare(a.full_name || '');
            case 'email_asc':
                return (a.email || '').localeCompare(b.email || '');
            case 'email_desc':
                return (b.email || '').localeCompare(a.email || '');
            case 'files_desc':
                const aTotal = (a.resumes?.length || 0) + (a.essays?.length || 0);
                const bTotal = (b.resumes?.length || 0) + (b.essays?.length || 0);
                return bTotal - aTotal;
            case 'files_asc':
                const aTotalAsc = (a.resumes?.length || 0) + (a.essays?.length || 0);
                const bTotalAsc = (b.resumes?.length || 0) + (b.essays?.length || 0);
                return aTotalAsc - bTotalAsc;
            default:
                return 0;
        }
    });

    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setMemberFilter('');
        setFileTypeFilter('');
    };

    const hasActiveFilters = searchQuery || memberFilter || fileTypeFilter;

    // Filter resume reviews - default to Pending and In Review only
    const filteredResumeReviews = resumeReviews.filter(review => {
        // Status filter
        let statusMatch = true;
        if (resumeReviewStatusFilter === 'active') {
            statusMatch = review.status === 'Pending' || review.status === 'In Review';
        } else if (resumeReviewStatusFilter) {
            statusMatch = review.status === resumeReviewStatusFilter;
        }

        // Search filter (member name, email, or job title)
        const searchMatch = !searchQuery ||
            review.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.job_title?.toLowerCase().includes(searchQuery.toLowerCase());

        // Level filter
        const levelMatch = !levelFilter || review.level === levelFilter;

        return statusMatch && searchMatch && levelMatch;
    });

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Member Name', 'Email', 'Resumes', 'Essays', 'Total Files'];
        const csvData = sortedUsers.map(user => [
            user.full_name || '',
            user.email || '',
            user.resumes?.length || 0,
            user.essays?.length || 0,
            (user.resumes?.length || 0) + (user.essays?.length || 0)
        ]);

        const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `member_files_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Statistics
    const stats = {
        totalUsers: users.filter(u => u.resumes?.length > 0 || u.essays?.length > 0).length,
        totalResumes: users.reduce((sum, u) => sum + (u.resumes?.length || 0), 0),
        totalEssays: users.reduce((sum, u) => sum + (u.essays?.length || 0), 0),
        totalFiles: users.reduce((sum, u) => sum + (u.resumes?.length || 0) + (u.essays?.length || 0), 0)
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
            {/* Header with Stats and Actions */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FolderIcon className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                                Resumes and Essays
                            </h1>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                Manage member files, essays, and assign resume review requests
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
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowColumnSelector(false)}
                                        />

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
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={exportToCSV}
                                disabled={sortedUsers.length === 0}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[72px] z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex gap-4">
                        {/* Resumes Tab - Only Lead+ */}
                        {userRoleInt >= 4 && (
                            <button
                                onClick={() => setActiveTab('resumes')}
                                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'resumes'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <FolderIcon className="h-4 w-4" />
                                    Resumes
                                </div>
                            </button>
                        )}

                        {/* Resume Reviews Tab - Volunteer+ */}
                        {userRoleInt >= 3 && (
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'reviews'
                                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <DocumentTextIcon className="h-4 w-4" />
                                    Resume Reviews
                                    {resumeReviews.filter(r => r.status === 'Pending').length > 0 && (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                            {resumeReviews.filter(r => r.status === 'Pending').length}
                                        </span>
                                    )}
                                </div>
                            </button>
                        )}

                        {/* Essays Tab - Volunteer+ */}
                        {userRoleInt >= 3 && (
                            <button
                                onClick={() => setActiveTab('essays')}
                                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'essays'
                                    ? 'border-green-600 text-green-600 dark:text-green-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <DocumentIcon className="h-4 w-4" />
                                    Essays
                                </div>
                            </button>
                        )}
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-3">

                {activeTab === 'resumes' && (
                    <>
                        {/* Combined Stats & Filters Bar for Resumes */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 mb-3 transition-colors">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                {/* Stats */}
                                <div className="flex items-center gap-6 flex-wrap text-xs">
                                    <div className="flex items-center gap-2">
                                        <UserGroupIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Members with Resumes:</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{users.filter(u => u.resumes && u.resumes.length > 0).length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DocumentIcon className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium text-blue-600 dark:text-blue-400">Total Resumes:</span>
                                        <span className="font-bold text-blue-700 dark:text-blue-400">{stats.totalResumes}</span>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-wrap items-end gap-3">
                                    {/* Member Filter */}
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                            Member Name or Email
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Filter by member name or email..."
                                            value={memberFilter}
                                            onChange={(e) => setMemberFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    {/* File Type Filter */}
                                    <div className="w-[140px]">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                            File Type
                                        </label>
                                        <select
                                            value={fileTypeFilter}
                                            onChange={(e) => setFileTypeFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        >
                                            <option value="">All Types</option>
                                            <option value="resume">Resumes Only</option>
                                            <option value="essay">Essays Only</option>
                                        </select>
                                    </div>

                                    {/* Sort Dropdown */}
                                    <div className="w-[160px]">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                            Sort by
                                        </label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 transition-colors"
                                        >
                                            <option value="name_asc">Name (A-Z)</option>
                                            <option value="name_desc">Name (Z-A)</option>
                                            <option value="email_asc">Email (A-Z)</option>
                                            <option value="email_desc">Email (Z-A)</option>
                                            <option value="files_desc">Most Files</option>
                                            <option value="files_asc">Least Files</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Active Filters & Clear */}
                            {hasActiveFilters && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {memberFilter && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                Member: {memberFilter}
                                            </span>
                                        )}
                                        {fileTypeFilter && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                Type: {fileTypeFilter === 'resume' ? 'Resumes' : 'Essays'}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={clearAllFilters}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Files Table */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                            {visibleColumns.member && (
                                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Member
                                                </th>
                                            )}
                                            {visibleColumns.email && (
                                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Email
                                                </th>
                                            )}
                                            {visibleColumns.resumes && (
                                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Resumes
                                                </th>
                                            )}
                                            {visibleColumns.essays && (
                                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Essays
                                                </th>
                                            )}
                                            {visibleColumns.totalFiles && (
                                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Total
                                                </th>
                                            )}
                                            {visibleColumns.actions && (
                                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {sortedUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={visibleColumnCount} className="px-3 py-6 text-center">
                                                    <FolderIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">No files found</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {users.length === 0
                                                            ? 'No members have uploaded files yet'
                                                            : 'Try adjusting your filters'}
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            sortedUsers.map((user) => (
                                                <tr
                                                    key={user.id}
                                                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all"
                                                >
                                                    {visibleColumns.member && (
                                                        <td className="px-3 py-2">
                                                            <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                                                {user.full_name}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.email && (
                                                        <td className="px-3 py-2">
                                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                                {user.email}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.resumes && (
                                                        <td className="px-3 py-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                                                {user.resumes?.length || 0}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.essays && (
                                                        <td className="px-3 py-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                                                                {user.essays?.length || 0}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.totalFiles && (
                                                        <td className="px-3 py-2">
                                                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                                                {(user.resumes?.length || 0) + (user.essays?.length || 0)}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.actions && (
                                                        <td className="px-3 py-2">
                                                            <div className="flex items-center gap-2">
                                                                {user.resumes && user.resumes.length > 0 && (
                                                                    <a
                                                                        href={user.resumes[0].url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                                    >
                                                                        <EyeIcon className="h-3.5 w-3.5" />
                                                                        View
                                                                    </a>
                                                                )}
                                                                {((user.resumes?.length || 0) + (user.essays?.length || 0)) > 0 && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {(user.resumes?.length || 0) + (user.essays?.length || 0)} file{((user.resumes?.length || 0) + (user.essays?.length || 0)) !== 1 ? 's' : ''}
                                                                    </span>
                                                                )}
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
                    </>
                )}

                {/* Resume Reviews Tab */}
                {activeTab === 'reviews' && (
                    <>
                        {/* Combined Stats & Filters Bar for Resume Reviews */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 mb-3 transition-colors">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                {/* Stats */}
                                <div className="flex items-center gap-6 flex-wrap text-xs">
                                    <div className="flex items-center gap-2">
                                        <ChartBarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Total Requests:</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{resumeReviews.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="h-4 w-4 text-yellow-500" />
                                        <span className="font-medium text-yellow-600 dark:text-yellow-400">Pending:</span>
                                        <span className="font-bold text-yellow-700 dark:text-yellow-400">{resumeReviews.filter(r => r.status === 'Pending').length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                                        <span className="font-medium text-blue-600 dark:text-blue-400">In Review:</span>
                                        <span className="font-bold text-blue-700 dark:text-blue-400">{resumeReviews.filter(r => r.status === 'In Review').length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                        <span className="font-medium text-green-600 dark:text-green-400">Completed:</span>
                                        <span className="font-bold text-green-700 dark:text-green-400">{resumeReviews.filter(r => r.status === 'Completed').length}</span>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-wrap items-end gap-3">
                                    {/* Status Filter */}
                                    <div className="w-[180px]">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                            Status Filter
                                        </label>
                                        <select
                                            value={resumeReviewStatusFilter}
                                            onChange={(e) => setResumeReviewStatusFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                        >
                                            <option value="active">Active (Pending + In Review)</option>
                                            <option value="">All Statuses</option>
                                            <option value="Pending">Pending Only</option>
                                            <option value="In Review">In Review Only</option>
                                            <option value="Completed">Completed Only</option>
                                            <option value="Declined">Declined Only</option>
                                        </select>
                                    </div>

                                    {/* Search Filter */}
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                            Search Member or Job Title
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Filter by member name, email, or job title..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                        />
                                    </div>

                                    {/* Level Filter */}
                                    <div className="w-[120px]">
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                            Level
                                        </label>
                                        <select
                                            value={levelFilter}
                                            onChange={(e) => setLevelFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                        >
                                            <option value="">All Levels</option>
                                            <option value="Intern">Intern</option>
                                            <option value="Entry">Entry</option>
                                            <option value="Mid">Mid</option>
                                            <option value="Senior">Senior</option>
                                        </select>
                                    </div>

                                    {/* Clear Filters */}
                                    {(searchQuery || levelFilter || resumeReviewStatusFilter !== 'active') && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery('');
                                                setLevelFilter('');
                                                setResumeReviewStatusFilter('active');
                                            }}
                                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-600">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Member</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Job Title</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Level</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Submitted</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Reviewer</th>
                                            {isAdmin && (
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredResumeReviews.length === 0 ? (
                                            <tr>
                                                <td colSpan={isAdmin ? "7" : "6"} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No resume review requests found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredResumeReviews.map((review) => (
                                                <tr key={review.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{review.user_name}</div>
                                                            <div className="text-xs text-gray-600 dark:text-gray-400">{review.user_email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{review.job_title}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                            {review.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${review.status === 'Pending'
                                                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                            : review.status === 'In Review'
                                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                                : review.status === 'Completed'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {review.status === 'Pending' && <ClockIcon className="h-3.5 w-3.5" />}
                                                            {review.status === 'Completed' && <CheckCircleIcon className="h-3.5 w-3.5" />}
                                                            {review.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">{review.submitted_date}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                                            {review.reviewer_name || 'Unassigned'}
                                                        </span>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleViewReview(review)}
                                                                    className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                                                                >
                                                                    <EyeIcon className="h-3.5 w-3.5" />
                                                                    View
                                                                </button>
                                                                {review.status === 'Pending' && (
                                                                    <div className="relative">
                                                                        <button
                                                                            onClick={() => setAssigningReview(assigningReview === review.id ? null : review.id)}
                                                                            className="px-2.5 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                                                                        >
                                                                            <UserCircleIcon className="h-3.5 w-3.5" />
                                                                            Assign
                                                                        </button>

                                                                        {assigningReview === review.id && (
                                                                            <>
                                                                                <div
                                                                                    className="fixed inset-0 z-10"
                                                                                    onClick={() => setAssigningReview(null)}
                                                                                />
                                                                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-3 z-20 max-h-64 overflow-y-auto">
                                                                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Assign to Reviewer</h4>
                                                                                    <div className="space-y-1">
                                                                                        {privilegedUsers.map(user => (
                                                                                            <button
                                                                                                key={user.id}
                                                                                                onClick={() => handleAssignReview(review.id, user.id, user.full_name)}
                                                                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                                                                                            >
                                                                                                <div className="font-medium">{user.full_name}</div>
                                                                                                <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                                                                                            </button>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
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
                    </>
                )}

                {/* Essays Tab */}
                {activeTab === 'essays' && (
                    <>
                        {/* Combined Stats Bar for Essays */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 mb-3 transition-colors">
                            <div className="flex items-center gap-6 flex-wrap text-xs">
                                <div className="flex items-center gap-2">
                                    <UserGroupIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Members with Essays:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{users.filter(u => u.essays && u.essays.length > 0).length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DocumentIcon className="h-4 w-4 text-emerald-500" />
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">Total Essays:</span>
                                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{stats.totalEssays}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-600">
                                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Member Name
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Essays
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {users.filter(u => u.essays && u.essays.length > 0).length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-3 py-6 text-center">
                                                    <DocumentIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">No essays found</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        No members have uploaded essays yet
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            users.filter(u => u.essays && u.essays.length > 0).map((user) => (
                                                <tr
                                                    key={user.id}
                                                    className="hover:bg-gradient-to-r hover:from-green-50/30 hover:to-emerald-50/30 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all"
                                                >
                                                    <td className="px-3 py-2">
                                                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                                            {user.full_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                                            {user.email}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                                            {user.essays?.length || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            {user.essays && user.essays.length > 0 && (
                                                                <a
                                                                    href={user.essays[0].url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                                >
                                                                    <EyeIcon className="h-3.5 w-3.5" />
                                                                    View
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

            </div>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Resume Review Modal */}
            {showReviewModal && selectedReview && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={handleCloseReviewModal}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Resume Review Request</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Submitted on {selectedReview.submitted_date}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseReviewModal}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Request Information */}
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Request Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Member</label>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{selectedReview.user_name}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">{selectedReview.user_email}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Target Job Title</label>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{selectedReview.job_title}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Experience Level</label>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{selectedReview.level}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Status</label>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${selectedReview.status === 'Pending'
                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                : selectedReview.status === 'In Review'
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                    : selectedReview.status === 'Completed'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                }`}>
                                                {selectedReview.status}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedReview.reviewer_name && (
                                        <div className="col-span-2">
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Assigned To</label>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{selectedReview.reviewer_name}</p>
                                        </div>
                                    )}
                                    {selectedReview.notes && (
                                        <div className="col-span-2">
                                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Member Notes</label>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedReview.notes}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <a
                                        href={selectedReview.resume_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <DocumentIcon className="h-4 w-4" />
                                        Open Resume
                                    </a>
                                </div>
                            </div>

                            {/* Review Form */}
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Review & Feedback</h4>

                                {/* Status Selector */}
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Update Status
                                    </label>
                                    <select
                                        value={reviewStatus}
                                        onChange={(e) => setReviewStatus(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Review">In Review</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Declined">Declined</option>
                                    </select>
                                </div>

                                {/* Feedback Textarea */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Feedback & Comments
                                    </label>
                                    <textarea
                                        value={reviewFeedback}
                                        onChange={(e) => setReviewFeedback(e.target.value)}
                                        rows={8}
                                        placeholder="Provide detailed feedback on the resume, including strengths, areas for improvement, formatting suggestions, content recommendations, etc."
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {reviewFeedback.length} characters
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end gap-3">
                            <button
                                onClick={handleCloseReviewModal}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                                className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {submittingReview ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-4 w-4" />
                                        Save Review
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilesManagement;
