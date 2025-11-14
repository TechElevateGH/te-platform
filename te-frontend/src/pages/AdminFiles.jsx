import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
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

const AdminFiles = () => {
    const { accessToken, userRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [resumeReviews, setResumeReviews] = useState([]);
    const [privilegedUsers, setPrivilegedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('adminFilesActiveTab') || 'files';
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState('');
    const [memberFilter, setMemberFilter] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [assigningReview, setAssigningReview] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [reviewStatus, setReviewStatus] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Check user role - Lead (4) and Admin (5) can access
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const isAdmin = userRoleInt === 5;
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

    // Persist activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('adminFilesActiveTab', activeTab);
    }, [activeTab]);

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
            const response = await axiosInstance.get('/resumes/reviews/all', {
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
            await axiosInstance.patch(`/resumes/reviews/${reviewId}`, {
                status: 'In Review'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            alert(`Review assigned to ${reviewerName} successfully!`);
            fetchResumeReviews();
            setAssigningReview(null);
        } catch (error) {
            console.error('Error assigning review:', error);
            alert('Failed to assign review.');
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

    const handleOpenMemberModal = (member) => {
        setSelectedMember(member);
        setShowMemberModal(true);
    };

    const handleCloseMemberModal = () => {
        setSelectedMember(null);
        setShowMemberModal(false);
    };

    // Submit review feedback
    const handleSubmitReview = async () => {
        if (!selectedReview) return;

        setSubmittingReview(true);
        try {
            await axiosInstance.patch(`/resumes/reviews/${selectedReview.id}`, {
                feedback: reviewFeedback,
                status: reviewStatus
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            alert('Review updated successfully!');
            fetchResumeReviews();
            handleCloseReviewModal();
        } catch (error) {
            console.error('Error updating review:', error);
            alert('Failed to update review.');
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
                                Member Files & Resume Reviews
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
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'files'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FolderIcon className="h-4 w-4" />
                                Member Files
                            </div>
                        </button>
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
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-3">

                {activeTab === 'files' && (
                    <>
                        {/* Stats Bar for Member Files */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
                            <div className="flex items-center gap-6 flex-wrap text-xs">
                                <div className="flex items-center gap-2">
                                    <UserGroupIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <span className="font-medium text-gray-600 dark:text-gray-400">Members:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{stats.totalUsers}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DocumentIcon className="h-4 w-4 text-blue-500" />
                                    <span className="font-medium text-blue-600 dark:text-blue-400">Resumes:</span>
                                    <span className="font-bold text-blue-700 dark:text-blue-400">{stats.totalResumes}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DocumentIcon className="h-4 w-4 text-purple-500" />
                                    <span className="font-medium text-purple-600 dark:text-purple-400">Essays:</span>
                                    <span className="font-bold text-purple-700 dark:text-purple-400">{stats.totalEssays}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ChartBarIcon className="h-4 w-4 text-green-500" />
                                    <span className="font-medium text-green-600 dark:text-green-400">Total Files:</span>
                                    <span className="font-bold text-green-700 dark:text-green-400">{stats.totalFiles}</span>
                                </div>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                {/* Member Filter */}
                                <div className="md:col-span-5">
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
                                <div className="md:col-span-3">
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
                                <div className="md:col-span-4">
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

                            {/* Results Count */}
                            <div className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
                                Showing {sortedUsers.length} of {users.filter(u => u.resumes?.length > 0 || u.essays?.length > 0).length} members with files
                            </div>
                        </div>

                        {/* Mobile Member Cards */}
                        <div className="space-y-3 md:hidden">
                            {sortedUsers.length === 0 ? (
                                <div className="border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 p-6 text-center">
                                    <FolderIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">No files found</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
                                </div>
                            ) : (
                                sortedUsers.map(user => {
                                    const resumeCount = user.resumes?.length || 0;
                                    const essayCount = user.essays?.length || 0;
                                    const totalFiles = resumeCount + essayCount;

                                    return (
                                        <div
                                            key={user.id}
                                            onClick={() => handleOpenMemberModal(user)}
                                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 space-y-3 cursor-pointer transition hover:border-blue-300 dark:hover:border-blue-500"
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleOpenMemberModal(user);
                                                }
                                            }}
                                            aria-label={`View files for ${user.full_name || 'member'}`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.full_name || 'Unnamed Member'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email || 'No email provided'}</p>
                                                </div>
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400">
                                                    {totalFiles} file{totalFiles === 1 ? '' : 's'}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                                    Resumes: {resumeCount}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300">
                                                    Essays: {essayCount}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-500 dark:text-gray-400">Tap to view details</span>
                                                {resumeCount > 0 ? (
                                                    <a
                                                        href={user.resumes[0].url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-semibold"
                                                    >
                                                        <EyeIcon className="h-3.5 w-3.5" />
                                                        Latest Resume
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">No resumes yet</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Files Table */}
                        <div className="hidden md:block bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
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
                                                <td colSpan={Math.max(visibleColumnCount, 1)} className="px-3 py-6 text-center">
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
                                                    onClick={() => handleOpenMemberModal(user)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            handleOpenMemberModal(user);
                                                        }
                                                    }}
                                                    tabIndex={0}
                                                    role="button"
                                                    aria-label={`View files for ${user.full_name || 'member'}`}
                                                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all cursor-pointer"
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
                                                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center gap-2">
                                                                {user.resumes && user.resumes.length > 0 && (
                                                                    <a
                                                                        href={user.resumes[0].url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        onClick={(e) => e.stopPropagation()}
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
                        {/* Stats Bar for Resume Reviews */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
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
                                        {resumeReviews.length === 0 ? (
                                            <tr>
                                                <td colSpan={isAdmin ? "7" : "6"} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No resume review requests found
                                                </td>
                                            </tr>
                                        ) : (
                                            resumeReviews.map((review) => (
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

            </div>

            {/* Member Detail Modal */}
            {showMemberModal && selectedMember && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
                    onClick={handleCloseMemberModal}
                >
                    <div
                        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Member</p>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMember.full_name || 'Member Details'}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedMember.email}</p>
                            </div>
                            <button
                                onClick={handleCloseMemberModal}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Close member details"
                            >
                                <XMarkIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Resumes</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedMember.resumes?.length || 0}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Essays</p>
                                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedMember.essays?.length || 0}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Files</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {(selectedMember.resumes?.length || 0) + (selectedMember.essays?.length || 0)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <DocumentIcon className="h-4 w-4 text-blue-500" />
                                        Resumes
                                    </h4>
                                    {selectedMember.resumes?.length ? (
                                        <div className="space-y-2">
                                            {selectedMember.resumes.map((resume, index) => (
                                                <div
                                                    key={resume.id || index}
                                                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                                >
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {resume.name || resume.file_name || `Resume ${index + 1}`}
                                                        </p>
                                                        {resume.uploaded_at && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded {resume.uploaded_at}</p>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={resume.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        View
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No resumes uploaded yet.</p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <DocumentTextIcon className="h-4 w-4 text-purple-500" />
                                        Essays
                                    </h4>
                                    {selectedMember.essays?.length ? (
                                        <div className="space-y-2">
                                            {selectedMember.essays.map((essay, index) => (
                                                <div
                                                    key={essay.id || index}
                                                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                                >
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {essay.name || essay.file_name || `Essay ${index + 1}`}
                                                        </p>
                                                        {essay.uploaded_at && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded {essay.uploaded_at}</p>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={essay.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        View
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No essays uploaded yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleCloseMemberModal}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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

export default AdminFiles;
