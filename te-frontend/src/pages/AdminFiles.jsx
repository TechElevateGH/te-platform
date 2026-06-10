import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
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
} from 'icons';

const AdminFiles = () => {
    const { accessToken, userRole } = useAuth();
    const toast = useToast();
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
            const response = await axiosInstance.get('/resumes/reviews', {
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
            await axiosInstance.patch(`/resumes/reviews?review_id=${reviewId}`, {
                status: 'In Review'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success(`Review assigned to ${reviewerName} successfully!`);
            fetchResumeReviews();
            setAssigningReview(null);
        } catch (error) {
            console.error('Error assigning review:', error);
            toast.error('Failed to assign review.');
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
            await axiosInstance.patch(`/resumes/reviews?review_id=${selectedReview.id}`, {
                feedback: reviewFeedback,
                status: reviewStatus
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success('Review updated successfully!');
            fetchResumeReviews();
            handleCloseReviewModal();
        } catch (error) {
            console.error('Error updating review:', error);
            toast.error('Failed to update review.');
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
            <div className="flex min-h-screen items-center justify-center bg-[var(--te-bg)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                        <FolderIcon className="h-6 w-6 animate-pulse text-te-green" />
                    </div>
                    <Loading />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen h-full bg-[var(--te-bg)] transition-colors">
            {/* Header with Stats and Actions */}
            <header className="sticky top-0 z-10 border-b border-[var(--te-border)] bg-[var(--te-surface)] transition-colors">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="te-eyebrow mb-2">{'// files'}</p>
                            <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight text-[var(--te-text)]">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                    <FolderIcon className="h-5 w-5 text-te-green" />
                                </span>
                                Member Files & Resume Reviews
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--te-text-dim)]">
                                Manage member files, essays, and assign resume review requests
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Column Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                                    className="te-btn-secondary te-btn-sm"
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

                                        <div className="absolute right-0 mt-2 w-64 bg-[var(--te-surface)] border border-[var(--te-border)] rounded-lg  z-20">
                                            <div className="p-3 border-b border-[var(--te-border)]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-sm font-bold text-[var(--te-text)]">
                                                        Manage Columns
                                                    </h3>
                                                    <button
                                                        onClick={() => setShowColumnSelector(false)}
                                                        className="te-icon-btn"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={showAllColumns}
                                                        className="te-btn-ghost te-btn-sm flex-1"
                                                    >
                                                        Show All
                                                    </button>
                                                    <button
                                                        onClick={resetColumns}
                                                        className="te-btn-secondary te-btn-sm flex-1"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-2 max-h-80 overflow-y-auto">
                                                {columnConfig.map(column => (
                                                    <label
                                                        key={column.key}
                                                        className="flex items-center gap-2 px-2 py-2 hover:bg-[var(--te-hover)] rounded cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={visibleColumns[column.key]}
                                                            onChange={() => toggleColumn(column.key)}
                                                            className="h-4 w-4 text-[var(--te-text)] border-[var(--te-border)] rounded focus:ring-2 focus:ring-[var(--te-ring)]"
                                                        />
                                                        <span className="text-sm text-[var(--te-text)] flex-1">
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
                                className="te-btn-secondary te-btn-sm"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                Export CSV
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="sticky top-[105px] z-10 border-b border-[var(--te-border)] bg-[var(--te-surface)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <nav className="flex gap-2 py-3">
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`te-btn-sm ${activeTab === 'files'
                                ? 'te-btn-primary'
                                : 'te-btn-secondary'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FolderIcon className="h-4 w-4" />
                                Member Files
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`te-btn-sm ${activeTab === 'reviews'
                                ? 'te-btn-primary'
                                : 'te-btn-secondary'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <DocumentTextIcon className="h-4 w-4 text-te-gold" />
                                Resume Reviews
                                {resumeReviews.filter(r => r.status === 'Pending').length > 0 && (
                                    <span className="te-chip-gold text-xs">
                                        {resumeReviews.filter(r => r.status === 'Pending').length}
                                    </span>
                                )}
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

                {activeTab === 'files' && (
                    <>
                        {/* Stats Bar for Member Files */}
                        <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)] md:grid-cols-4">
                            <div className="bg-[var(--te-surface)] p-4">
                                <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                    <UserGroupIcon className="h-4 w-4 text-te-green" />
                                    <span className="font-mono text-[10px] uppercase tracking-wide">Members</span>
                                </div>
                                <span className="mt-2 block font-mono text-2xl font-bold text-te-green">{stats.totalUsers}</span>
                            </div>
                            <div className="bg-[var(--te-surface)] p-4">
                                <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                    <DocumentIcon className="h-4 w-4 text-te-gold" />
                                    <span className="font-mono text-[10px] uppercase tracking-wide">Resumes</span>
                                </div>
                                <span className="mt-2 block font-mono text-2xl font-bold text-te-gold">{stats.totalResumes}</span>
                            </div>
                            <div className="bg-[var(--te-surface)] p-4">
                                <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                    <DocumentIcon className="h-4 w-4 text-te-gold" />
                                    <span className="font-mono text-[10px] uppercase tracking-wide">Essays</span>
                                </div>
                                <span className="mt-2 block font-mono text-2xl font-bold text-te-gold">{stats.totalEssays}</span>
                            </div>
                            <div className="bg-[var(--te-surface)] p-4">
                                <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                    <ChartBarIcon className="h-4 w-4 text-te-green" />
                                    <span className="font-mono text-[10px] uppercase tracking-wide">Total Files</span>
                                </div>
                                <span className="mt-2 block font-mono text-2xl font-bold text-te-green">{stats.totalFiles}</span>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="te-card p-3 mb-3 transition-colors">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                {/* Member Filter */}
                                <div className="md:col-span-5">
                                    <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1.5">
                                        Member Name or Email
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Filter by member name or email..."
                                        value={memberFilter}
                                        onChange={(e) => setMemberFilter(e.target.value)}
                                        className="te-input"
                                    />
                                </div>

                                {/* File Type Filter */}
                                <div className="md:col-span-3">
                                    <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1.5">
                                        File Type
                                    </label>
                                    <select
                                        value={fileTypeFilter}
                                        onChange={(e) => setFileTypeFilter(e.target.value)}
                                        className="te-select"
                                    >
                                        <option value="">All Types</option>
                                        <option value="resume">Resumes Only</option>
                                        <option value="essay">Essays Only</option>
                                    </select>
                                </div>

                                {/* Sort Dropdown */}
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1.5">
                                        Sort by
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="te-select"
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
                                <div className="mt-3 pt-3 border-t border-[var(--te-border)] flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {memberFilter && (
                                            <span className="inline-flex items-center gap-1 te-chip text-xs">
                                                Member: {memberFilter}
                                            </span>
                                        )}
                                        {fileTypeFilter && (
                                            <span className="inline-flex items-center gap-1 te-chip text-xs">
                                                Type: {fileTypeFilter === 'resume' ? 'Resumes' : 'Essays'}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={clearAllFilters}
                                        className="te-btn-danger te-btn-sm"
                                    >
                                        <XMarkIcon className="h-3.5 w-3.5" />
                                        Clear All
                                    </button>
                                </div>
                            )}

                            {/* Results Count */}
                            <div className="mt-3 font-mono text-xs font-medium uppercase tracking-wide text-[var(--te-text-dim)]">
                                Showing {sortedUsers.length} of {users.filter(u => u.resumes?.length > 0 || u.essays?.length > 0).length} members with files
                            </div>
                        </div>

                        {/* Mobile Member Cards */}
                        <div className="space-y-3 md:hidden">
                            {sortedUsers.length === 0 ? (
                                <div className="border border-dashed border-[var(--te-border)] rounded-lg bg-[var(--te-surface)] p-6 text-center">
                                    <FolderIcon className="h-8 w-8 text-[var(--te-text-dim)] mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-[var(--te-text)]">No files found</p>
                                    <p className="text-xs text-[var(--te-text-dim)]">Try adjusting your filters</p>
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
                                            className="bg-[var(--te-surface)] rounded-lg border border-[var(--te-border)]  p-4 space-y-3 cursor-pointer transition hover:border-[var(--te-border-strong)] "
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
                                                    <p className="text-sm font-semibold text-[var(--te-text)]">{user.full_name || 'Unnamed Member'}</p>
                                                    <p className="text-xs text-[var(--te-text-dim)]">{user.email || 'No email provided'}</p>
                                                </div>
                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-lg bg-[var(--te-surface-alt)] text-[var(--te-text)] border border-[var(--te-border)]">
                                                    {totalFiles} file{totalFiles === 1 ? '' : 's'}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2 text-xs font-semibold">
                                                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-[var(--te-surface-alt)] text-[var(--te-text)] border border-[var(--te-border)]">
                                                    Resumes: {resumeCount}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-[var(--te-surface-alt)] text-[var(--te-text)] border border-[var(--te-border)]">
                                                    Essays: {essayCount}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-[var(--te-text-dim)]">Tap to view details</span>
                                                {resumeCount > 0 ? (
                                                    <a
                                                        href={user.resumes[0].url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--te-surface-alt)] text-[var(--te-text)] font-semibold"
                                                    >
                                                        <EyeIcon className="h-3.5 w-3.5" />
                                                        Latest Resume
                                                    </a>
                                                ) : (
                                                    <span className="text-[var(--te-text-dim)]">No resumes yet</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Files Table */}
                        <div className="te-card hidden overflow-hidden transition-colors md:block">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                            {visibleColumns.member && (
                                                <th className="px-3 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">
                                                    Member
                                                </th>
                                            )}
                                            {visibleColumns.email && (
                                                <th className="px-3 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">
                                                    Email
                                                </th>
                                            )}
                                            {visibleColumns.resumes && (
                                                <th className="px-3 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">
                                                    Resumes
                                                </th>
                                            )}
                                            {visibleColumns.essays && (
                                                <th className="px-3 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">
                                                    Essays
                                                </th>
                                            )}
                                            {visibleColumns.totalFiles && (
                                                <th className="px-3 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">
                                                    Total
                                                </th>
                                            )}
                                            {visibleColumns.actions && (
                                                <th className="px-3 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--te-border)]">
                                        {sortedUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={Math.max(visibleColumnCount, 1)} className="px-3 py-6 text-center">
                                                    <FolderIcon className="h-8 w-8 text-[var(--te-text-dim)] mx-auto mb-2" />
                                                    <p className="text-sm font-medium text-[var(--te-text)]">No files found</p>
                                                    <p className="text-xs text-[var(--te-text-dim)] mt-0.5">
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
                                                    className="hover:bg-[var(--te-hover)] transition-all cursor-pointer"
                                                >
                                                    {visibleColumns.member && (
                                                        <td className="px-3 py-2">
                                                            <span className="text-xs font-semibold text-[var(--te-text)]">
                                                                {user.full_name}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.email && (
                                                        <td className="px-3 py-2">
                                                            <span className="text-xs text-[var(--te-text-dim)]">
                                                                {user.email}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.resumes && (
                                                        <td className="px-3 py-2">
                                                            <span className="te-chip-gold text-xs">
                                                                {user.resumes?.length || 0}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.essays && (
                                                        <td className="px-3 py-2">
                                                            <span className="te-chip-gold text-xs">
                                                                {user.essays?.length || 0}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.totalFiles && (
                                                        <td className="px-3 py-2">
                                                            <span className="te-chip-green text-xs">
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
                                                                        className="te-btn-ghost te-btn-sm"
                                                                    >
                                                                        <EyeIcon className="h-3.5 w-3.5" />
                                                                        View
                                                                    </a>
                                                                )}
                                                                {((user.resumes?.length || 0) + (user.essays?.length || 0)) > 0 && (
                                                                    <span className="text-xs text-[var(--te-text-dim)]">
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
                        <div className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)] md:grid-cols-4">
                            <div className="bg-[var(--te-surface)] p-4">
                                <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                    <ChartBarIcon className="h-4 w-4 text-te-green" />
                                    <span className="font-mono text-[10px] uppercase tracking-wide">Requests</span>
                                </div>
                                <span className="mt-2 block font-mono text-2xl font-bold text-te-green">{resumeReviews.length}</span>
                            </div>
                            <div className="bg-[var(--te-surface)] p-4">
                                <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                    <ClockIcon className="h-4 w-4 text-te-gold" />
                                    <span className="font-mono text-[10px] uppercase tracking-wide">Pending</span>
                                </div>
                                <span className="mt-2 block font-mono text-2xl font-bold text-te-gold">{resumeReviews.filter(r => r.status === 'Pending').length}</span>
                            </div>
                            <div className="bg-[var(--te-surface)] p-4">
                                <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                    <DocumentTextIcon className="h-4 w-4 text-te-gold" />
                                    <span className="font-mono text-[10px] uppercase tracking-wide">In Review</span>
                                </div>
                                <span className="mt-2 block font-mono text-2xl font-bold text-te-gold">{resumeReviews.filter(r => r.status === 'In Review').length}</span>
                            </div>
                            <div className="bg-[var(--te-surface)] p-4">
                                <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                    <CheckCircleIcon className="h-4 w-4 text-te-green" />
                                    <span className="font-mono text-[10px] uppercase tracking-wide">Completed</span>
                                </div>
                                <span className="mt-2 block font-mono text-2xl font-bold text-te-green">{resumeReviews.filter(r => r.status === 'Completed').length}</span>
                            </div>
                        </div>

                        <div className="te-card overflow-hidden transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                            <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">Member</th>
                                            <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">Job Title</th>
                                            <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">Level</th>
                                            <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">Status</th>
                                            <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">Submitted</th>
                                            <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">Reviewer</th>
                                            {isAdmin && (
                                                <th className="px-4 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">Actions</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--te-border)]">
                                        {resumeReviews.length === 0 ? (
                                            <tr>
                                                <td colSpan={isAdmin ? "7" : "6"} className="px-4 py-12 text-center text-sm text-[var(--te-text-dim)]">
                                                    No resume review requests found
                                                </td>
                                            </tr>
                                        ) : (
                                            resumeReviews.map((review) => (
                                                <tr key={review.id} className="hover:bg-[var(--te-hover)] transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <div className="text-sm font-medium text-[var(--te-text)]">{review.user_name}</div>
                                                            <div className="text-xs text-[var(--te-text-dim)]">{review.user_email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-[var(--te-text)]">{review.job_title}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-start">
                                                            <span className="te-chip-gold text-xs">
                                                                {review.level}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-start">
                                                            <span className={`${review.status === 'Pending'
                                                                ? 'te-chip-gold text-xs'
                                                                : review.status === 'In Review'
                                                                    ? 'te-chip-gold text-xs'
                                                                    : review.status === 'Completed'
                                                                        ? 'te-chip-green text-xs'
                                                                        : 'te-chip-red text-xs'
                                                                }`}>
                                                                {review.status === 'Pending' && <ClockIcon className="h-3.5 w-3.5 text-te-gold" />}
                                                                {review.status === 'Completed' && <CheckCircleIcon className="h-3.5 w-3.5 text-te-green" />}
                                                                {review.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-[var(--te-text-dim)]">{review.submitted_date}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-[var(--te-text-dim)]">
                                                            {review.reviewer_name || 'Unassigned'}
                                                        </span>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-start gap-2">
                                                                <button
                                                                    onClick={() => handleViewReview(review)}
                                                                    className="te-btn-primary te-btn-sm"
                                                                >
                                                                    <EyeIcon className="h-3.5 w-3.5" />
                                                                    View
                                                                </button>
                                                                {review.status === 'Pending' && (
                                                                    <div className="relative">
                                                                        <button
                                                                            onClick={() => setAssigningReview(assigningReview === review.id ? null : review.id)}
                                                                            className="te-btn-primary te-btn-sm"
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
                                                                                <div className="absolute right-0 mt-2 w-64 te-card p-3 z-20 max-h-64 overflow-y-auto">
                                                                                    <h4 className="text-xs font-bold text-[var(--te-text)] mb-2">Assign to Reviewer</h4>
                                                                                    <div className="space-y-1">
                                                                                        {privilegedUsers.map(user => (
                                                                                            <button
                                                                                                key={user.id}
                                                                                                onClick={() => handleAssignReview(review.id, user.id, user.full_name)}
                                                                                                className="w-full text-left px-3 py-2 text-sm text-[var(--te-text)] hover:bg-[var(--te-hover)] rounded transition-colors"
                                                                                            >
                                                                                                <div className="font-medium">{user.full_name}</div>
                                                                                                <div className="text-xs text-[var(--te-text-dim)]">{user.email}</div>
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
                    className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
                    onClick={handleCloseMemberModal}
                >
                    <div
                        className="bg-[var(--te-surface)] rounded-lg  max-w-2xl w-full border border-[var(--te-border)] max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-[var(--te-border)] flex items-center justify-between sticky top-0 bg-[var(--te-surface)]">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Member</p>
                                <h3 className="text-xl font-bold text-[var(--te-text)]">{selectedMember.full_name || 'Member Details'}</h3>
                                <p className="text-sm text-[var(--te-text-dim)]">{selectedMember.email}</p>
                            </div>
                            <button
                                onClick={handleCloseMemberModal}
                                className="te-icon-btn"
                                aria-label="Close member details"
                            >
                                <XMarkIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-[var(--te-surface-alt)] rounded-lg p-3 border border-[var(--te-border)]">
                                    <p className="text-xs text-[var(--te-text-dim)]">Resumes</p>
                                    <p className="text-2xl font-bold text-[var(--te-text)]">{selectedMember.resumes?.length || 0}</p>
                                </div>
                                <div className="bg-[var(--te-surface-alt)] rounded-lg p-3 border border-[var(--te-border)]">
                                    <p className="text-xs text-[var(--te-text-dim)]">Essays</p>
                                    <p className="text-2xl font-bold text-[var(--te-text)]">{selectedMember.essays?.length || 0}</p>
                                </div>
                                <div className="bg-[var(--te-surface-alt)] rounded-lg p-3 border border-[var(--te-border)]">
                                    <p className="text-xs text-[var(--te-text-dim)]">Total Files</p>
                                    <p className="text-2xl font-bold text-[var(--te-text)]">
                                        {(selectedMember.resumes?.length || 0) + (selectedMember.essays?.length || 0)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-semibold text-[var(--te-text)] mb-2 flex items-center gap-2">
                                        <DocumentIcon className="h-4 w-4 text-[var(--te-text)]" />
                                        Resumes
                                    </h4>
                                    {selectedMember.resumes?.length ? (
                                        <div className="space-y-2">
                                            {selectedMember.resumes.map((resume, index) => (
                                                <div
                                                    key={resume.id || index}
                                                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--te-border)] bg-[var(--te-surface)]"
                                                >
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--te-text)]">
                                                            {resume.name || resume.file_name || `Resume ${index + 1}`}
                                                        </p>
                                                        {resume.uploaded_at && (
                                                            <p className="text-xs text-[var(--te-text-dim)]">Uploaded {resume.uploaded_at}</p>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={resume.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="te-btn-primary te-btn-sm"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        View
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[var(--te-text-dim)] italic">No resumes uploaded yet.</p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-[var(--te-text)] mb-2 flex items-center gap-2">
                                        <DocumentTextIcon className="h-4 w-4 text-[var(--te-text)]" />
                                        Essays
                                    </h4>
                                    {selectedMember.essays?.length ? (
                                        <div className="space-y-2">
                                            {selectedMember.essays.map((essay, index) => (
                                                <div
                                                    key={essay.id || index}
                                                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-[var(--te-border)] bg-[var(--te-surface)]"
                                                >
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--te-text)]">
                                                            {essay.name || essay.file_name || `Essay ${index + 1}`}
                                                        </p>
                                                        {essay.uploaded_at && (
                                                            <p className="text-xs text-[var(--te-text-dim)]">Uploaded {essay.uploaded_at}</p>
                                                        )}
                                                    </div>
                                                    <a
                                                        href={essay.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="te-btn-primary te-btn-sm"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        View
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-[var(--te-text-dim)] italic">No essays uploaded yet.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleCloseMemberModal}
                                    className="te-btn-secondary"
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
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={handleCloseReviewModal}
                >
                    <div
                        className="bg-[var(--te-surface)] rounded-lg  max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[var(--te-border)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 px-6 py-4 border-b border-[var(--te-border)] bg-[var(--te-surface)] z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--te-text)]">Resume Review Request</h3>
                                    <p className="text-sm text-[var(--te-text-dim)] mt-1">
                                        Submitted on {selectedReview.submitted_date}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseReviewModal}
                                    className="te-icon-btn"
                                >
                                    <XMarkIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Request Information */}
                            <div className="bg-[var(--te-surface-alt)] rounded-lg p-4 border border-[var(--te-border)]">
                                <h4 className="text-sm font-bold text-[var(--te-text)] mb-3">Request Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-[var(--te-text-dim)]">Member</label>
                                        <p className="text-sm font-semibold text-[var(--te-text)] mt-1">{selectedReview.user_name}</p>
                                        <p className="text-xs text-[var(--te-text-dim)]">{selectedReview.user_email}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--te-text-dim)]">Target Job Title</label>
                                        <p className="text-sm font-semibold text-[var(--te-text)] mt-1">{selectedReview.job_title}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--te-text-dim)]">Experience Level</label>
                                        <p className="text-sm font-semibold text-[var(--te-text)] mt-1">{selectedReview.level}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-[var(--te-text-dim)]">Current Status</label>
                                        <div className="mt-1">
                                            <span className={`${selectedReview.status === 'Pending'
                                                ? 'te-chip-gold text-xs'
                                                : selectedReview.status === 'In Review'
                                                    ? 'te-chip-gold text-xs'
                                                    : selectedReview.status === 'Completed'
                                                        ? 'te-chip-green text-xs'
                                                        : 'te-chip-red text-xs'
                                                }`}>
                                                {selectedReview.status}
                                            </span>
                                        </div>
                                    </div>
                                    {selectedReview.reviewer_name && (
                                        <div className="col-span-2">
                                            <label className="text-xs font-medium text-[var(--te-text-dim)]">Assigned To</label>
                                            <p className="text-sm font-semibold text-[var(--te-text)] mt-1">{selectedReview.reviewer_name}</p>
                                        </div>
                                    )}
                                    {selectedReview.notes && (
                                        <div className="col-span-2">
                                            <label className="text-xs font-medium text-[var(--te-text-dim)]">Member Notes</label>
                                            <p className="text-sm text-[var(--te-text)] mt-1">{selectedReview.notes}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-[var(--te-border)]">
                                    <a
                                        href={selectedReview.resume_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="te-btn-primary"
                                    >
                                        <DocumentIcon className="h-4 w-4 text-te-gold" />
                                        Open Resume
                                    </a>
                                </div>
                            </div>

                            {/* Review Form */}
                            <div className="bg-[var(--te-surface-alt)] rounded-lg p-4 border border-[var(--te-border)]">
                                <h4 className="text-sm font-bold text-[var(--te-text)] mb-3">Review & Feedback</h4>

                                {/* Status Selector */}
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-[var(--te-text)] mb-2">
                                        Update Status
                                    </label>
                                    <select
                                        value={reviewStatus}
                                        onChange={(e) => setReviewStatus(e.target.value)}
                                        className="te-select"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Review">In Review</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Declined">Declined</option>
                                    </select>
                                </div>

                                {/* Feedback Textarea */}
                                <div>
                                    <label className="block text-xs font-medium text-[var(--te-text)] mb-2">
                                        Feedback & Comments
                                    </label>
                                    <textarea
                                        value={reviewFeedback}
                                        onChange={(e) => setReviewFeedback(e.target.value)}
                                        rows={8}
                                        placeholder="Provide detailed feedback on the resume, including strengths, areas for improvement, formatting suggestions, content recommendations, etc."
                                        className="te-textarea"
                                    />
                                    <p className="text-xs text-[var(--te-text-dim)] mt-2">
                                        {reviewFeedback.length} characters
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 px-6 py-4 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)] flex items-center justify-end gap-3">
                            <button
                                onClick={handleCloseReviewModal}
                                className="te-btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={submittingReview}
                                className="te-btn-primary"
                            >
                                {submittingReview ? (
                                    <>
                                        <div className="animate-spin rounded-lg h-4 w-4 border-2 border-[var(--te-on-primary)] border-t-transparent" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-4 w-4 text-te-green" />
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
