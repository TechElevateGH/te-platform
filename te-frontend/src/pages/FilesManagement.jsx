import { useState, useEffect, useCallback, useMemo } from 'react';
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
    ClockIcon,
    AdjustmentsHorizontalIcon,
    MagnifyingGlassIcon,
    ChevronUpIcon,
    ChevronRightIcon
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

    // Default tab: Resumes for Lead+, Reviews for Volunteer - persist across refreshes
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem('filesManagementActiveTab') || (userRoleInt >= 4 ? 'resumes' : 'reviews');
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState('');
    const [memberFilter, setMemberFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [assigningReview, setAssigningReview] = useState(null);
    const [assigningInProgress, setAssigningInProgress] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [reviewStatus, setReviewStatus] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [resumeReviewStatusFilter, setResumeReviewStatusFilter] = useState('active'); // Default to Pending + In Review
    const [toast, setToast] = useState(null);
    const [myAssignedReviews, setMyAssignedReviews] = useState([]);
    const [allAssignments, setAllAssignments] = useState([]);

    // User details modal state
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);

    // My Assignments filters
    const [showAdvancedMyAssignmentsFilters, setShowAdvancedMyAssignmentsFilters] = useState(false);
    const [myAssignmentsStatusFilter, setMyAssignmentsStatusFilter] = useState('');
    const [myAssignmentsLevelFilter, setMyAssignmentsLevelFilter] = useState('');
    const [myAssignmentsMemberFilter, setMyAssignmentsMemberFilter] = useState('');
    const [myAssignmentsJobTitleFilter, setMyAssignmentsJobTitleFilter] = useState('');
    const [myAssignmentsSortBy, setMyAssignmentsSortBy] = useState('date_desc');

    // All Assignments filters
    const [showAdvancedAssignmentFilters, setShowAdvancedAssignmentFilters] = useState(false);
    const [assignmentsStatusFilter, setAssignmentsStatusFilter] = useState('');
    const [assignmentsLevelFilter, setAssignmentsLevelFilter] = useState('');
    const [assignmentsReviewerFilter, setAssignmentsReviewerFilter] = useState('');
    const [assignmentsMemberSearch, setAssignmentsMemberSearch] = useState('');
    const [assignmentsDateRange, setAssignmentsDateRange] = useState({ start: '', end: '' });
    const [assignmentsSortBy, setAssignmentsSortBy] = useState('date_desc');

    // Resumes tab filters
    const [showAdvancedResumesFilters, setShowAdvancedResumesFilters] = useState(false);

    // Essays tab filters
    const [essaysSearch, setEssaysSearch] = useState('');
    const [essaysSortBy, setEssaysSortBy] = useState('name_asc');

    // Column visibility state - default visible columns
    const [visibleColumns, setVisibleColumns] = useState({
        member: true,
        email: true,
        resumes: true,
        essays: false,
        totalFiles: true,
        actions: false
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
        localStorage.setItem('filesManagementActiveTab', activeTab);
    }, [activeTab]);

    // Fetch all users with their files
    const fetchAllUsersFiles = useCallback(async () => {
        setLoading(true);
        try {
            console.log('Fetching all users files from /users/files/all...');
            // This endpoint should return all users with their files
            const response = await axiosInstance.get('/users/files/all', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log('Users files response:', response.data);
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users files:', error);
            console.error('Error details:', error.response?.data || error.message);
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
            console.log('Fetching privileged users...');
            const response = await axiosInstance.get('/users/privileged', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            console.log('Privileged users response:', response.data);
            // Backend already filters for Volunteers (role=3) and Leads (role=4)
            setPrivilegedUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching privileged users:', error);
            console.error('Error details:', error.response?.data);
        }
    }, [accessToken]);

    // Fetch my assigned reviews (for Volunteers and Leads)
    const fetchMyAssignedReviews = useCallback(async () => {
        if (!isVolunteerOrAbove) return;

        try {
            const response = await axiosInstance.get('/resumes/reviews/my-assignments', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setMyAssignedReviews(response.data?.reviews || []);
        } catch (error) {
            console.error('Error fetching my assigned reviews:', error);
        }
    }, [accessToken, isVolunteerOrAbove]);

    // Fetch all assignments (for Admin)
    const fetchAllAssignments = useCallback(async () => {
        if (!isAdmin) return;

        try {
            const response = await axiosInstance.get('/resumes/reviews/assignments', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setAllAssignments(response.data?.assignments || []);
        } catch (error) {
            console.error('Error fetching all assignments:', error);
        }
    }, [accessToken, isAdmin]);

    useEffect(() => {
        if (accessToken) {
            console.log('FilesManagement mounted, fetching data...');
            console.log('User role:', userRoleInt, 'isLeadOrAbove:', isLeadOrAbove);
            fetchAllUsersFiles();
            fetchResumeReviews();
            fetchPrivilegedUsers();
            fetchMyAssignedReviews();
            if (isAdmin) {
                fetchAllAssignments();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]);

    // Debug: Log when privilegedUsers changes
    useEffect(() => {
        console.log('Privileged users state updated:', privilegedUsers);
        console.log('Privileged users count:', privilegedUsers.length);
    }, [privilegedUsers]);

    // Assign review to a reviewer
    const handleAssignReview = async (reviewId, reviewerId, reviewerName) => {
        setAssigningInProgress(true);
        try {
            await axiosInstance.post(`/resumes/reviews/${reviewId}/assign`, {
                reviewer_id: reviewerId,
                reviewer_name: reviewerName
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setToast({ message: `Review assigned to ${reviewerName}`, type: 'success' });
            fetchResumeReviews();
            setAssigningReview(null);
        } catch (error) {
            console.error('Error assigning review:', error);
            setToast({ message: error.response?.data?.detail || 'Failed to assign review', type: 'error' });
        } finally {
            setAssigningInProgress(false);
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

    // Open user details modal
    const handleUserClick = (user) => {
        setSelectedUser(user);
        setShowUserDetailsModal(true);
    };

    // Close user details modal
    const handleCloseUserDetailsModal = () => {
        setShowUserDetailsModal(false);
        setSelectedUser(null);
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

    // Get unique reviewers from all assignments
    const uniqueReviewers = useMemo(() => {
        const reviewerSet = new Set();
        allAssignments.forEach(assignment => {
            if (assignment.reviewer_name) {
                reviewerSet.add(assignment.reviewer_name);
            }
        });
        return Array.from(reviewerSet).sort();
    }, [allAssignments]);

    // Filter and sort All Assignments
    const filteredAndSortedAssignments = useMemo(() => {
        let filtered = [...allAssignments];

        // Status filter
        if (assignmentsStatusFilter) {
            filtered = filtered.filter(a => a.status === assignmentsStatusFilter);
        }

        // Level filter
        if (assignmentsLevelFilter) {
            filtered = filtered.filter(a => a.level === assignmentsLevelFilter);
        }

        // Reviewer filter
        if (assignmentsReviewerFilter) {
            filtered = filtered.filter(a => a.reviewer_name === assignmentsReviewerFilter);
        }

        // Member search (name or email)
        if (assignmentsMemberSearch.trim()) {
            const search = assignmentsMemberSearch.toLowerCase().trim();
            filtered = filtered.filter(a =>
                a.user_name?.toLowerCase().includes(search) ||
                a.user_email?.toLowerCase().includes(search) ||
                a.job_title?.toLowerCase().includes(search)
            );
        }

        // Date range filter
        if (assignmentsDateRange.start) {
            const startDate = new Date(assignmentsDateRange.start);
            filtered = filtered.filter(a => {
                const assignedDate = new Date(a.assigned_date);
                return assignedDate >= startDate;
            });
        }
        if (assignmentsDateRange.end) {
            const endDate = new Date(assignmentsDateRange.end);
            endDate.setHours(23, 59, 59); // Include the entire end date
            filtered = filtered.filter(a => {
                const assignedDate = new Date(a.assigned_date);
                return assignedDate <= endDate;
            });
        }

        // Sort
        filtered.sort((a, b) => {
            switch (assignmentsSortBy) {
                case 'date_asc':
                    return new Date(a.assigned_date) - new Date(b.assigned_date);
                case 'date_desc':
                    return new Date(b.assigned_date) - new Date(a.assigned_date);
                case 'member_asc':
                    return (a.user_name || '').localeCompare(b.user_name || '');
                case 'member_desc':
                    return (b.user_name || '').localeCompare(a.user_name || '');
                case 'status_asc':
                    return (a.status || '').localeCompare(b.status || '');
                case 'status_desc':
                    return (b.status || '').localeCompare(a.status || '');
                default:
                    return new Date(b.assigned_date) - new Date(a.assigned_date);
            }
        });

        return filtered;
    }, [allAssignments, assignmentsStatusFilter, assignmentsLevelFilter, assignmentsReviewerFilter,
        assignmentsMemberSearch, assignmentsDateRange, assignmentsSortBy]);

    // Analytics for All Assignments
    const assignmentsAnalytics = useMemo(() => {
        const analytics = {
            total: filteredAndSortedAssignments.length,
            byStatus: {},
            byLevel: {},
            byReviewer: {},
            avgCompletionTime: null,
            completedCount: 0
        };

        filteredAndSortedAssignments.forEach(assignment => {
            // Count by status
            analytics.byStatus[assignment.status] = (analytics.byStatus[assignment.status] || 0) + 1;

            // Count by level
            analytics.byLevel[assignment.level] = (analytics.byLevel[assignment.level] || 0) + 1;

            // Count by reviewer
            if (assignment.reviewer_name) {
                analytics.byReviewer[assignment.reviewer_name] =
                    (analytics.byReviewer[assignment.reviewer_name] || 0) + 1;
            }

            // Track completed for completion time calculation
            if (assignment.status === 'Completed' && assignment.completed_date && assignment.assigned_date) {
                analytics.completedCount++;
                // Could calculate avg completion time here if we have completed_date
            }
        });

        return analytics;
    }, [filteredAndSortedAssignments]);

    // Filtered and sorted My Assignments
    const filteredMyAssignments = useMemo(() => {
        let filtered = myAssignedReviews.filter(review => {
            // Filter by status
            if (myAssignmentsStatusFilter && review.status !== myAssignmentsStatusFilter) {
                return false;
            }

            // Filter by level
            if (myAssignmentsLevelFilter && review.level !== myAssignmentsLevelFilter) {
                return false;
            }

            // Filter by member name or email
            if (myAssignmentsMemberFilter) {
                const searchLower = myAssignmentsMemberFilter.toLowerCase();
                const matchesName = review.user_name?.toLowerCase().includes(searchLower);
                const matchesEmail = review.user_email?.toLowerCase().includes(searchLower);
                if (!matchesName && !matchesEmail) {
                    return false;
                }
            }

            // Filter by job title
            if (myAssignmentsJobTitleFilter) {
                const searchLower = myAssignmentsJobTitleFilter.toLowerCase();
                if (!review.job_title?.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (myAssignmentsSortBy) {
                case 'date_asc':
                    return new Date(a.assigned_date) - new Date(b.assigned_date);
                case 'date_desc':
                    return new Date(b.assigned_date) - new Date(a.assigned_date);
                case 'name_asc':
                    return (a.user_name || '').localeCompare(b.user_name || '');
                case 'name_desc':
                    return (b.user_name || '').localeCompare(a.user_name || '');
                case 'status_asc':
                    return (a.status || '').localeCompare(b.status || '');
                case 'status_desc':
                    return (b.status || '').localeCompare(a.status || '');
                default:
                    return new Date(b.assigned_date) - new Date(a.assigned_date);
            }
        });

        return filtered;
    }, [myAssignedReviews, myAssignmentsStatusFilter, myAssignmentsLevelFilter, myAssignmentsMemberFilter, myAssignmentsJobTitleFilter, myAssignmentsSortBy]);

    // Clear My Assignments filters
    const clearMyAssignmentsFilters = () => {
        setMyAssignmentsStatusFilter('');
        setMyAssignmentsLevelFilter('');
        setMyAssignmentsMemberFilter('');
        setMyAssignmentsJobTitleFilter('');
    };

    const hasActiveMyAssignmentsFilters = myAssignmentsStatusFilter || myAssignmentsLevelFilter || myAssignmentsMemberFilter || myAssignmentsJobTitleFilter;

    // Filtered and sorted Essays
    const filteredEssays = useMemo(() => {
        // Get users with essays
        let usersWithEssays = users.filter(u => u.referral_essay || u.cover_letter);

        // Apply search filter (name or email)
        if (essaysSearch) {
            const searchLower = essaysSearch.toLowerCase();
            usersWithEssays = usersWithEssays.filter(u =>
                u.full_name?.toLowerCase().includes(searchLower) ||
                u.email?.toLowerCase().includes(searchLower)
            );
        }

        // Sort
        usersWithEssays.sort((a, b) => {
            switch (essaysSortBy) {
                case 'name_asc':
                    return (a.full_name || '').localeCompare(b.full_name || '');
                case 'name_desc':
                    return (b.full_name || '').localeCompare(a.full_name || '');
                case 'email_asc':
                    return (a.email || '').localeCompare(b.email || '');
                case 'email_desc':
                    return (b.email || '').localeCompare(a.email || '');
                default:
                    return (a.full_name || '').localeCompare(b.full_name || '');
            }
        });

        return usersWithEssays;
    }, [users, essaysSearch, essaysSortBy]);

    // Clear all assignment filters
    const clearAssignmentFilters = () => {
        setAssignmentsStatusFilter('');
        setAssignmentsLevelFilter('');
        setAssignmentsReviewerFilter('');
        setAssignmentsMemberSearch('');
        setAssignmentsDateRange({ start: '', end: '' });
    };

    const hasActiveAssignmentFilters =
        assignmentsStatusFilter || assignmentsLevelFilter || assignmentsReviewerFilter ||
        assignmentsMemberSearch || assignmentsDateRange.start || assignmentsDateRange.end;

    // Export assignments to CSV
    const exportAssignmentsToCSV = () => {
        const headers = ['Member Name', 'Email', 'Job Title', 'Level', 'Assigned To', 'Status', 'Assigned Date'];
        const csvData = filteredAndSortedAssignments.map(a => [
            a.user_name || '',
            a.user_email || '',
            a.job_title || '',
            a.level || '',
            a.reviewer_name || '',
            a.status || '',
            a.assigned_date || ''
        ]);

        const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assignments_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

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
        <div className="min-h-screen h-full bg-gray-50 dark:bg-gray-900 transition-colors overflow-x-hidden">
            {/* Header with Stats and Actions */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FolderIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-500 flex-shrink-0" />
                                <span className="truncate">Resumes & Essays</span>
                            </h1>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 hidden sm:block">
                                Manage member files, essays, and assign resume review requests
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                                onClick={exportToCSV}
                                disabled={sortedUsers.length === 0}
                                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowDownTrayIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[56px] sm:top-[72px] z-10 overflow-x-auto scrollbar-hide">
                <div className="max-w-7xl mx-auto px-3 sm:px-4">
                    <nav className="flex gap-2 sm:gap-4">
                        {/* Resumes Tab - Only Lead+ */}
                        {userRoleInt >= 4 && (
                            <button
                                onClick={() => setActiveTab('resumes')}
                                className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'resumes'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <FolderIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    Resumes
                                </div>
                            </button>
                        )}

                        {/* Resume Reviews Tab - Volunteer+ */}
                        {userRoleInt >= 3 && (
                            <button
                                onClick={() => setActiveTab('reviews')}
                                className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'reviews'
                                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <DocumentTextIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Resume Reviews</span>
                                    <span className="sm:hidden">Reviews</span>
                                    {resumeReviews.filter(r => r.status === 'Pending').length > 0 && (
                                        <span className="px-1.5 sm:px-2 py-0.5 text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                            {resumeReviews.filter(r => r.status === 'Pending').length}
                                        </span>
                                    )}
                                </div>
                            </button>
                        )}

                        {/* My Assignments Tab - Volunteer+ */}
                        {userRoleInt >= 3 && (
                            <button
                                onClick={() => setActiveTab('myAssignments')}
                                className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'myAssignments'
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <UserCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">My Assignments</span>
                                    <span className="sm:hidden">My Work</span>
                                    {myAssignedReviews.length > 0 && (
                                        <span className="px-1.5 sm:px-2 py-0.5 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                                            {myAssignedReviews.length}
                                        </span>
                                    )}
                                </div>
                            </button>
                        )}

                        {/* All Assignments Tab - Admin only */}
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('allAssignments')}
                                className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'allAssignments'
                                    ? 'border-pink-600 text-pink-600 dark:text-pink-400'
                                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <UserGroupIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">All Assignments</span>
                                    <span className="sm:hidden">All Work</span>
                                    {allAssignments.length > 0 && (
                                        <span className="px-1.5 sm:px-2 py-0.5 text-xs font-bold bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full">
                                            {allAssignments.length}
                                        </span>
                                    )}
                                </div>
                            </button>
                        )}
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">

                {activeTab === 'resumes' && (
                    <>
                        {/* Unified Bar: Stats + Search + Sort + Filters */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2 mb-3 transition-colors">
                            <div className="flex items-center gap-2">
                                {/* Stats */}
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <UserGroupIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                        <span className="font-bold text-gray-900 dark:text-white">{users.filter(u => u.resumes && u.resumes.length > 0).length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <DocumentIcon className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                        <span className="font-bold text-blue-700 dark:text-blue-400">{stats.totalResumes}</span>
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="flex-1 relative min-w-0">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                {/* Sort */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-2 sm:px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                >
                                    <option value="name_asc">Name (A-Z)</option>
                                    <option value="name_desc">Name (Z-A)</option>
                                    <option value="email_asc">Email (A-Z)</option>
                                    <option value="email_desc">Email (Z-A)</option>
                                    <option value="files_desc">Files (Most)</option>
                                    <option value="files_asc">Files (Least)</option>
                                </select>

                                {/* Filters Toggle */}
                                <button
                                    onClick={() => setShowAdvancedResumesFilters(!showAdvancedResumesFilters)}
                                    className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-2 text-xs font-medium rounded transition-colors whitespace-nowrap ${showAdvancedResumesFilters
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <AdjustmentsHorizontalIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {(memberFilter || fileTypeFilter) && (
                                        <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                                            {[memberFilter, fileTypeFilter].filter(Boolean).length}
                                        </span>
                                    )}
                                </button>

                                {/* Count */}
                                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:block">
                                    {sortedUsers.length} of {users.length}
                                </div>
                            </div>
                        </div>

                        {/* Advanced Filters Panel */}
                        {showAdvancedResumesFilters && (
                            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <AdjustmentsHorizontalIcon className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Advanced Filters</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
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
                                                <option value="name_asc">Name (A-Z)</option>
                                                <option value="name_desc">Name (Z-A)</option>
                                                <option value="email_asc">Email (A-Z)</option>
                                                <option value="email_desc">Email (Z-A)</option>
                                                <option value="files_desc">Files (Most)</option>
                                                <option value="files_asc">Files (Least)</option>
                                            </select>
                                        </div>
                                        {/* Results Count */}
                                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                            {sortedUsers.length} of {users.length}
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
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Search Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Search Members
                                        </label>
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Member Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Filter by Member
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Name or email..."
                                            value={memberFilter}
                                            onChange={(e) => setMemberFilter(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Hint Text */}
                        <div className="mb-2 px-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                💡 Click on any row to view member files
                            </p>
                        </div>

                        {/* Desktop Table - Hidden on mobile */}
                        <div className="hidden md:block bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Member
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Resumes
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {sortedUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-3 py-6 text-center">
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
                                                    onClick={() => handleUserClick(user)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            handleUserClick(user);
                                                        }
                                                    }}
                                                    tabIndex={0}
                                                    role="button"
                                                    aria-label={`View file details for ${user.full_name || 'member'}`}
                                                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all cursor-pointer"
                                                >
                                                    <td className="px-3 py-2 text-left">
                                                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                                            {user.full_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-left">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                                            {user.email}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-left">
                                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                                            {user.resumes?.length || 0}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Cards - Hidden on desktop */}
                        <div className="md:hidden space-y-2.5">
                            {sortedUsers.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                                    <FolderIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">No files found</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        {users.length === 0
                                            ? 'No members have uploaded files yet'
                                            : 'Try adjusting your filters'}
                                    </p>
                                </div>
                            ) : (
                                sortedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserClick(user)}
                                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    >
                                        {/* Card Header */}
                                        <div className="px-3 py-2.5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                        {user.full_name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                                        {user.resumes?.length || 0} resumes
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* Resume Reviews Tab */}
                {activeTab === 'reviews' && (
                    <>
                        {/* Unified Stats, Search & Filters Bar */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2 mb-3 transition-colors">
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Expanded Stats */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <ChartBarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">Total:</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{resumeReviews.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ClockIcon className="h-4 w-4 text-yellow-500" />
                                        <span className="text-yellow-600 dark:text-yellow-400 hidden sm:inline">Pending:</span>
                                        <span className="font-bold text-yellow-700 dark:text-yellow-400">{resumeReviews.filter(r => r.status === 'Pending').length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <DocumentTextIcon className="h-4 w-4 text-blue-500" />
                                        <span className="text-blue-600 dark:text-blue-400 hidden sm:inline">In Review:</span>
                                        <span className="font-bold text-blue-700 dark:text-blue-400">{resumeReviews.filter(r => r.status === 'In Review').length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                        <span className="text-green-600 dark:text-green-400 hidden sm:inline">Completed:</span>
                                        <span className="font-bold text-green-700 dark:text-green-400">{resumeReviews.filter(r => r.status === 'Completed').length}</span>
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="relative w-56 sm:w-80">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                                    />
                                </div>

                                {/* Status Filter Dropdown */}
                                <select
                                    value={resumeReviewStatusFilter}
                                    onChange={(e) => setResumeReviewStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[120px]"
                                >
                                    <option value="active">Active</option>
                                    <option value="">All</option>
                                    <option value="Pending">Pending</option>
                                    <option value="In Review">In Review</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Declined">Declined</option>
                                </select>

                                {/* Level Filter Dropdown */}
                                <select
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[120px]"
                                >
                                    <option value="">All Levels</option>
                                    <option value="Intern">Intern</option>
                                    <option value="Entry">Entry</option>
                                    <option value="Mid">Mid</option>
                                    <option value="Senior">Senior</option>
                                </select>

                                {/* Clear Filters Button */}
                                {(searchQuery || levelFilter || resumeReviewStatusFilter !== 'active') && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setLevelFilter('');
                                            setResumeReviewStatusFilter('active');
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                )}

                                {/* Results Count */}
                                <div className="hidden sm:block text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                    {filteredResumeReviews.length} of {resumeReviews.length}
                                </div>
                            </div>
                        </div>

                        {/* Hint Text */}
                        <div className="mb-2 px-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                💡 <strong>Click any row</strong> to view details {isLeadOrAbove && '• Use Assign button to assign reviewers'}
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm transition-colors overflow-visible">
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
                                            {isLeadOrAbove && (
                                                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredResumeReviews.length === 0 ? (
                                            <tr>
                                                <td colSpan={isLeadOrAbove ? "7" : "6"} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    No resume review requests found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredResumeReviews.map((review) => (
                                                <tr 
                                                    key={review.id} 
                                                    onClick={() => {
                                                        console.log('Row clicked:', review);
                                                        handleViewReview(review);
                                                    }}
                                                    className="hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors cursor-pointer border-b border-gray-100 dark:border-gray-700"
                                                >
                                                    <td className="px-4 py-3 text-left">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{review.user_name}</div>
                                                            <div className="text-xs text-gray-600 dark:text-gray-400">{review.user_email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{review.job_title}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                            {review.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
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
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">{review.submitted_date}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                                            {review.reviewer_name || 'Unassigned'}
                                                        </span>
                                                    </td>
                                                    {isLeadOrAbove && (
                                                        <td className="px-4 py-3 text-left">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {review.status !== 'Completed' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setAssigningReview(review);
                                                                        }}
                                                                        className="px-2.5 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                                                                    >
                                                                        <UserCircleIcon className="h-3.5 w-3.5" />
                                                                        {review.reviewer_id ? 'Re-assign' : 'Assign'}
                                                                    </button>
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

                {/* My Assignments Tab */}
                {activeTab === 'myAssignments' && (
                    <>
                        {/* Sort and Filters Bar */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2.5 mb-3 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                                {/* Sort Dropdown */}
                                <div className="flex-shrink-0">
                                    <select
                                        value={myAssignmentsSortBy}
                                        onChange={(e) => setMyAssignmentsSortBy(e.target.value)}
                                        className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                                    >
                                        <option value="date_desc">Newest First</option>
                                        <option value="date_asc">Oldest First</option>
                                        <option value="name_asc">Name (A-Z)</option>
                                        <option value="name_desc">Name (Z-A)</option>
                                        <option value="status_asc">Status (A-Z)</option>
                                        <option value="status_desc">Status (Z-A)</option>
                                    </select>
                                </div>

                                {/* Advanced Filters Button */}
                                <button
                                    onClick={() => setShowAdvancedMyAssignmentsFilters(!showAdvancedMyAssignmentsFilters)}
                                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                                    Filters
                                    {hasActiveMyAssignmentsFilters && (
                                        <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-blue-600 rounded-full">
                                            {[myAssignmentsStatusFilter, myAssignmentsLevelFilter, myAssignmentsMemberFilter, myAssignmentsJobTitleFilter].filter(Boolean).length}
                                        </span>
                                    )}
                                </button>

                                {/* Results Count */}
                                <div className="flex-1 text-right">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        <span className="font-semibold text-gray-900 dark:text-white">{filteredMyAssignments.length}</span> of{' '}
                                        <span className="font-semibold text-gray-900 dark:text-white">{myAssignedReviews.length}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Advanced Filters Panel */}
                            {showAdvancedMyAssignmentsFilters && (
                                <div className="mt-2.5 pt-2.5 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Filters</h4>
                                            {hasActiveMyAssignmentsFilters && (
                                                <button
                                                    onClick={clearMyAssignmentsFilters}
                                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                >
                                                    <XMarkIcon className="h-3 w-3" />
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setShowAdvancedMyAssignmentsFilters(false)}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                        >
                                            <ChevronUpIcon className="h-3.5 w-3.5" />
                                            Collapse
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {/* Member Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Member</label>
                                            <input
                                                type="text"
                                                value={myAssignmentsMemberFilter}
                                                onChange={(e) => setMyAssignmentsMemberFilter(e.target.value)}
                                                placeholder="Name or email..."
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                                            />
                                        </div>

                                        {/* Job Title Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Job Title</label>
                                            <input
                                                type="text"
                                                value={myAssignmentsJobTitleFilter}
                                                onChange={(e) => setMyAssignmentsJobTitleFilter(e.target.value)}
                                                placeholder="Job title..."
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                                            />
                                        </div>

                                        {/* Status Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                                            <select
                                                value={myAssignmentsStatusFilter}
                                                onChange={(e) => setMyAssignmentsStatusFilter(e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="Pending">Pending</option>
                                                <option value="In Review">In Review</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </div>

                                        {/* Level Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Level</label>
                                            <select
                                                value={myAssignmentsLevelFilter}
                                                onChange={(e) => setMyAssignmentsLevelFilter(e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
                                            >
                                                <option value="">All Levels</option>
                                                <option value="New Grad">New Grad</option>
                                                <option value="Intern">Intern</option>
                                                <option value="Mid-Level">Mid-Level</option>
                                                <option value="Senior">Senior</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-600">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Member</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Job Title</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Level</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Assigned Date</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredMyAssignments.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                    {myAssignedReviews.length === 0 ? 'No reviews assigned to you yet' : 'No assignments match your filters'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMyAssignments.map((review) => (
                                                <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-4 py-3 text-left">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{review.user_name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{review.user_email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-left">{review.job_title}</td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                            {review.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${review.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                                            review.status === 'In Review' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                                                review.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                                                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {review.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-left">{review.assigned_date}</td>
                                                    <td className="px-4 py-3 text-left">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a
                                                                href={review.resume_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-2.5 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors"
                                                            >
                                                                View Resume
                                                            </a>
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

                {/* All Assignments Tab (Admin only) */}
                {activeTab === 'allAssignments' && isAdmin && (
                    <>
                        {/* Compact Stats Bar */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                                {/* Compact Stats */}
                                <div className="flex items-center gap-6 flex-wrap text-xs">
                                    <div className="flex items-center gap-2">
                                        <ChartBarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                        <span className="font-medium text-gray-600 dark:text-gray-400">Total:</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{assignmentsAnalytics.total}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="h-4 w-4 text-amber-500" />
                                        <span className="font-medium text-amber-600 dark:text-amber-400">Pending:</span>
                                        <span className="font-bold text-amber-700 dark:text-amber-400">{assignmentsAnalytics.byStatus['Pending'] || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <EyeIcon className="h-4 w-4 text-purple-500" />
                                        <span className="font-medium text-purple-600 dark:text-purple-400">In Review:</span>
                                        <span className="font-bold text-purple-700 dark:text-purple-400">{assignmentsAnalytics.byStatus['In Review'] || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                        <span className="font-medium text-green-600 dark:text-green-400">Completed:</span>
                                        <span className="font-bold text-green-700 dark:text-green-400">{assignmentsAnalytics.byStatus['Completed'] || 0}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={exportAssignmentsToCSV}
                                        disabled={filteredAndSortedAssignments.length === 0}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                        Export CSV
                                    </button>
                                    <button
                                        onClick={() => setShowAdvancedAssignmentFilters(!showAdvancedAssignmentFilters)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${showAdvancedAssignmentFilters
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                        Advanced Filters
                                        {hasActiveAssignmentFilters && (
                                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                                                {[assignmentsStatusFilter, assignmentsLevelFilter, assignmentsReviewerFilter, assignmentsDateRange.start, assignmentsDateRange.end].filter(Boolean).length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>


                        </div>

                        {/* Search and Sort Bar - Only show when Advanced Filters is closed */}
                        {!showAdvancedAssignmentFilters && (
                            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
                                <div className="flex items-center gap-3">
                                    {/* Global Search */}
                                    <div className="flex-1 relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search assignments (member, email, job title)..."
                                            value={assignmentsMemberSearch}
                                            onChange={(e) => setAssignmentsMemberSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        />
                                    </div>

                                    {/* Sort Dropdown */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            Sort by:
                                        </label>
                                        <select
                                            value={assignmentsSortBy}
                                            onChange={(e) => setAssignmentsSortBy(e.target.value)}
                                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                        >
                                            <option value="date_desc">Newest First</option>
                                            <option value="date_asc">Oldest First</option>
                                            <option value="member_asc">Member (A-Z)</option>
                                            <option value="member_desc">Member (Z-A)</option>
                                            <option value="status_asc">Status (A-Z)</option>
                                            <option value="status_desc">Status (Z-A)</option>
                                        </select>
                                    </div>

                                    {/* Results Count */}
                                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                        {filteredAndSortedAssignments.length} of {allAssignments.length}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Advanced Filters Panel */}
                        {showAdvancedAssignmentFilters && (
                            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2.5 mb-3 transition-colors">
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <AdjustmentsHorizontalIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-500" />
                                        <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Advanced Filters</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Sort Dropdown */}
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                                Sort:
                                            </label>
                                            <select
                                                value={assignmentsSortBy}
                                                onChange={(e) => setAssignmentsSortBy(e.target.value)}
                                                className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            >
                                                <option value="date_desc">Newest First</option>
                                                <option value="date_asc">Oldest First</option>
                                                <option value="member_asc">Member (A-Z)</option>
                                                <option value="member_desc">Member (Z-A)</option>
                                                <option value="status_asc">Status (A-Z)</option>
                                                <option value="status_desc">Status (Z-A)</option>
                                            </select>
                                        </div>
                                        {/* Results Count */}
                                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                            {filteredAndSortedAssignments.length} of {allAssignments.length}
                                        </div>
                                        {hasActiveAssignmentFilters && (
                                            <button
                                                onClick={clearAssignmentFilters}
                                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <XMarkIcon className="h-3 w-3" />
                                                Clear
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowAdvancedAssignmentFilters(false)}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                        >
                                            <ChevronUpIcon className="h-3.5 w-3.5" />
                                            Collapse
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                    {/* Search Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Search Assignments
                                        </label>
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by member, email, or job title..."
                                                value={assignmentsMemberSearch}
                                                onChange={(e) => setAssignmentsMemberSearch(e.target.value)}
                                                className="w-full pl-9 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={assignmentsStatusFilter}
                                            onChange={(e) => setAssignmentsStatusFilter(e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="Pending">Pending</option>
                                            <option value="In Review">In Review</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>

                                    {/* Level Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Level
                                        </label>
                                        <select
                                            value={assignmentsLevelFilter}
                                            onChange={(e) => setAssignmentsLevelFilter(e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">All Levels</option>
                                            <option value="Intern">Intern</option>
                                            <option value="Entry">Entry</option>
                                            <option value="Mid">Mid</option>
                                            <option value="Senior">Senior</option>
                                        </select>
                                    </div>

                                    {/* Reviewer Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                            Assigned To
                                        </label>
                                        <select
                                            value={assignmentsReviewerFilter}
                                            onChange={(e) => setAssignmentsReviewerFilter(e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">All Reviewers</option>
                                            {uniqueReviewers.map(reviewer => (
                                                <option key={reviewer} value={reviewer}>{reviewer}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date Range Start */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={assignmentsDateRange.start}
                                            onChange={(e) => setAssignmentsDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Date Range End */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={assignmentsDateRange.end}
                                            onChange={(e) => setAssignmentsDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reviewer Workload Breakdown - Compact */}
                        {Object.keys(assignmentsAnalytics.byReviewer).length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <UserGroupIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    Reviewer Workload
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(assignmentsAnalytics.byReviewer)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([reviewer, count]) => (
                                            <div key={reviewer} className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded text-xs">
                                                <span className="font-medium text-purple-700 dark:text-purple-300">
                                                    {reviewer}
                                                </span>
                                                <span className="px-1.5 py-0.5 font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded">
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-600">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Member</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Job Title</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Level</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Assigned To</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Assigned Date</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredAndSortedAssignments.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-12 text-center">
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        {hasActiveAssignmentFilters ? 'No assignments match your filters' : 'No assignments yet'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAndSortedAssignments.map((review) => (
                                                <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-4 py-3 text-left">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{review.user_name}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{review.user_email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-left">{review.job_title}</td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                            {review.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                                            {review.reviewer_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${review.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                                            review.status === 'In Review' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                                                review.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                                                    'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {review.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-left">{review.assigned_date}</td>
                                                    <td className="px-4 py-3 text-left">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a
                                                                href={review.resume_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-2.5 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors"
                                                            >
                                                                View Resume
                                                            </a>
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

                                {isLeadOrAbove ? (
                                    <>
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
                                    </>
                                ) : (
                                    /* Read-only view for volunteers */
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Current Status
                                            </label>
                                            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                                                {selectedReview.status}
                                            </div>
                                        </div>

                                        {selectedReview.feedback && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Feedback & Comments
                                                </label>
                                                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                                    {selectedReview.feedback}
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                            Only Lead and Admin can edit review status and feedback
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end gap-3">
                            <button
                                onClick={handleCloseReviewModal}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                {isLeadOrAbove ? 'Cancel' : 'Close'}
                            </button>
                            {isLeadOrAbove && (
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
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {assigningReview && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <UserCircleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        Assign Reviewer
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Assign a volunteer or lead to review this resume
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAssigningReview(null)}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Resume Details */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <DocumentIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {assigningReview.user_name}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {assigningReview.user_email}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                            {assigningReview.job_title}
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                            {assigningReview.level}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reviewer List */}
                        <div className="px-6 py-4 max-h-96 overflow-y-auto">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                                Select Reviewer
                            </h3>
                            {privilegedUsers.length > 0 ? (
                                <div className="space-y-2">
                                    {privilegedUsers.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleAssignReview(assigningReview.id, user.id, user.full_name)}
                                            disabled={assigningInProgress}
                                            className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700 rounded-lg transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40 rounded-full flex items-center justify-center transition-colors">
                                                    {assigningInProgress ? (
                                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 dark:border-purple-400 border-t-transparent" />
                                                    ) : (
                                                        <UserCircleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                                                        {user.full_name}
                                                    </p>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <ChevronRightIcon className="h-5 w-5 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12">
                                    <UserCircleIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">No reviewers available</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        There are no volunteers or leads available for assignment
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <button
                                onClick={() => setAssigningReview(null)}
                                disabled={assigningInProgress}
                                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {showUserDetailsModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {selectedUser.full_name}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {selectedUser.email}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseUserDetailsModal}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                                            <DocumentIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Resumes</p>
                                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                                {selectedUser.resumes?.length || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
                                            <DocumentTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Essays</p>
                                            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                                {(selectedUser.referral_essay ? 1 : 0) + (selectedUser.cover_letter ? 1 : 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resumes Section */}
                            {selectedUser.resumes && selectedUser.resumes.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <DocumentIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        Resumes ({selectedUser.resumes.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedUser.resumes.map((resume, index) => (
                                            <div
                                                key={resume.id || index}
                                                className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center mt-0.5">
                                                        <DocumentIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                            {resume.name || `Resume ${index + 1}`}
                                                        </p>
                                                        {resume.uploaded_at && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                Uploaded: {new Date(resume.uploaded_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {resume.role && (
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                Role: {resume.role}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <a
                                                    href={resume.url || resume.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <EyeIcon className="h-3.5 w-3.5" />
                                                    View
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Essays Section */}
                            {(selectedUser.referral_essay || selectedUser.cover_letter) && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <DocumentTextIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        Essays & Cover Letters
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedUser.referral_essay && (
                                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <DocumentTextIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        Referral Essay
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                                    {selectedUser.referral_essay}
                                                </p>
                                            </div>
                                        )}
                                        {selectedUser.cover_letter && (
                                            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <DocumentTextIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        Cover Letter
                                                    </p>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                                    {selectedUser.cover_letter}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* No Files Message */}
                            {(!selectedUser.resumes || selectedUser.resumes.length === 0) && !selectedUser.referral_essay && !selectedUser.cover_letter && (
                                <div className="text-center py-12">
                                    <FolderIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">No files found</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        This user hasn't uploaded any files yet
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end">
                            <button
                                onClick={handleCloseUserDetailsModal}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilesManagement;
