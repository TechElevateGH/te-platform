import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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
    ChevronRightIcon,
    XCircleIcon
} from 'icons';

const ResumesAndEssaysManagement = () => {
    const { accessToken, userRole, userId } = useAuth();
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
        return localStorage.getItem('ResumesAndEssaysManagementActiveTab') || (userRoleInt >= 4 ? 'resumes' : 'reviews');
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState('');
    const [memberFilter, setMemberFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');
    const [showColumnSelector, setShowColumnSelector] = useState(false); // eslint-disable-line no-unused-vars
    const [assigningReview, setAssigningReview] = useState(null);
    const [assigningInProgress, setAssigningInProgress] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewFeedback, setReviewFeedback] = useState('');
    const [reviewStatus, setReviewStatus] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [resumeReviewStatusFilter, setResumeReviewStatusFilter] = useState('Pending'); // Default to Pending status
    const [resumeReviewReviewerFilter, setResumeReviewReviewerFilter] = useState('');
    const [resumeReviewDateRange, setResumeReviewDateRange] = useState({ start: '', end: '' });
    const [resumeReviewSortBy, setResumeReviewSortBy] = useState('submitted_desc');
    const [updatingReviewStatusId, setUpdatingReviewStatusId] = useState(null);
    const [toast, setToast] = useState(null);
    const [myAssignedReviews, setMyAssignedReviews] = useState([]);
    const [allAssignments, setAllAssignments] = useState([]);

    // Cancel modal state
    const [cancelModal, setCancelModal] = useState({ open: false, review: null, reason: '' });
    const [isCancelling, setIsCancelling] = useState(false);

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
    const [essaysSearch] = useState('');
    const [essaysSortBy] = useState('name_asc');

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

    // Column management functions (reserved for future column selector UI)
    // eslint-disable-next-line no-unused-vars
    const toggleColumn = (columnKey) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    // eslint-disable-next-line no-unused-vars
    const resetColumns = () => {
        const defaultColumns = {};
        columnConfig.forEach(col => {
            defaultColumns[col.key] = col.default;
        });
        setVisibleColumns(defaultColumns);
    };

    // eslint-disable-next-line no-unused-vars
    const showAllColumns = () => {
        const allColumns = {};
        columnConfig.forEach(col => {
            allColumns[col.key] = true;
        });
        setVisibleColumns(allColumns);
    };

    // eslint-disable-next-line no-unused-vars
    const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length;

    // Persist activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('ResumesAndEssaysManagementActiveTab', activeTab);
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
            const response = await axiosInstance.get('/resumes/reviews/assignments', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { user_id: userId }
            });
            setMyAssignedReviews(response.data?.reviews || []);
        } catch (error) {
            console.error('Error fetching my assigned reviews:', error);
        }
    }, [accessToken, isVolunteerOrAbove, userId]);

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
            console.log('ResumesAndEssaysManagement mounted, fetching data...');
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
            const response = await axiosInstance.post('/resumes/reviews/assign', {
                reviewer_id: reviewerId,
                reviewer_name: reviewerName
            }, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { review_id: reviewId }
            });

            console.log('Assignment response:', response.data);

            setToast({ message: `Review assigned to ${reviewerName}`, type: 'success' });

            // Close modal first
            setAssigningReview(null);

            // Refetch all review data
            await fetchResumeReviews();

            // Also refetch assignments if admin/volunteer
            if (isVolunteerOrAbove) {
                await fetchMyAssignedReviews();
            }
            if (isAdmin) {
                await fetchAllAssignments();
            }
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

        const reviewId = selectedReview.id || selectedReview._id;
        console.log('Submitting review update:', { reviewId, selectedReview, feedback: reviewFeedback, status: reviewStatus });

        setSubmittingReview(true);
        try {
            await axiosInstance.patch(`/resumes/reviews?review_id=${reviewId}`, {
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
            console.error('Error details:', error.response?.data);
            setToast({ message: `Failed to update review: ${error.response?.data?.detail || error.message}`, type: 'error' });
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleInlineReviewStatusUpdate = async (review, status) => {
        const reviewId = review.id || review._id;
        if (!reviewId || status === review.status) return;

        setUpdatingReviewStatusId(reviewId);
        try {
            await axiosInstance.patch(`/resumes/reviews?review_id=${reviewId}`, { status }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setToast({ message: 'Review status updated successfully', type: 'success' });
            await fetchResumeReviews();
            if (isVolunteerOrAbove) {
                await fetchMyAssignedReviews();
            }
            if (isAdmin) {
                await fetchAllAssignments();
            }
        } catch (error) {
            console.error('Error updating review status:', error);
            setToast({ message: error.response?.data?.detail || 'Failed to update review status', type: 'error' });
        } finally {
            setUpdatingReviewStatusId(null);
        }
    };

    // Open cancel modal
    const openCancelModal = (review) => {
        setCancelModal({ open: true, review, reason: '' });
    };

    // Close cancel modal
    const closeCancelModal = () => {
        setCancelModal({ open: false, review: null, reason: '' });
    };

    // Handle cancel review
    const handleCancelReview = async () => {
        if (!cancelModal.review || !cancelModal.reason.trim()) {
            setToast({ message: 'Please provide a cancellation reason', type: 'error' });
            return;
        }

        setIsCancelling(true);
        try {
            const reviewId = cancelModal.review.id || cancelModal.review._id;
            await axiosInstance.patch(
                `/resumes/reviews/cancel?review_id=${reviewId}`,
                cancelModal.reason,
                {
                    headers: { 
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setToast({ message: 'Resume review cancelled successfully', type: 'success' });
            closeCancelModal();

            // Refresh data
            await fetchResumeReviews();
            if (isVolunteerOrAbove) {
                await fetchMyAssignedReviews();
            }
            if (isAdmin) {
                await fetchAllAssignments();
            }
        } catch (error) {
            console.error('Error cancelling review:', error);
            setToast({ 
                message: error.response?.data?.detail || 'Failed to cancel review', 
                type: 'error' 
            });
        } finally {
            setIsCancelling(false);
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

    const getReviewStatusClass = (status) => {
        const colors = {
            'Pending': 'bg-[var(--te-gold-soft)] text-[var(--te-gold)] border border-[var(--te-gold)]',
            'In Review': 'bg-[var(--te-gold-soft)] text-[var(--te-gold)] border border-[var(--te-gold)]',
            'Requested': 'bg-[var(--te-gold-soft)] text-[var(--te-gold)] border border-[var(--te-gold)]',
            'Completed': 'bg-[var(--te-green-soft)] text-[var(--te-green)] border border-[var(--te-green)]',
            'Approved': 'bg-[var(--te-green-soft)] text-[var(--te-green)] border border-[var(--te-green)]',
            'Reviewed': 'bg-[var(--te-green-soft)] text-[var(--te-green)] border border-[var(--te-green)]',
            'Declined': 'bg-[var(--te-red-soft)] text-[var(--te-red)] border border-[var(--te-red)]',
            'Cancelled': 'bg-[var(--te-red-soft)] text-[var(--te-red)] border border-[var(--te-red)]',
            'Rejected': 'bg-[var(--te-red-soft)] text-[var(--te-red)] border border-[var(--te-red)]',
            'Needs Changes': 'bg-[var(--te-red-soft)] text-[var(--te-red)] border border-[var(--te-red)]'
        };
        return colors[status] || 'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] border border-[var(--te-border)]';
    };

    // Filter and sort resume reviews.
    const filteredResumeReviews = useMemo(() => resumeReviews.filter(review => {
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

        const reviewerMatch = !resumeReviewReviewerFilter ||
            (resumeReviewReviewerFilter === 'Unassigned'
                ? !review.reviewer_name
                : (review.reviewer_name || '').toLowerCase() === resumeReviewReviewerFilter.toLowerCase());

        const submittedDate = review.submitted_date ? new Date(review.submitted_date) : null;
        const startDate = resumeReviewDateRange.start ? new Date(`${resumeReviewDateRange.start}T00:00:00`) : null;
        const endDate = resumeReviewDateRange.end ? new Date(`${resumeReviewDateRange.end}T23:59:59.999`) : null;
        const dateMatch = (!startDate || (submittedDate && submittedDate >= startDate)) &&
            (!endDate || (submittedDate && submittedDate <= endDate));

        return statusMatch && searchMatch && levelMatch && reviewerMatch && dateMatch;
    }).sort((a, b) => {
        const compareText = (first, second) => (first || '').localeCompare(second || '');
        const compareDate = (first, second) => {
            const firstDate = first ? new Date(first).getTime() : 0;
            const secondDate = second ? new Date(second).getTime() : 0;
            return firstDate - secondDate;
        };

        switch (resumeReviewSortBy) {
            case 'submitted_asc':
                return compareDate(a.submitted_date, b.submitted_date);
            case 'member_asc':
                return compareText(a.user_name, b.user_name);
            case 'member_desc':
                return compareText(b.user_name, a.user_name);
            case 'job_asc':
                return compareText(a.job_title, b.job_title);
            case 'job_desc':
                return compareText(b.job_title, a.job_title);
            case 'level_asc':
                return compareText(a.level, b.level);
            case 'level_desc':
                return compareText(b.level, a.level);
            case 'status_asc':
                return compareText(a.status, b.status);
            case 'status_desc':
                return compareText(b.status, a.status);
            case 'reviewer_asc':
                return compareText(a.reviewer_name, b.reviewer_name);
            case 'reviewer_desc':
                return compareText(b.reviewer_name, a.reviewer_name);
            case 'submitted_desc':
            default:
                return compareDate(b.submitted_date, a.submitted_date);
        }
    }), [
        resumeReviews,
        resumeReviewStatusFilter,
        searchQuery,
        levelFilter,
        resumeReviewReviewerFilter,
        resumeReviewDateRange,
        resumeReviewSortBy
    ]);

    const reviewReviewerOptions = useMemo(() => [...new Set(
        resumeReviews.map(review => review.reviewer_name).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b)), [resumeReviews]);

    const hasActiveResumeReviewFilters = searchQuery || levelFilter ||
        resumeReviewStatusFilter !== 'Pending' || resumeReviewReviewerFilter ||
        resumeReviewDateRange.start || resumeReviewDateRange.end;

    const clearResumeReviewFilters = () => {
        setSearchQuery('');
        setLevelFilter('');
        setResumeReviewStatusFilter('Pending');
        setResumeReviewReviewerFilter('');
        setResumeReviewDateRange({ start: '', end: '' });
    };

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

    // Filtered and sorted Essays (reserved for Essays tab)
    // eslint-disable-next-line no-unused-vars
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
        <div className="min-h-screen h-full bg-[var(--te-bg)] text-[var(--te-text)] overflow-x-hidden">
            <header className="border-b border-[var(--te-border)] bg-[var(--te-surface)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div className="min-w-0 flex-1">
                            <span className="te-eyebrow">Reviews</span>
                            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--te-text)] sm:text-4xl">
                                Resumes & Essays Management
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--te-text-dim)]">
                                Manage member files, essays, and assign resume review requests
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                                onClick={exportToCSV}
                                disabled={sortedUsers.length === 0}
                                className="te-btn-secondary te-btn-sm gap-1.5"
                            >
                                <ArrowDownTrayIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="border-b border-[var(--te-border)] bg-[var(--te-surface)] overflow-x-auto te-scroll">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <nav className="flex gap-6">
                        {/* Resumes Tab - Only Lead+ */}
                        {userRoleInt >= 4 && (
                            <button
                                onClick={() => setActiveTab('resumes')}
                                className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'resumes'
                                    ? 'border-[var(--te-green)] text-[var(--te-green)]'
                                    : 'border-transparent text-[var(--te-text-dim)] hover:text-[var(--te-text)]'
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
                                    ? 'border-[var(--te-green)] text-[var(--te-green)]'
                                    : 'border-transparent text-[var(--te-text-dim)] hover:text-[var(--te-text)]'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <DocumentTextIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Resume Reviews</span>
                                    <span className="sm:hidden">Reviews</span>
                                    {resumeReviews.filter(r => r.status === 'Pending').length > 0 && (
                                        <span className="px-1.5 sm:px-2 py-0.5 text-xs font-bold bg-[var(--te-gold-soft)] text-[var(--te-gold)] rounded-md">
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
                                    ? 'border-[var(--te-green)] text-[var(--te-green)]'
                                    : 'border-transparent text-[var(--te-text-dim)] hover:text-[var(--te-text)]'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <UserCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">My Assignments</span>
                                    <span className="sm:hidden">My Work</span>
                                    {myAssignedReviews.length > 0 && (
                                        <span className="px-1.5 sm:px-2 py-0.5 text-xs font-bold bg-[var(--te-gold-soft)] text-[var(--te-gold)] rounded-md">
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
                                    ? 'border-[var(--te-green)] text-[var(--te-green)]'
                                    : 'border-transparent text-[var(--te-text-dim)] hover:text-[var(--te-text)]'
                                    }`}
                            >
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <UserGroupIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">All Assignments</span>
                                    <span className="sm:hidden">All Work</span>
                                    {allAssignments.length > 0 && (
                                        <span className="px-1.5 sm:px-2 py-0.5 text-xs font-bold bg-[var(--te-gold-soft)] text-[var(--te-gold)] rounded-md">
                                            {allAssignments.length}
                                        </span>
                                    )}
                                </div>
                            </button>
                        )}
                    </nav>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">

                {activeTab === 'resumes' && (
                    <>
                        {/* Unified Bar: Stats + Search + Sort + Filters */}
                        <div className="te-card rounded-lg p-2 mb-3 transition-colors">
                            <div className="flex items-center gap-2">
                                {/* Stats */}
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <UserGroupIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)] flex-shrink-0" />
                                        <span className="font-bold text-[var(--te-text)]">{users.filter(u => u.resumes && u.resumes.length > 0).length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <DocumentIcon className="h-3.5 w-3.5 text-[var(--te-green)] flex-shrink-0" />
                                        <span className="font-bold text-[var(--te-text-dim)]">{stats.totalResumes}</span>
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="flex-1 relative min-w-0">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--te-text-dim)] flex-shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="te-input pl-9"
                                    />
                                </div>

                                {/* Sort */}
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="te-select"
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
                                    className={`te-btn-sm gap-1.5 whitespace-nowrap ${showAdvancedResumesFilters ? 'te-btn-primary' : 'te-btn-secondary'}`}
                                >
                                    <AdjustmentsHorizontalIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {(memberFilter || fileTypeFilter) && (
                                        <span className="px-1.5 py-0.5 text-xs bg-[var(--te-surface-alt)] rounded-md">
                                            {[memberFilter, fileTypeFilter].filter(Boolean).length}
                                        </span>
                                    )}
                                </button>

                                {/* Count */}
                                <div className="text-xs font-medium text-[var(--te-text-dim)] whitespace-nowrap hidden sm:block">
                                    {sortedUsers.length} of {users.length}
                                </div>
                            </div>
                        </div>

                        {/* Advanced Filters Panel */}
                        {showAdvancedResumesFilters && (
                            <div className="te-card rounded-lg p-3 mb-3 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <AdjustmentsHorizontalIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                        <h3 className="text-sm font-bold text-[var(--te-text)]">Advanced Filters</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Sort Dropdown */}
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium text-[var(--te-text-dim)] whitespace-nowrap">
                                                Sort by:
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
                                                <option value="files_desc">Files (Most)</option>
                                                <option value="files_asc">Files (Least)</option>
                                            </select>
                                        </div>
                                        {/* Results Count */}
                                        <div className="text-xs font-medium text-[var(--te-text-dim)] whitespace-nowrap">
                                            {sortedUsers.length} of {users.length}
                                        </div>
                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearAllFilters}
                                                className="te-btn-danger te-btn-sm gap-1"
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
                                        <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                            Search Members
                                        </label>
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--te-text-dim)]" />
                                            <input
                                                type="text"
                                                placeholder="Search by name or email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="te-input pl-9"
                                            />
                                        </div>
                                    </div>

                                    {/* Member Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                            Filter by Member
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Name or email..."
                                            value={memberFilter}
                                            onChange={(e) => setMemberFilter(e.target.value)}
                                            className="te-input"
                                        />
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* Hint Text */}
                        <div className="mb-2 px-1">
                            <p className="text-xs text-[var(--te-text-dim)]">
                                💡 Click on any row to view member files
                            </p>
                        </div>

                        {/* Desktop Table - Hidden on mobile */}
                        <div className="hidden md:block te-card rounded-lg overflow-hidden shadow-sm transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                            <th className="px-3 py-2 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Member
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Resumes
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--te-border)]">
                                        {sortedUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="px-3 py-6 text-center">
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
                                                    className="hover:bg-[var(--te-hover)] transition-all cursor-pointer"
                                                >
                                                    <td className="px-3 py-2 text-left">
                                                        <span className="text-xs font-semibold text-[var(--te-text)]">
                                                            {user.full_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-left">
                                                        <span className="text-xs text-[var(--te-text-dim)]">
                                                            {user.email}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-left">
                                                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-[var(--te-green-soft)] text-[var(--te-green)]">
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
                                <div className="te-card rounded-lg p-8 text-center">
                                    <FolderIcon className="h-8 w-8 text-[var(--te-text-dim)] mx-auto mb-2" />
                                    <p className="text-sm font-medium text-[var(--te-text)]">No files found</p>
                                    <p className="text-xs text-[var(--te-text-dim)] mt-0.5">
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
                                        className="te-card rounded-lg overflow-hidden shadow-sm hover:shadow-sm transition-shadow cursor-pointer"
                                    >
                                        {/* Card Header */}
                                        <div className="px-3 py-2.5 bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                            <div className="flex items-center justify-between">
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm font-bold text-[var(--te-text)] truncate">
                                                        {user.full_name}
                                                    </h3>
                                                    <p className="text-xs text-[var(--te-text-dim)] truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-md bg-[var(--te-green-soft)] text-[var(--te-green)]">
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
                        <div className="te-card rounded-lg p-2 mb-3 transition-colors">
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Expanded Stats */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1.5">
                                        <ChartBarIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                        <span className="text-[var(--te-text-dim)] hidden sm:inline">Total:</span>
                                        <span className="font-bold text-[var(--te-text)]">{resumeReviews.length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ClockIcon className="h-4 w-4 text-[var(--te-gold)]" />
                                        <span className="text-[var(--te-text-dim)] hidden sm:inline">Pending:</span>
                                        <span className="font-bold text-[var(--te-text)]">{resumeReviews.filter(r => r.status === 'Pending').length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <DocumentTextIcon className="h-4 w-4 text-[var(--te-gold)]" />
                                        <span className="text-[var(--te-text)] hidden sm:inline">In Review:</span>
                                        <span className="font-bold text-[var(--te-text-dim)]">{resumeReviews.filter(r => r.status === 'In Review').length}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircleIcon className="h-4 w-4 text-[var(--te-green)]" />
                                        <span className="text-[var(--te-text)] hidden sm:inline">Completed:</span>
                                        <span className="font-bold text-[var(--te-text-dim)]">{resumeReviews.filter(r => r.status === 'Completed').length}</span>
                                    </div>
                                </div>

                                {/* Search */}
                                <div className="relative w-56 sm:w-80">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--te-text-dim)]" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="te-input pl-9 py-1.5"
                                    />
                                </div>

                                {/* Status Filter Dropdown */}
                                <select
                                    value={resumeReviewStatusFilter}
                                    onChange={(e) => setResumeReviewStatusFilter(e.target.value)}
                                    className="te-select py-1.5 min-w-[120px]"
                                >
                                    <option value="active">Active</option>
                                    <option value="">All</option>
                                    <option value="Pending">Pending</option>
                                    <option value="In Review">In Review</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Declined">Declined</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>

                                {/* Level Filter Dropdown */}
                                <select
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="te-select py-1.5 min-w-[120px]"
                                >
                                    <option value="">All Levels</option>
                                    <option value="Intern">Intern</option>
                                    <option value="Entry">Entry</option>
                                    <option value="Mid">Mid</option>
                                    <option value="Senior">Senior</option>
                                </select>

                                <select
                                    value={resumeReviewReviewerFilter}
                                    onChange={(e) => setResumeReviewReviewerFilter(e.target.value)}
                                    className="te-select py-1.5 min-w-[140px]"
                                    aria-label="Filter by reviewer"
                                >
                                    <option value="">All reviewers</option>
                                    <option value="Unassigned">Unassigned</option>
                                    {reviewReviewerOptions.map((reviewer) => (
                                        <option key={reviewer} value={reviewer}>{reviewer}</option>
                                    ))}
                                </select>

                                <input
                                    type="date"
                                    value={resumeReviewDateRange.start}
                                    onChange={(e) => setResumeReviewDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="te-input py-1.5"
                                    aria-label="Submitted on or after"
                                />
                                <input
                                    type="date"
                                    value={resumeReviewDateRange.end}
                                    onChange={(e) => setResumeReviewDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="te-input py-1.5"
                                    aria-label="Submitted on or before"
                                />

                                <select
                                    value={resumeReviewSortBy}
                                    onChange={(e) => setResumeReviewSortBy(e.target.value)}
                                    className="te-select py-1.5 min-w-[150px]"
                                    aria-label="Sort review requests"
                                >
                                    <option value="submitted_desc">Newest first</option>
                                    <option value="submitted_asc">Oldest first</option>
                                    <option value="member_asc">Member (A-Z)</option>
                                    <option value="member_desc">Member (Z-A)</option>
                                    <option value="job_asc">Job title (A-Z)</option>
                                    <option value="job_desc">Job title (Z-A)</option>
                                    <option value="level_asc">Level (A-Z)</option>
                                    <option value="level_desc">Level (Z-A)</option>
                                    <option value="status_asc">Status (A-Z)</option>
                                    <option value="status_desc">Status (Z-A)</option>
                                    <option value="reviewer_asc">Reviewer (A-Z)</option>
                                    <option value="reviewer_desc">Reviewer (Z-A)</option>
                                </select>

                                {/* Clear Filters Button */}
                                {hasActiveResumeReviewFilters && (
                                    <button
                                        onClick={clearResumeReviewFilters}
                                        className="te-btn-danger te-btn-sm gap-1"
                                        title="Clear filters"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                )}

                                {/* Results Count */}
                                <div className="hidden sm:block text-xs font-medium text-[var(--te-text-dim)] whitespace-nowrap">
                                    {filteredResumeReviews.length} of {resumeReviews.length}
                                </div>
                            </div>
                        </div>

                        {/* Hint Text */}
                        <div className="mb-2 px-1">
                            <p className="text-xs text-[var(--te-text-dim)]">
                                💡 <strong>Click any row</strong> to view details {isLeadOrAbove && '• Update status directly in the table • Use Assign button to assign reviewers'}
                            </p>
                        </div>

                        <div className="te-card rounded-lg shadow-sm transition-colors overflow-visible">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase">Member</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase">Job Title</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase">Level</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase">Submitted</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase">Reviewer</th>
                                            {isLeadOrAbove && (
                                                <th className="px-4 py-3 text-right text-xs font-bold text-[var(--te-text-dim)] uppercase">Actions</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--te-border)]">
                                        {filteredResumeReviews.length === 0 ? (
                                            <tr>
                                                <td colSpan={isLeadOrAbove ? "7" : "6"} className="px-4 py-12 text-center text-sm text-[var(--te-text-dim)]">
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
                                                    className="hover:bg-[var(--te-surface-alt)] hover:bg-[var(--te-hover)] transition-colors cursor-pointer border-b border-[var(--te-border)]"
                                                >
                                                    <td className="px-4 py-3 text-left">
                                                        <div>
                                                            <div className="text-sm font-medium text-[var(--te-text)]">{review.user_name}</div>
                                                            <div className="text-xs text-[var(--te-text-dim)]">{review.user_email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="text-sm text-[var(--te-text-dim)]">{review.job_title}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="px-2 py-1 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] rounded">
                                                            {review.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left" onClick={(e) => e.stopPropagation()}>
                                                        {isLeadOrAbove ? (
                                                            <select
                                                                value={review.status}
                                                                onChange={(e) => handleInlineReviewStatusUpdate(review, e.target.value)}
                                                                disabled={updatingReviewStatusId === (review.id || review._id)}
                                                                className={`te-select py-1 text-xs font-bold ${getReviewStatusClass(review.status)}`}
                                                                aria-label={`Update status for ${review.user_name}`}
                                                            >
                                                                <option value="Pending">Pending</option>
                                                                <option value="In Review">In Review</option>
                                                                <option value="Completed">Completed</option>
                                                                <option value="Declined">Declined</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md ${getReviewStatusClass(review.status)}`}>
                                                                {review.status === 'Pending' && <ClockIcon className="h-3.5 w-3.5" />}
                                                                {review.status === 'Completed' && <CheckCircleIcon className="h-3.5 w-3.5" />}
                                                                {review.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="text-sm text-[var(--te-text-dim)]">{review.submitted_date}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="text-xs text-[var(--te-text-dim)]">
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
                                                                            console.log('Opening assign modal, privilegedUsers:', privilegedUsers);
                                                                            // Refetch privileged users to ensure we have latest data
                                                                            fetchPrivilegedUsers();
                                                                            setAssigningReview(review);
                                                                        }}
                                                                        className="te-btn-primary te-btn-sm gap-1"
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
                        <div className="te-card rounded-lg p-2.5 mb-3 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                                {/* Sort Dropdown */}
                                <div className="flex-shrink-0">
                                    <select
                                        value={myAssignmentsSortBy}
                                        onChange={(e) => setMyAssignmentsSortBy(e.target.value)}
                                        className="te-select py-1.5 text-xs"
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
                                    className="te-btn-secondary te-btn-sm gap-1.5 flex-shrink-0"
                                >
                                    <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                                    Filters
                                    {hasActiveMyAssignmentsFilters && (
                                        <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-[var(--te-on-primary)] bg-[var(--te-text)] rounded-md">
                                            {[myAssignmentsStatusFilter, myAssignmentsLevelFilter, myAssignmentsMemberFilter, myAssignmentsJobTitleFilter].filter(Boolean).length}
                                        </span>
                                    )}
                                </button>

                                {/* Results Count */}
                                <div className="flex-1 text-right">
                                    <span className="text-xs text-[var(--te-text-dim)]">
                                        <span className="font-semibold text-[var(--te-text)]">{filteredMyAssignments.length}</span> of{' '}
                                        <span className="font-semibold text-[var(--te-text)]">{myAssignedReviews.length}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Advanced Filters Panel */}
                            {showAdvancedMyAssignmentsFilters && (
                                <div className="mt-2.5 pt-2.5 border-t border-[var(--te-border)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xs font-semibold text-[var(--te-text-dim)]">Filters</h4>
                                            {hasActiveMyAssignmentsFilters && (
                                                <button
                                                    onClick={clearMyAssignmentsFilters}
                                                    className="te-btn-danger te-btn-sm gap-0.5"
                                                >
                                                    <XMarkIcon className="h-3 w-3" />
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setShowAdvancedMyAssignmentsFilters(false)}
                                            className="te-btn-ghost te-btn-sm gap-1"
                                        >
                                            <ChevronUpIcon className="h-3.5 w-3.5" />
                                            Collapse
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {/* Member Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">Member</label>
                                            <input
                                                type="text"
                                                value={myAssignmentsMemberFilter}
                                                onChange={(e) => setMyAssignmentsMemberFilter(e.target.value)}
                                                placeholder="Name or email..."
                                                className="te-input py-1.5 text-xs"
                                            />
                                        </div>

                                        {/* Job Title Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">Job Title</label>
                                            <input
                                                type="text"
                                                value={myAssignmentsJobTitleFilter}
                                                onChange={(e) => setMyAssignmentsJobTitleFilter(e.target.value)}
                                                placeholder="Job title..."
                                                className="te-input py-1.5 text-xs"
                                            />
                                        </div>

                                        {/* Status Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">Status</label>
                                            <select
                                                value={myAssignmentsStatusFilter}
                                                onChange={(e) => setMyAssignmentsStatusFilter(e.target.value)}
                                                className="te-select py-1.5 text-xs"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="Pending">Pending</option>
                                                <option value="In Review">In Review</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </div>

                                        {/* Level Filter */}
                                        <div>
                                            <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">Level</label>
                                            <select
                                                value={myAssignmentsLevelFilter}
                                                onChange={(e) => setMyAssignmentsLevelFilter(e.target.value)}
                                                className="te-select py-1.5 text-xs"
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
                        <div className="te-card rounded-lg overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Member</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Job Title</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Level</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Assigned Date</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--te-border)]">
                                        {filteredMyAssignments.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-4 py-12 text-center text-sm text-[var(--te-text-dim)]">
                                                    {myAssignedReviews.length === 0 ? 'No reviews assigned to you yet' : 'No assignments match your filters'}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMyAssignments.map((review) => (
                                                <tr key={review.id} className="hover:bg-[var(--te-hover)] transition-colors">
                                                    <td className="px-4 py-3 text-left">
                                                        <div>
                                                            <div className="text-sm font-medium text-[var(--te-text)]">{review.user_name}</div>
                                                            <div className="text-xs text-[var(--te-text-dim)]">{review.user_email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-[var(--te-text-dim)] text-left">{review.job_title}</td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="px-2 py-1 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] rounded">
                                                            {review.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md ${getReviewStatusClass(review.status)}`}>
                                                            {review.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-[var(--te-text-dim)] text-left">{review.assigned_date}</td>
                                                    <td className="px-4 py-3 text-left">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a
                                                                href={review.resume_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="te-btn-primary te-btn-sm"
                                                            >
                                                                View Resume
                                                            </a>
                                                            {review.status !== 'Completed' && review.status !== 'Cancelled' && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openCancelModal(review);
                                                                    }}
                                                                    className="te-btn-danger te-btn-sm gap-1"
                                                                    title="Cancel this review"
                                                                >
                                                                    <XCircleIcon className="h-3.5 w-3.5 text-[var(--te-red)]" />
                                                                    Cancel
                                                                </button>
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

                {/* All Assignments Tab (Admin only) */}
                {activeTab === 'allAssignments' && isAdmin && (
                    <>
                        {/* Compact Stats Bar */}
                        <div className="te-card rounded-lg p-3 mb-3 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                                {/* Compact Stats */}
                                <div className="flex items-center gap-6 flex-wrap text-xs">
                                    <div className="flex items-center gap-2">
                                        <ChartBarIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                        <span className="font-medium text-[var(--te-text-dim)]">Total:</span>
                                        <span className="font-bold text-[var(--te-text)]">{assignmentsAnalytics.total}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ClockIcon className="h-4 w-4 text-[var(--te-gold)]" />
                                        <span className="font-medium text-[var(--te-text-dim)]">Pending:</span>
                                        <span className="font-bold text-[var(--te-text)]">{assignmentsAnalytics.byStatus['Pending'] || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <EyeIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                        <span className="font-medium text-[var(--te-text)]">In Review:</span>
                                        <span className="font-bold text-[var(--te-text-dim)]">{assignmentsAnalytics.byStatus['In Review'] || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="h-4 w-4 text-[var(--te-green)]" />
                                        <span className="font-medium text-[var(--te-text)]">Completed:</span>
                                        <span className="font-bold text-[var(--te-text-dim)]">{assignmentsAnalytics.byStatus['Completed'] || 0}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={exportAssignmentsToCSV}
                                        disabled={filteredAndSortedAssignments.length === 0}
                                        className="te-btn-secondary te-btn-sm gap-1.5"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                        Export CSV
                                    </button>
                                    <button
                                        onClick={() => setShowAdvancedAssignmentFilters(!showAdvancedAssignmentFilters)}
                                        className={`te-btn-sm gap-1.5 ${showAdvancedAssignmentFilters ? 'te-btn-primary' : 'te-btn-secondary'}`}
                                    >
                                        <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                        Advanced Filters
                                        {hasActiveAssignmentFilters && (
                                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-[var(--te-surface-alt)] rounded-md">
                                                {[assignmentsStatusFilter, assignmentsLevelFilter, assignmentsReviewerFilter, assignmentsDateRange.start, assignmentsDateRange.end].filter(Boolean).length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>


                        </div>

                        {/* Search and Sort Bar - Only show when Advanced Filters is closed */}
                        {!showAdvancedAssignmentFilters && (
                            <div className="te-card rounded-lg p-3 mb-3 transition-colors">
                                <div className="flex items-center gap-3">
                                    {/* Global Search */}
                                    <div className="flex-1 relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--te-text-dim)]" />
                                        <input
                                            type="text"
                                            placeholder="Search assignments (member, email, job title)..."
                                            value={assignmentsMemberSearch}
                                            onChange={(e) => setAssignmentsMemberSearch(e.target.value)}
                                            className="te-input pl-9"
                                        />
                                    </div>

                                    {/* Sort Dropdown */}
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-medium text-[var(--te-text-dim)] whitespace-nowrap">
                                            Sort by:
                                        </label>
                                        <select
                                            value={assignmentsSortBy}
                                            onChange={(e) => setAssignmentsSortBy(e.target.value)}
                                            className="te-select"
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
                                    <div className="text-xs font-medium text-[var(--te-text-dim)] whitespace-nowrap">
                                        {filteredAndSortedAssignments.length} of {allAssignments.length}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Advanced Filters Panel */}
                        {showAdvancedAssignmentFilters && (
                            <div className="te-card rounded-lg p-2.5 mb-3 transition-colors">
                                <div className="flex items-center justify-between mb-2.5">
                                    <div className="flex items-center gap-2">
                                        <AdjustmentsHorizontalIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />
                                        <h3 className="text-xs font-semibold text-[var(--te-text)]">Advanced Filters</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {/* Sort Dropdown */}
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-medium text-[var(--te-text-dim)] whitespace-nowrap">
                                                Sort:
                                            </label>
                                            <select
                                                value={assignmentsSortBy}
                                                onChange={(e) => setAssignmentsSortBy(e.target.value)}
                                                className="te-select py-1.5 text-xs"
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
                                        <div className="text-xs font-medium text-[var(--te-text-dim)] whitespace-nowrap">
                                            {filteredAndSortedAssignments.length} of {allAssignments.length}
                                        </div>
                                        {hasActiveAssignmentFilters && (
                                            <button
                                                onClick={clearAssignmentFilters}
                                                className="te-btn-danger te-btn-sm gap-0.5"
                                            >
                                                <XMarkIcon className="h-3 w-3" />
                                                Clear
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowAdvancedAssignmentFilters(false)}
                                            className="te-btn-ghost te-btn-sm gap-1"
                                        >
                                            <ChevronUpIcon className="h-3.5 w-3.5" />
                                            Collapse
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                    {/* Search Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                            Search Assignments
                                        </label>
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--te-text-dim)]" />
                                            <input
                                                type="text"
                                                placeholder="Search by member, email, or job title..."
                                                value={assignmentsMemberSearch}
                                                onChange={(e) => setAssignmentsMemberSearch(e.target.value)}
                                                className="te-input pl-9 py-1.5 text-xs"
                                            />
                                        </div>
                                    </div>

                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={assignmentsStatusFilter}
                                            onChange={(e) => setAssignmentsStatusFilter(e.target.value)}
                                            className="te-select py-1.5 text-xs"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="Pending">Pending</option>
                                            <option value="In Review">In Review</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </div>

                                    {/* Level Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                            Level
                                        </label>
                                        <select
                                            value={assignmentsLevelFilter}
                                            onChange={(e) => setAssignmentsLevelFilter(e.target.value)}
                                            className="te-select py-1.5 text-xs"
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
                                        <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                            Assigned To
                                        </label>
                                        <select
                                            value={assignmentsReviewerFilter}
                                            onChange={(e) => setAssignmentsReviewerFilter(e.target.value)}
                                            className="te-select py-1.5 text-xs"
                                        >
                                            <option value="">All Reviewers</option>
                                            {uniqueReviewers.map(reviewer => (
                                                <option key={reviewer} value={reviewer}>{reviewer}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date Range Start */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={assignmentsDateRange.start}
                                            onChange={(e) => setAssignmentsDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="te-input"
                                        />
                                    </div>

                                    {/* Date Range End */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={assignmentsDateRange.end}
                                            onChange={(e) => setAssignmentsDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="te-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reviewer Workload Breakdown - Compact */}
                        {Object.keys(assignmentsAnalytics.byReviewer).length > 0 && (
                            <div className="te-card rounded-lg p-3 mb-3 transition-colors">
                                <h3 className="text-sm font-bold text-[var(--te-text)] mb-2 flex items-center gap-2">
                                    <UserGroupIcon className="h-4 w-4 text-[var(--te-text)]" />
                                    Reviewer Workload
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(assignmentsAnalytics.byReviewer)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([reviewer, count]) => (
                                            <div key={reviewer} className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded text-xs">
                                                <span className="font-medium text-[var(--te-text)]">
                                                    {reviewer}
                                                </span>
                                                <span className="px-1.5 py-0.5 font-bold bg-[var(--te-surface-alt)] text-[var(--te-text)] rounded">
                                                    {count}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Table */}
                        <div className="te-card rounded-lg overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Member</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Job Title</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Level</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Assigned To</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Assigned Date</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--te-border)]">
                                        {filteredAndSortedAssignments.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-12 text-center">
                                                    <div className="text-sm text-[var(--te-text-dim)]">
                                                        {hasActiveAssignmentFilters ? 'No assignments match your filters' : 'No assignments yet'}
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredAndSortedAssignments.map((review) => (
                                                <tr key={review.id} className="hover:bg-[var(--te-hover)] transition-colors">
                                                    <td className="px-4 py-3 text-left">
                                                        <div>
                                                            <div className="text-sm font-medium text-[var(--te-text)]">{review.user_name}</div>
                                                            <div className="text-xs text-[var(--te-text-dim)]">{review.user_email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-[var(--te-text-dim)] text-left">{review.job_title}</td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className="px-2 py-1 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] rounded">
                                                            {review.level}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <div className="text-sm font-medium text-[var(--te-text)]">
                                                            {review.reviewer_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-left">
                                                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md ${getReviewStatusClass(review.status)}`}>
                                                            {review.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-[var(--te-text-dim)] text-left">{review.assigned_date}</td>
                                                    <td className="px-4 py-3 text-left">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a
                                                                href={review.resume_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="te-btn-primary te-btn-sm"
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
                        className="bg-[var(--te-surface)] rounded-lg shadow-sm max-w-4xl w-full max-h-[90vh] overflow-hidden border border-[var(--te-border)] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="border-b border-[var(--te-border)] bg-[var(--te-surface)] px-6 py-5">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-display text-xl font-bold text-[var(--te-text)] mb-1">Resume Review Request</h3>
                                    <p className="font-mono text-sm text-[var(--te-text-dim)]">
                                        Submitted {selectedReview.submitted_date}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseReviewModal}
                                    className="te-icon-btn"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--te-surface-alt)]">{/* Member Info Card */}
                            <div className="te-card p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-14 h-14 bg-[var(--te-text)] rounded-md flex items-center justify-center">
                                        <UserCircleIcon className="h-8 w-8 text-[var(--te-on-primary)]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-lg font-bold text-[var(--te-text)] mb-1">{selectedReview.user_name}</h4>
                                        <p className="text-sm text-[var(--te-text-dim)] mb-3">{selectedReview.user_email}</p>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[var(--te-border)]">
                                            <div>
                                                <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wide mb-1">Position</p>
                                                <p className="text-sm font-semibold text-[var(--te-text)]">{selectedReview.job_title}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wide mb-1">Level</p>
                                                <span className="inline-block px-2.5 py-1 text-xs font-bold bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] rounded">
                                                    {selectedReview.level}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wide mb-1">Status</p>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md ${getReviewStatusClass(selectedReview.status)}`}>
                                                    {selectedReview.status === 'Pending' && <ClockIcon className="h-3.5 w-3.5" />}
                                                    {selectedReview.status === 'Completed' && <CheckCircleIcon className="h-3.5 w-3.5" />}
                                                    {selectedReview.status}
                                                </span>
                                            </div>
                                        </div>

                                        {selectedReview.reviewer_name && (
                                            <div className="mt-4 pt-4 border-t border-[var(--te-border)]">
                                                <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wide mb-1">Assigned Reviewer</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 bg-[var(--te-surface-alt)] rounded-md flex items-center justify-center">
                                                        <UserCircleIcon className="h-4 w-4 text-[var(--te-text)]" />
                                                    </div>
                                                    <p className="text-sm font-semibold text-[var(--te-text)]">{selectedReview.reviewer_name}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedReview.notes && (
                                    <div className="mt-4 pt-4 border-t border-[var(--te-border)]">
                                        <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wide mb-2">Member Notes</p>
                                        <div className="bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded-lg p-3">
                                            <p className="text-sm text-[var(--te-text-dim)] leading-relaxed">{selectedReview.notes}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-[var(--te-border)]">
                                    <a
                                        href={selectedReview.resume_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 te-btn-primary"
                                    >
                                        <DocumentIcon className="h-5 w-5" />
                                        Open Resume in New Tab
                                    </a>
                                </div>
                            </div>

                            {/* Review & Feedback Section */}
                            <div className="te-card p-6">
                                <h4 className="text-base font-bold text-[var(--te-text)] mb-4 flex items-center gap-2">
                                    <DocumentTextIcon className="h-5 w-5 text-[var(--te-text)]" />
                                    Review & Feedback
                                </h4>

                                {isLeadOrAbove ? (
                                    <div className="space-y-4">
                                        {/* Status Selector */}
                                        <div>
                                            <label className="block text-sm font-semibold text-[var(--te-text-dim)] mb-2">
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
                                            <label className="block text-sm font-semibold text-[var(--te-text-dim)] mb-2">
                                                Feedback & Comments
                                            </label>
                                            <textarea
                                                value={reviewFeedback}
                                                onChange={(e) => setReviewFeedback(e.target.value)}
                                                rows={10}
                                                placeholder="Provide detailed feedback on the resume, including strengths, areas for improvement, formatting suggestions, content recommendations, etc."
                                                className="te-textarea resize-none min-h-60"
                                            />
                                            <p className="text-xs text-[var(--te-text-dim)] mt-2">
                                                {reviewFeedback.length} characters
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Read-only view for volunteers */
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-[var(--te-text-dim)] mb-2">
                                                Current Status
                                            </label>
                                            <div className="px-4 py-2.5 bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded-lg text-sm text-[var(--te-text)]">
                                                {selectedReview.status}
                                            </div>
                                        </div>

                                        {selectedReview.feedback && (
                                            <div>
                                                <label className="block text-sm font-semibold text-[var(--te-text-dim)] mb-2">
                                                    Feedback & Comments
                                                </label>
                                                <div className="px-4 py-3 bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded-lg text-sm text-[var(--te-text)] whitespace-pre-wrap">
                                                    {selectedReview.feedback}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-2 p-3 bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded-lg">
                                            <svg className="h-5 w-5 text-[var(--te-text)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-xs text-[var(--te-text)] font-medium">
                                                Only Lead and Admin can edit review status and feedback
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-[var(--te-border)] bg-[var(--te-surface)] flex items-center justify-end gap-3">
                            <button
                                onClick={handleCloseReviewModal}
                                className="te-btn-secondary"
                            >
                                {isLeadOrAbove ? 'Cancel' : 'Close'}
                            </button>
                            {isLeadOrAbove && (
                                <button
                                    onClick={handleSubmitReview}
                                    disabled={submittingReview}
                                    className="te-btn-primary gap-2"
                                >
                                    {submittingReview ? (
                                        <>
                                            <div className="animate-spin rounded-md h-4 w-4 border-2 border-[var(--te-on-primary)] border-t-transparent" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon className="h-5 w-5" />
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
                    <div className="bg-[var(--te-surface)] rounded-lg shadow-sm w-full max-w-md border border-[var(--te-border)]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-[var(--te-border)]">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--te-text)] flex items-center gap-2">
                                        <UserCircleIcon className="h-5 w-5 text-[var(--te-text)]" />
                                        Assign Reviewer
                                    </h2>
                                    <p className="text-sm text-[var(--te-text-dim)] mt-1">
                                        Assign a volunteer or lead to review this resume
                                    </p>
                                </div>
                                <button
                                    onClick={() => setAssigningReview(null)}
                                    className="te-icon-btn"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Resume Details */}
                        <div className="px-6 py-4 bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-[var(--te-gold-soft)] border border-[var(--te-gold)] rounded-lg flex items-center justify-center">
                                    <DocumentIcon className="h-5 w-5 text-[var(--te-gold)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--te-text)]">
                                        {assigningReview.user_name}
                                    </p>
                                    <p className="text-xs text-[var(--te-text-dim)]">
                                        {assigningReview.user_email}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-[var(--te-text-dim)]">
                                            {assigningReview.job_title}
                                        </span>
                                        <span className="text-[var(--te-text-dim)]">•</span>
                                        <span className="text-xs text-[var(--te-text-dim)]">
                                            {assigningReview.level}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reviewer List */}
                        <div className="px-6 py-4 max-h-96 overflow-y-auto">
                            <h3 className="text-sm font-bold text-[var(--te-text)] mb-3">
                                Select Reviewer
                            </h3>
                            {privilegedUsers.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Leads Section */}
                                    {privilegedUsers.filter(u => u.role === 4).length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-2 px-1">
                                                Leads
                                            </h4>
                                            <div className="space-y-2">
                                                {privilegedUsers
                                                    .filter(user => user.role === 4)
                                                    .map(user => (
                                                        <button
                                                            key={user.id || user._id}
                                                            onClick={() => handleAssignReview(assigningReview.id, user.id || user._id, user.username || user.full_name)}
                                                            disabled={assigningInProgress}
                                                            className="te-card-interactive w-full text-left px-4 py-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-shrink-0 w-10 h-10 bg-[var(--te-green-soft)] border border-[var(--te-green)] group-hover:bg-[var(--te-green-soft)] rounded-md flex items-center justify-center transition-colors">
                                                                    {assigningInProgress ? (
                                                                        <div className="animate-spin rounded-md h-5 w-5 border-2 border-[var(--te-border-strong)] border-t-transparent" />
                                                                    ) : (
                                                                        <UserCircleIcon className="h-6 w-6 text-[var(--te-text)]" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-[var(--te-text)] group-hover:text-[var(--te-green)] transition-colors">
                                                                        {user.full_name || user.username || 'No name'}
                                                                    </p>
                                                                </div>
                                                                <ChevronRightIcon className="h-5 w-5 text-[var(--te-text-dim)] group-hover:text-[var(--te-green)] transition-colors" />
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Volunteers Section */}
                                    {privilegedUsers.filter(u => u.role === 3).length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-2 px-1">
                                                Volunteers
                                            </h4>
                                            <div className="space-y-2">
                                                {privilegedUsers
                                                    .filter(user => user.role === 3)
                                                    .map(user => (
                                                        <button
                                                            key={user.id || user._id}
                                                            onClick={() => handleAssignReview(assigningReview.id, user.id || user._id, user.username || user.full_name)}
                                                            disabled={assigningInProgress}
                                                            className="te-card-interactive w-full text-left px-4 py-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-shrink-0 w-10 h-10 bg-[var(--te-green-soft)] border border-[var(--te-green)] group-hover:bg-[var(--te-green-soft)] rounded-md flex items-center justify-center transition-colors">
                                                                    {assigningInProgress ? (
                                                                        <div className="animate-spin rounded-md h-5 w-5 border-2 border-[var(--te-border-strong)] border-t-transparent" />
                                                                    ) : (
                                                                        <UserCircleIcon className="h-6 w-6 text-[var(--te-text)]" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-[var(--te-text)] group-hover:text-[var(--te-green)] transition-colors">
                                                                        {user.full_name || user.username || 'No name'}
                                                                    </p>
                                                                    <p className="text-xs text-[var(--te-text-dim)] truncate">
                                                                        {user.email || 'No email'}
                                                                    </p>
                                                                </div>
                                                                <ChevronRightIcon className="h-5 w-5 text-[var(--te-text-dim)] group-hover:text-[var(--te-green)] transition-colors" />
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-12">
                                    <UserCircleIcon className="h-12 w-12 text-[var(--te-text-dim)] mb-3" />
                                    <p className="text-sm font-medium text-[var(--te-text)]">No reviewers available</p>
                                    <p className="text-xs text-[var(--te-text-dim)] mt-1">
                                        There are no volunteers or leads available for assignment
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                            <button
                                onClick={() => setAssigningReview(null)}
                                disabled={assigningInProgress}
                                className="te-btn-secondary w-full"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {showUserDetailsModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--te-surface)] rounded-lg shadow-sm max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="sticky top-0 px-6 py-4 border-b border-[var(--te-border)] bg-[var(--te-surface)] z-10">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--te-text)]">
                                        {selectedUser.full_name}
                                    </h2>
                                    <p className="text-sm text-[var(--te-text-dim)] mt-1">
                                        {selectedUser.email}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseUserDetailsModal}
                                    className="te-icon-btn"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                            {/* Stats Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[var(--te-green-soft)] border border-[var(--te-green)] rounded-lg">
                                            <DocumentIcon className="h-5 w-5 text-[var(--te-green)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--te-text)] font-medium">Resumes</p>
                                            <p className="text-2xl font-bold text-[var(--te-text)]">
                                                {selectedUser.resumes?.length || 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[var(--te-gold-soft)] border border-[var(--te-gold)] rounded-lg">
                                            <DocumentTextIcon className="h-5 w-5 text-[var(--te-gold)]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--te-text)] font-medium">Essays</p>
                                            <p className="text-2xl font-bold text-[var(--te-text)]">
                                                {(selectedUser.referral_essay ? 1 : 0) + (selectedUser.cover_letter ? 1 : 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Resumes Section */}
                            {selectedUser.resumes && selectedUser.resumes.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-[var(--te-text)] mb-3 flex items-center gap-2">
                                        <DocumentIcon className="h-4 w-4 text-[var(--te-text)]" />
                                        Resumes ({selectedUser.resumes.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedUser.resumes.map((resume, index) => (
                                            <div
                                                key={resume.id || index}
                                                className="flex items-start justify-between p-3 bg-[var(--te-surface-alt)] rounded-lg border border-[var(--te-border)] hover:bg-[var(--te-hover)] transition-colors"
                                            >
                                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-[var(--te-gold-soft)] border border-[var(--te-gold)] rounded flex items-center justify-center mt-0.5">
                                                        <DocumentIcon className="h-4 w-4 text-[var(--te-gold)]" />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="text-sm font-semibold text-[var(--te-text)] truncate">
                                                            {resume.name || `Resume ${index + 1}`}
                                                        </p>
                                                        {resume.uploaded_at && (
                                                            <p className="text-xs text-[var(--te-text-dim)]">
                                                                Uploaded: {new Date(resume.uploaded_at).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                        {resume.role && (
                                                            <p className="text-xs text-[var(--te-text-dim)]">
                                                                Role: {resume.role}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <a
                                                    href={resume.url || resume.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="te-btn-primary te-btn-sm gap-1.5 flex-shrink-0"
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
                                    <h3 className="text-sm font-bold text-[var(--te-text)] mb-3 flex items-center gap-2">
                                        <DocumentTextIcon className="h-4 w-4 text-[var(--te-text)]" />
                                        Essays & Cover Letters
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedUser.referral_essay && (
                                            <div className="p-3 bg-[var(--te-surface-alt)] rounded-lg border border-[var(--te-border)]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <DocumentTextIcon className="h-4 w-4 text-[var(--te-text)]" />
                                                    <p className="text-sm font-semibold text-[var(--te-text)]">
                                                        Referral Essay
                                                    </p>
                                                </div>
                                                <p className="text-xs text-[var(--te-text-dim)] whitespace-pre-wrap">
                                                    {selectedUser.referral_essay}
                                                </p>
                                            </div>
                                        )}
                                        {selectedUser.cover_letter && (
                                            <div className="p-3 bg-[var(--te-surface-alt)] rounded-lg border border-[var(--te-border)]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <DocumentTextIcon className="h-4 w-4 text-[var(--te-text)]" />
                                                    <p className="text-sm font-semibold text-[var(--te-text)]">
                                                        Cover Letter
                                                    </p>
                                                </div>
                                                <p className="text-xs text-[var(--te-text-dim)] whitespace-pre-wrap">
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
                                    <FolderIcon className="h-12 w-12 text-[var(--te-text-dim)] mx-auto mb-3" />
                                    <p className="text-sm font-medium text-[var(--te-text)]">No files found</p>
                                    <p className="text-xs text-[var(--te-text-dim)] mt-1">
                                        This user hasn't uploaded any files yet
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 px-6 py-4 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)] flex items-center justify-end">
                            <button
                                onClick={handleCloseUserDetailsModal}
                                className="te-btn-secondary"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Resume Review Modal */}
            <Transition appear show={cancelModal.open} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeCancelModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-[var(--te-surface)] shadow-sm transition-all">
                                    <div className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-[var(--te-surface-alt)] border border-[var(--te-border)] flex items-center justify-center">
                                                <XCircleIcon className="h-6 w-6 text-[var(--te-red)]" />
                                            </div>
                                            <div className="flex-1">
                                                <Dialog.Title className="text-lg font-semibold text-[var(--te-text)] mb-2">
                                                    Cancel Resume Review
                                                </Dialog.Title>
                                                {cancelModal.review && (
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-[var(--te-text-dim)]">
                                                            Cancel resume review for <strong>{cancelModal.review.user_name}</strong>?
                                                        </p>
                                                        <div className="bg-[var(--te-surface-alt)] rounded-lg p-3 text-sm">
                                                            <div className="text-[var(--te-text-dim)]">
                                                                <div className="font-medium">{cancelModal.review.job_title}</div>
                                                                <div className="text-xs text-[var(--te-text-dim)] mt-1">
                                                                    Level: {cancelModal.review.level}
                                                                </div>
                                                                <div className="text-xs text-[var(--te-text-dim)]">
                                                                    Status: {cancelModal.review.status}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--te-text-dim)] mb-2">
                                                                Cancellation Reason
                                                            </label>
                                                            <textarea
                                                                value={cancelModal.reason}
                                                                onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                                                                rows={3}
                                                                placeholder="Please provide a reason for cancellation..."
                                                                className="te-textarea resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[var(--te-surface-alt)] px-6 py-4 flex gap-3 justify-end">
                                        <button
                                            onClick={closeCancelModal}
                                            disabled={isCancelling}
                                            className="te-btn-secondary"
                                        >
                                            Keep Review
                                        </button>
                                        <button
                                            onClick={handleCancelReview}
                                            disabled={isCancelling}
                                            className="te-btn-danger"
                                        >
                                            {isCancelling ? 'Cancelling...' : 'Yes, Cancel Review'}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default ResumesAndEssaysManagement;
