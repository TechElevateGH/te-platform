import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import Toast from '../components/_custom/Toast';
import ConfirmDialog from '../components/_custom/Alert/ConfirmDialog';
import InputDialog from '../components/_custom/Alert/InputDialog';
import {
    DocumentTextIcon,
    PlusIcon,
    EyeIcon,
    ClockIcon,
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    ArrowDownTrayIcon,
    AdjustmentsHorizontalIcon,
    ChartBarIcon,
    SparklesIcon,
    XCircleIcon,
    UserGroupIcon,
    MagnifyingGlassIcon
} from 'icons';
import { trackEvent } from '../analytics/events';

const ResumeReviews = () => {
    const { accessToken, userRole, userId } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [myRequestsStatusFilter, setMyRequestsStatusFilter] = useState('active'); // 'active' means Pending + In Review
    const [levelFilter, setLevelFilter] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [selectedReview, setSelectedReview] = useState(null);
    const [seenReviewFeedback, setSeenReviewFeedback] = useState(new Set());
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'myAssignments', or 'assignments'

    // Check if user is volunteer or above (role >= 3)
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const isVolunteerOrAbove = userRoleInt >= 3;
    const isLeadOrAbove = userRoleInt >= 4;
    const isAdmin = userRoleInt >= 5;

    // Assignment state
    const [selectedReviewIds, setSelectedReviewIds] = useState(new Set());
    const [assignableUsers, setAssignableUsers] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignMode, setAssignMode] = useState('single'); // 'single' or 'bulk'
    const [reviewToAssign, setReviewToAssign] = useState(null);
    const [selectedAssignee, setSelectedAssignee] = useState('');
    const [myAssignedReviews, setMyAssignedReviews] = useState([]);
    const [allAssignments, setAllAssignments] = useState([]);

    // Dialog states
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, title: '', message: '' });
    const [inputDialog, setInputDialog] = useState({ isOpen: false, onSubmit: null, title: '', message: '', required: false, isTextArea: false });

    const [visibleColumns, setVisibleColumns] = useState({
        member: true,
        email: true,
        jobTitle: true,
        level: true,
        status: true,
        date: true,
        reviewer: false,
        actions: true
    });

    const [formData, setFormData] = useState({
        resume_link: '',
        job_title: '',
        level: 'Intern',
        notes: ''
    });

    // Column Management
    const toggleColumn = (column) => {
        setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
    };

    const resetColumns = () => {
        setVisibleColumns({
            member: true,
            email: true,
            jobTitle: true,
            level: true,
            status: true,
            date: true,
            reviewer: false,
            actions: true
        });
    };

    const showAllColumns = () => {
        const allColumns = {};
        Object.keys(visibleColumns).forEach(key => {
            allColumns[key] = true;
        });
        setVisibleColumns(allColumns);
    };

    // Load seen feedback from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`seenReviewFeedback_${accessToken?.substring(0, 10)}`);
        if (saved) {
            setSeenReviewFeedback(new Set(JSON.parse(saved)));
        }
    }, [accessToken]);

    // Handle review click
    const handleReviewClick = (review) => {
        setSelectedReview(review);

        // Mark this review's feedback as seen if it has feedback
        if (review.feedback && review.feedback.trim() && !seenReviewFeedback.has(review.id)) {
            const newSeen = new Set(seenReviewFeedback);
            newSeen.add(review.id);
            setSeenReviewFeedback(newSeen);
            localStorage.setItem(`seenReviewFeedback_${accessToken?.substring(0, 10)}`, JSON.stringify([...newSeen]));
        }
    };

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch user's own requests
            const myResponse = await axiosInstance.get('/resumes/reviews', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { user_id: userId }
            });
            const myReqs = myResponse.data?.reviews || [];
            setMyRequests(myReqs);

            // If volunteer or above, fetch all requests
            if (isVolunteerOrAbove) {
                const allResponse = await axiosInstance.get('/resumes/reviews', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setReviews(allResponse.data?.reviews || []);
            }
        } catch (error) {
            console.error('Error fetching resume reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [accessToken, isVolunteerOrAbove, userId]);

    useEffect(() => {
        if (accessToken) {
            fetchData();
        }
    }, [accessToken, fetchData]);

    // Fetch assignable users (volunteers and leads)
    const fetchAssignableUsers = useCallback(async () => {
        if (!isLeadOrAbove) return;

        try {
            const response = await axiosInstance.get('/users/privileged', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            // Filter for volunteers (3) and leads (4)
            const assignable = (response.data || [])
                .filter(user => user.role >= 3 && user.role <= 4)
                .map(user => ({
                    id: user.id,
                    name: user.username, // Use username as display name
                    role: user.role
                }));
            setAssignableUsers(assignable);
        } catch (error) {
            console.error('Error fetching assignable users:', error);
        }
    }, [accessToken, isLeadOrAbove]);

    useEffect(() => {
        if (accessToken && isLeadOrAbove) {
            fetchAssignableUsers();
        }
    }, [accessToken, isLeadOrAbove, fetchAssignableUsers]);

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
        if (accessToken && isVolunteerOrAbove) {
            fetchMyAssignedReviews();
        }
        if (accessToken && isAdmin) {
            fetchAllAssignments();
        }
    }, [accessToken, isVolunteerOrAbove, isAdmin, fetchMyAssignedReviews, fetchAllAssignments]);

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/resumes/reviews', formData, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            // Track resume review request
            trackEvent.resumeReviewRequested({
                job_title: formData.job_title,
                level: formData.level,
                has_notes: !!formData.notes,
                resume_link: formData.resume_link,
            });

            setToast({ message: 'Resume review request submitted', type: 'success' });
            setFormData({
                resume_link: '',
                job_title: '',
                level: 'Intern',
                notes: ''
            });
            setShowRequestForm(false);
            fetchData();
        } catch (error) {
            console.error('Error submitting request:', error);
            setToast({ message: 'Failed to submit request', type: 'error' });
        }
    };

    const handleUpdateStatus = async (reviewId, newStatus, feedback = '') => {
        try {
            await axiosInstance.patch(`/resumes/reviews?review_id=${reviewId}`, {
                status: newStatus,
                feedback: feedback
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setToast({ message: 'Status updated successfully', type: 'success' });
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
            setToast({ message: 'Failed to update status', type: 'error' });
        }
    };

    const handleCancelReview = async (reviewId, jobTitle) => {
        // Only Member (1) can cancel their own requests
        if (userRoleInt !== 1) {
            setToast({ message: 'You do not have permission to cancel', type: 'error' });
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: 'Cancel Review Request',
            message: `Are you sure you want to cancel the resume review request for "${jobTitle}"?\n\nYou can submit a new request anytime.`,
            type: 'warning',
            onConfirm: async () => {
                try {
                    await axiosInstance.patch('/resumes/reviews/cancel', {}, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        params: { review_id: reviewId }
                    });
                    setToast({ message: 'Review request cancelled', type: 'success' });
                    fetchData();
                } catch (error) {
                    console.error('Error cancelling review:', error);
                    setToast({ message: error.response?.data?.detail || 'Failed to cancel', type: 'error' });
                }
            }
        });
    };

    // Assignment functions
    const handleOpenAssignModal = (mode, review = null) => {
        setAssignMode(mode);
        setReviewToAssign(review);
        setSelectedAssignee('');
        setShowAssignModal(true);
    };

    const handleAssignSubmit = async () => {
        if (!selectedAssignee) {
            setToast({ message: 'Please select an assignee', type: 'error' });
            return;
        }

        const assignee = assignableUsers.find(u => u.id === selectedAssignee);
        if (!assignee) {
            setToast({ message: 'Invalid assignee selected', type: 'error' });
            return;
        }

        try {
            if (assignMode === 'single') {
                await axiosInstance.post('/resumes/reviews/assign', {
                    reviewer_id: assignee.id,
                    reviewer_name: assignee.name
                }, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { review_id: reviewToAssign.id }
                });
                setToast({ message: `Assigned to ${assignee.name}`, type: 'success' });
            } else {
                // Bulk assign
                const reviewIds = Array.from(selectedReviewIds);
                await axiosInstance.post('/resumes/reviews/bulk-assign', {
                    review_ids: reviewIds,
                    reviewer_id: assignee.id,
                    reviewer_name: assignee.name
                }, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setToast({ message: `Assigned ${reviewIds.length} reviews to ${assignee.name}`, type: 'success' });
                setSelectedReviewIds(new Set()); // Clear selection
            }

            setShowAssignModal(false);
            fetchData();
            fetchMyAssignedReviews();
            if (isAdmin) {
                fetchAllAssignments();
            }
        } catch (error) {
            console.error('Error assigning review:', error);
            setToast({ message: error.response?.data?.detail || 'Failed to assign', type: 'error' });
        }
    };

    const toggleReviewSelection = (reviewId) => {
        const newSelection = new Set(selectedReviewIds);
        if (newSelection.has(reviewId)) {
            newSelection.delete(reviewId);
        } else {
            newSelection.add(reviewId);
        }
        setSelectedReviewIds(newSelection);
    };

    const toggleSelectAll = () => {
        if (selectedReviewIds.size === sortedReviews.length) {
            setSelectedReviewIds(new Set());
        } else {
            setSelectedReviewIds(new Set(sortedReviews.map(r => r.id)));
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'bg-[var(--te-surface-alt)] text-[var(--te-text)] border-[var(--te-border)]',
            'In Review': 'bg-[var(--te-surface-alt)] text-[var(--te-text)] border-[var(--te-border)]',
            'Completed': 'bg-[var(--te-text)] text-[var(--te-on-primary)] border-[var(--te-text)]',
            'Declined': 'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] border-[var(--te-border)]',
            'Cancelled': 'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] border-[var(--te-border)]'
        };
        return colors[status] || 'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] border-[var(--te-border)]';
    };

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = !searchQuery ||
            review.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            review.job_title?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || review.status === statusFilter;
        const matchesLevel = !levelFilter || review.level === levelFilter;
        return matchesSearch && matchesStatus && matchesLevel;
    });

    const sortedReviews = [...filteredReviews].sort((a, b) => {
        switch (sortBy) {
            case 'date_desc':
                return new Date(b.submitted_date) - new Date(a.submitted_date);
            case 'date_asc':
                return new Date(a.submitted_date) - new Date(b.submitted_date);
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

    const stats = {
        total: reviews.length,
        pending: reviews.filter(r => r.status === 'Pending').length,
        inReview: reviews.filter(r => r.status === 'In Review').length,
        completed: reviews.filter(r => r.status === 'Completed').length
    };

    const exportToCSV = () => {
        const headers = ['Member', 'Email', 'Job Title', 'Level', 'Status', 'Submitted Date', 'Reviewer'];
        const rows = sortedReviews.map(review => [
            review.user_name,
            review.user_email,
            review.job_title,
            review.level,
            review.status,
            review.submitted_date,
            review.reviewer_name || 'N/A'
        ]);

        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume-reviews-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const clearAllFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setLevelFilter('');
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[var(--te-bg)]">
                <Loading />
            </div>
        );
    }

    return (
        <div className="min-h-screen h-full bg-[var(--te-bg)] text-[var(--te-text)]">
            <header className="border-b border-[var(--te-border)] bg-[var(--te-surface)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="te-eyebrow">{'// reviews'}</span>
                            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--te-text)] sm:text-4xl">
                                Resume Reviews
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--te-text-dim)]">
                                {isVolunteerOrAbove ? 'Review member resumes and provide feedback' : 'Request professional resume review'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {isVolunteerOrAbove && (
                                <>
                                    {/* Column Selector */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                                            className="te-btn-secondary te-btn-sm gap-1.5"
                                        >
                                            <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                            Columns
                                        </button>
                                        {showColumnSelector && (
                                            <div className="absolute right-0 mt-2 w-56 bg-[var(--te-surface)] rounded-lg shadow-sm border border-[var(--te-border)] p-3 z-50">
                                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--te-border)]">
                                                    <span className="text-xs font-bold text-[var(--te-text)]">Visible Columns</span>
                                                    <button onClick={() => setShowColumnSelector(false)} className="te-icon-btn">
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                                    {Object.keys(visibleColumns).map(col => (
                                                        <label key={col} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[var(--te-hover)] rounded cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={visibleColumns[col]}
                                                                onChange={() => toggleColumn(col)}
                                                                className="h-4 w-4 rounded border-[var(--te-border)] text-[var(--te-text)] focus:ring-[var(--te-ring)]"
                                                            />
                                                            <span className="text-sm text-[var(--te-text-dim)] capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2 mt-3 pt-2 border-t border-[var(--te-border)]">
                                                    <button onClick={resetColumns} className="te-btn-secondary te-btn-sm flex-1">Reset</button>
                                                    <button onClick={showAllColumns} className="te-btn-primary te-btn-sm flex-1">Show All</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Export CSV */}
                                    <button
                                        onClick={exportToCSV}
                                        className="te-btn-secondary te-btn-sm gap-1.5"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                        Export
                                    </button>
                                </>
                            )}

                            {/* Request Button */}
                            <button
                                onClick={() => setShowRequestForm(true)}
                                className="te-btn-primary"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Request Review
                            </button>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    {isVolunteerOrAbove && (
                        <div className="mt-6 grid grid-cols-2 gap-px border border-[var(--te-border)] bg-[var(--te-border)] sm:grid-cols-4">
                            <div className="bg-[var(--te-surface)] p-4">
                                <ChartBarIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                <span className="mt-3 block font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Total</span>
                                <span className="mt-1 block font-display text-2xl font-bold text-[var(--te-text)]">{stats.total}</span>
                            </div>
                            <div className="bg-[var(--te-surface)] p-4">
                                <ClockIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                <span className="mt-3 block font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Pending</span>
                                <span className="mt-1 block font-display text-2xl font-bold text-[var(--te-text)]">{stats.pending}</span>
                            </div>
                            <div className="bg-[var(--te-surface)] p-4">
                                <SparklesIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                <span className="mt-3 block font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">In Review</span>
                                <span className="mt-1 block font-display text-2xl font-bold text-[var(--te-text)]">{stats.inReview}</span>
                            </div>
                            <div className="bg-[var(--te-surface)] p-4">
                                <CheckCircleIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                <span className="mt-3 block font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Completed</span>
                                <span className="mt-1 block font-display text-2xl font-bold text-[var(--te-text)]">{stats.completed}</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Tabs (for Volunteers and above) */}
            {isVolunteerOrAbove && (
                <div className="border-b border-[var(--te-border)] bg-[var(--te-surface)]">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <nav className="flex gap-6 overflow-x-auto te-scroll" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'all'
                                    ? 'border-[var(--te-border-strong)] text-[var(--te-text)]'
                                    : 'border-transparent text-[var(--te-text-dim)] hover:text-[var(--te-text)] hover:border-[var(--te-border)]'
                                    }`}
                            >
                                All Requests
                            </button>
                            <button
                                onClick={() => setActiveTab('myAssignments')}
                                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'myAssignments'
                                    ? 'border-[var(--te-border-strong)] text-[var(--te-text)]'
                                    : 'border-transparent text-[var(--te-text-dim)] hover:text-[var(--te-text)] hover:border-[var(--te-border)]'
                                    }`}
                            >
                                My Assignments
                                {myAssignedReviews.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 text-xs rounded-md bg-[var(--te-surface-alt)] text-[var(--te-text)]">
                                        {myAssignedReviews.length}
                                    </span>
                                )}
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('assignments')}
                                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'assignments'
                                        ? 'border-[var(--te-border-strong)] text-[var(--te-text)]'
                                        : 'border-transparent text-[var(--te-text-dim)] hover:text-[var(--te-text)] hover:border-[var(--te-border)]'
                                        }`}
                                >
                                    All Assignments
                                    {allAssignments.length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 text-xs rounded-md bg-[var(--te-surface-alt)] text-[var(--te-text)]">
                                            {allAssignments.length}
                                        </span>
                                    )}
                                </button>
                            )}
                        </nav>
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                {/* My Requests Section */}
                {!isVolunteerOrAbove && myRequests.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-[var(--te-text)] flex items-center gap-2">
                                <ChatBubbleLeftRightIcon className="h-5 w-5 text-[var(--te-text)]" />
                                My Resume Review Requests
                            </h2>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-[var(--te-text-dim)]">Filter:</label>
                                <select
                                    value={myRequestsStatusFilter}
                                    onChange={(e) => setMyRequestsStatusFilter(e.target.value)}
                                    className="te-select py-1.5"
                                >
                                    <option value="active">Active (Pending + In Review)</option>
                                    <option value="">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="In Review">In Review</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Declined">Declined</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {myRequests.filter(request => {
                                if (myRequestsStatusFilter === 'active') {
                                    return request.status === 'Pending' || request.status === 'In Review';
                                }
                                return !myRequestsStatusFilter || request.status === myRequestsStatusFilter;
                            }).map(request => (
                                <div
                                    key={request.id}
                                    className="te-card-interactive p-4 relative"
                                >
                                    {request.feedback && request.feedback.trim() && !seenReviewFeedback.has(request.id) && (
                                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center border border-[var(--te-border-strong)] bg-[var(--te-surface)]">
                                            <span className="font-mono text-[10px] font-bold text-[var(--te-text)]">!</span>
                                        </span>
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => handleReviewClick(request)}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-[var(--te-text)]">{request.job_title}</h3>
                                                <span className={`px-2 py-1 text-xs font-bold rounded-md border ${getStatusColor(request.status)}`}>
                                                    {request.status}
                                                </span>
                                                <span className="px-2 py-1 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] rounded">
                                                    {request.level}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[var(--te-text-dim)] mb-2">
                                                Submitted: {request.submitted_date}
                                            </p>
                                            {request.feedback && (
                                                <div className="mt-3 p-3 bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded">
                                                    <div className="flex items-start gap-2">
                                                        <span className="inline-flex rounded-md h-2 w-2 mt-1 bg-[var(--te-border-strong)]"></span>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-[var(--te-text)] mb-1">Feedback from {request.reviewer_name}</p>
                                                            <p className="text-sm text-[var(--te-text-dim)] line-clamp-2">{request.feedback}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Cancel button - Only for Member (1) */}
                                        {userRoleInt === 1 && request.status !== 'Cancelled' && request.status !== 'Completed' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCancelReview(request.id, request.job_title);
                                                }}
                                                className="te-icon-btn ml-3"
                                                title="Cancel request"
                                            >
                                                <XCircleIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters (for Volunteers and above) */}
                {isVolunteerOrAbove && (
                    <>
                        {/* Search and Sort Bar */}
                        <div className="te-card rounded-lg p-2 mb-3 transition-colors">
                            <div className="flex items-center gap-3">
                                {/* Global Search */}
                                <div className="flex-1 relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--te-text-dim)]" />
                                    <input
                                        type="text"
                                        placeholder="Search reviews (member, email, job title)..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="te-input pl-9"
                                    />
                                </div>

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
                                        <option value="date_desc">Newest First</option>
                                        <option value="date_asc">Oldest First</option>
                                        <option value="member_asc">Member (A-Z)</option>
                                        <option value="member_desc">Member (Z-A)</option>
                                        <option value="status_asc">Status (A-Z)</option>
                                        <option value="status_desc">Status (Z-A)</option>
                                    </select>
                                </div>

                                {/* Advanced Filters Button */}
                                <button
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className={`te-btn-sm gap-1.5 ${showAdvancedFilters ? 'te-btn-primary' : 'te-btn-secondary'}`}
                                >
                                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                    Filters
                                    {(statusFilter || levelFilter) && (
                                        <span className="ml-1 px-1.5 py-0.5 text-xs bg-[var(--te-surface-alt)] rounded-md">
                                            {[statusFilter, levelFilter].filter(Boolean).length}
                                        </span>
                                    )}
                                </button>

                                {/* Results Count */}
                                <div className="text-xs font-medium text-[var(--te-text-dim)] whitespace-nowrap">
                                    {sortedReviews.length} of {reviews.length}
                                </div>
                            </div>
                        </div>

                        {/* Advanced Filters Panel */}
                        {showAdvancedFilters && (
                            <div className="te-card rounded-lg p-3 mb-3 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <AdjustmentsHorizontalIcon className="h-4 w-4 text-[var(--te-text)]" />
                                        <h3 className="text-sm font-bold text-[var(--te-text)]">Advanced Filters</h3>
                                    </div>
                                    {(statusFilter || levelFilter) && (
                                        <button
                                            onClick={clearAllFilters}
                                            className="te-btn-danger te-btn-sm gap-1"
                                        >
                                            <XMarkIcon className="h-3.5 w-3.5" />
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {/* Status Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                            Status
                                        </label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="te-select"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="Pending">Pending</option>
                                            <option value="In Review">In Review</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Declined">Declined</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    {/* Level Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--te-text-dim)] mb-1">
                                            Level
                                        </label>
                                        <select
                                            value={levelFilter}
                                            onChange={(e) => setLevelFilter(e.target.value)}
                                            className="te-select"
                                        >
                                            <option value="">All Levels</option>
                                            <option value="Intern">Intern</option>
                                            <option value="Entry Level">Entry Level</option>
                                            <option value="Mid Level">Mid Level</option>
                                            <option value="Senior Level">Senior Level</option>
                                            <option value="Lead/Principal">Lead/Principal</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* All Requests Table (for Volunteers and above) */}
                {isVolunteerOrAbove && activeTab === 'all' && (
                    <div className="te-card rounded-lg overflow-hidden shadow-sm transition-colors">
                        {/* Bulk Actions Bar */}
                        {isLeadOrAbove && selectedReviewIds.size > 0 && (
                            <div className="px-4 py-3 bg-[var(--te-surface-alt)] border-b border-[var(--te-border)] flex items-center justify-between">
                                <span className="text-sm font-medium text-[var(--te-text)] text-[var(--te-text-dim)]">
                                    {selectedReviewIds.size} review{selectedReviewIds.size !== 1 ? 's' : ''} selected
                                </span>
                                <button
                                    onClick={() => handleOpenAssignModal('bulk')}
                                    className="te-btn-primary te-btn-sm"
                                >
                                    <UserGroupIcon className="h-4 w-4" />
                                    Assign Selected
                                </button>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)] transition-colors">
                                        {isLeadOrAbove && (
                                            <th className="px-4 py-3 text-left w-12">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedReviewIds.size === sortedReviews.length && sortedReviews.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="h-4 w-4 rounded border-[var(--te-border)] text-[var(--te-text)] focus:ring-[var(--te-ring)]"
                                                />
                                            </th>
                                        )}
                                        {visibleColumns.member && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Member
                                            </th>
                                        )}
                                        {visibleColumns.email && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Email
                                            </th>
                                        )}
                                        {visibleColumns.jobTitle && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Job Title
                                            </th>
                                        )}
                                        {visibleColumns.level && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Level
                                            </th>
                                        )}
                                        {visibleColumns.status && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Status
                                            </th>
                                        )}
                                        {visibleColumns.date && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Submitted
                                            </th>
                                        )}
                                        {visibleColumns.reviewer && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Reviewer
                                            </th>
                                        )}
                                        {visibleColumns.actions && (
                                            <th className="px-4 py-3 text-right text-xs font-bold text-[var(--te-text-dim)] uppercase tracking-wider">
                                                Actions
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--te-border)] transition-colors">
                                    {sortedReviews.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-12 text-center text-sm text-[var(--te-text-dim)]">
                                                No resume review requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedReviews.map((review) => (
                                            <tr
                                                key={review.id}
                                                className="hover:bg-[var(--te-hover)] transition-all"
                                            >
                                                {isLeadOrAbove && (
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedReviewIds.has(review.id)}
                                                            onChange={() => toggleReviewSelection(review.id)}
                                                            className="h-4 w-4 rounded border-[var(--te-border)] text-[var(--te-text)] focus:ring-[var(--te-ring)]"
                                                        />
                                                    </td>
                                                )}
                                                {visibleColumns.member && (
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-medium text-[var(--te-text)]">
                                                            {review.user_name}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.email && (
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-[var(--te-text-dim)]">
                                                            {review.user_email}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.jobTitle && (
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-[var(--te-text-dim)]">
                                                            {review.job_title}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.level && (
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-1 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] rounded">
                                                            {review.level}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.status && (
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md border ${getStatusColor(review.status)}`}>
                                                            {review.status}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.date && (
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-[var(--te-text-dim)]">
                                                            {review.submitted_date}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.reviewer && (
                                                    <td className="px-4 py-3">
                                                        {review.reviewer_name ? (
                                                            <div className="text-xs">
                                                                <div className="font-medium text-[var(--te-text)]">
                                                                    {review.reviewer_name}
                                                                </div>
                                                                {review.assigned_date && (
                                                                    <div className="text-[var(--te-text-dim)] mt-0.5">
                                                                        {review.assigned_date}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-[var(--te-text-dim)] italic">Unassigned</span>
                                                        )}
                                                    </td>
                                                )}
                                                {visibleColumns.actions && (
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a
                                                                href={review.resume_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="te-btn-primary te-btn-sm gap-1"
                                                            >
                                                                <EyeIcon className="h-3.5 w-3.5" />
                                                                View
                                                            </a>

                                                            {/* Assign button for Lead+ on Pending reviews */}
                                                            {isLeadOrAbove && review.status === 'Pending' && !review.reviewer_name && (
                                                                <button
                                                                    onClick={() => handleOpenAssignModal('single', review)}
                                                                    className="te-btn-primary te-btn-sm gap-1"
                                                                >
                                                                    <UserGroupIcon className="h-3.5 w-3.5" />
                                                                    Assign
                                                                </button>
                                                            )}

                                                            {review.status === 'Pending' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setInputDialog({
                                                                            isOpen: true,
                                                                            title: 'Start Review',
                                                                            message: 'Enter your feedback (optional):',
                                                                            required: false,
                                                                            isTextArea: true,
                                                                            onSubmit: (feedback) => {
                                                                                handleUpdateStatus(review.id, 'In Review', feedback);
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="te-btn-primary te-btn-sm"
                                                                >
                                                                    Start Review
                                                                </button>
                                                            )}
                                                            {review.status === 'In Review' && (
                                                                <button
                                                                    onClick={() => {
                                                                        setInputDialog({
                                                                            isOpen: true,
                                                                            title: 'Complete Review',
                                                                            message: 'Enter your final feedback:',
                                                                            required: true,
                                                                            isTextArea: true,
                                                                            onSubmit: (feedback) => {
                                                                                handleUpdateStatus(review.id, 'Completed', feedback);
                                                                            }
                                                                        });
                                                                    }}
                                                                    className="te-btn-primary te-btn-sm"
                                                                >
                                                                    Complete
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
                )}

                {/* My Assignments Tab (for Volunteers and Leads) */}
                {isVolunteerOrAbove && activeTab === 'myAssignments' && (
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
                                    {myAssignedReviews.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-12 text-center text-sm text-[var(--te-text-dim)]">
                                                No reviews assigned to you yet
                                            </td>
                                        </tr>
                                    ) : (
                                        myAssignedReviews.map((review) => (
                                            <tr key={review.id} className="hover:bg-[var(--te-hover)] transition-colors">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="text-sm font-medium text-[var(--te-text)]">{review.user_name}</div>
                                                        <div className="text-xs text-[var(--te-text-dim)]">{review.user_email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[var(--te-text-dim)]">{review.job_title}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] rounded">
                                                        {review.level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md border ${getStatusColor(review.status)}`}>
                                                        {review.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[var(--te-text-dim)]">{review.assigned_date}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={review.resume_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="te-btn-primary te-btn-sm gap-1"
                                                        >
                                                            <EyeIcon className="h-3.5 w-3.5" />
                                                            View
                                                        </a>
                                                        {review.status === 'In Review' && (
                                                            <button
                                                                onClick={() => {
                                                                    setInputDialog({
                                                                        isOpen: true,
                                                                        title: 'Complete Review',
                                                                        message: 'Enter your final feedback:',
                                                                        required: true,
                                                                        isTextArea: true,
                                                                        onSubmit: (feedback) => {
                                                                            handleUpdateStatus(review.id, 'Completed', feedback);
                                                                        }
                                                                    });
                                                                }}
                                                                className="te-btn-primary te-btn-sm"
                                                            >
                                                                Complete
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
                )}

                {/* All Assignments Tab (for Admin only) */}
                {isAdmin && activeTab === 'assignments' && (
                    <div className="te-card rounded-lg overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-[var(--te-border)]">
                            <h3 className="text-lg font-bold text-[var(--te-text)]">All Assignments</h3>
                            <p className="text-sm text-[var(--te-text-dim)] mt-1">
                                Overview of all resume review assignments
                            </p>
                        </div>
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
                                    {allAssignments.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-12 text-center text-sm text-[var(--te-text-dim)]">
                                                No assignments yet
                                            </td>
                                        </tr>
                                    ) : (
                                        allAssignments.map((review) => (
                                            <tr key={review.id} className="hover:bg-[var(--te-hover)] transition-colors">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="text-sm font-medium text-[var(--te-text)]">{review.user_name}</div>
                                                        <div className="text-xs text-[var(--te-text-dim)]">{review.user_email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[var(--te-text-dim)]">{review.job_title}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 text-xs font-medium bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] rounded">
                                                        {review.level}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-medium text-[var(--te-text)]">
                                                        {review.reviewer_name}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md border ${getStatusColor(review.status)}`}>
                                                        {review.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-[var(--te-text-dim)]">{review.assigned_date}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={review.resume_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="te-btn-primary te-btn-sm gap-1"
                                                        >
                                                            <EyeIcon className="h-3.5 w-3.5" />
                                                            View
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
                )}
            </div>

            {/* Request Form Modal */}
            {showRequestForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="te-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-[var(--te-surface-alt)] border-b border-[var(--te-border)] text-[var(--te-text)] px-6 py-4 rounded-t-lg">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <DocumentTextIcon className="h-6 w-6" />
                                    Request Resume Review
                                </h2>
                                <button
                                    onClick={() => setShowRequestForm(false)}
                                    className="te-icon-btn text-[var(--te-text)] hover:bg-[var(--te-hover)]"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-left text-sm font-semibold text-[var(--te-text-dim)] mb-1.5">
                                    Google Docs Resume Link *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.resume_link}
                                    onChange={(e) => setFormData({ ...formData, resume_link: e.target.value })}
                                    placeholder="https://docs.google.com/document/d/..."
                                    className="te-input"
                                />
                                <p className="mt-1 text-xs text-left text-[var(--te-text-dim)]">
                                    Make sure your resume is shared with "Anyone with the link can view"
                                </p>
                            </div>

                            <div>
                                <label className="block text-left text-sm font-semibold text-[var(--te-text-dim)] mb-1.5">
                                    Target Job Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.job_title}
                                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                    placeholder="e.g., Software Engineer, Data Analyst"
                                    className="te-input"
                                />
                            </div>

                            <div>
                                <label className="block text-left text-sm font-semibold text-[var(--te-text-dim)] mb-1.5">
                                    Experience Level *
                                </label>
                                <select
                                    required
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    className="te-select"
                                >
                                    <option value="Intern">Intern</option>
                                    <option value="Entry Level">Entry Level (0-2 years)</option>
                                    <option value="Mid Level">Mid Level (3-5 years)</option>
                                    <option value="Senior Level">Senior Level (6-10 years)</option>
                                    <option value="Lead/Principal">Lead/Principal (10+ years)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-left text-sm font-semibold text-[var(--te-text-dim)] mb-1.5">
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any specific areas you'd like feedback on?"
                                    rows="3"
                                    className="te-textarea resize-none"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestForm(false)}
                                    className="te-btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="te-btn-primary flex-1"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="te-panel max-w-md w-full">
                        <div className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)] text-[var(--te-text)] px-6 py-4 rounded-t-lg">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <UserGroupIcon className="h-6 w-6" />
                                    Assign Review{assignMode === 'bulk' ? 's' : ''}
                                </h2>
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="te-icon-btn text-[var(--te-text)] hover:bg-[var(--te-hover)]"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-[var(--te-text-dim)] mb-4">
                                    {assignMode === 'bulk'
                                        ? `Assign ${selectedReviewIds.size} review${selectedReviewIds.size !== 1 ? 's' : ''} to:`
                                        : `Assign "${reviewToAssign?.job_title}" review to:`
                                    }
                                </p>

                                <label className="block text-sm font-semibold text-[var(--te-text-dim)] mb-2">
                                    Select Reviewer
                                </label>
                                <select
                                    value={selectedAssignee}
                                    onChange={(e) => setSelectedAssignee(e.target.value)}
                                    className="te-select"
                                >
                                    <option value="">-- Select a volunteer or lead --</option>
                                    {assignableUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.role === 3 ? 'Volunteer' : 'Lead'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="te-btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAssignSubmit}
                                    disabled={!selectedAssignee}
                                    className="te-btn-primary flex-1"
                                >
                                    Assign
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resume Review Details Modal */}
            {selectedReview && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReview(null)}>
                    <div className="te-panel max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)] px-6 py-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="font-display text-xl font-bold text-[var(--te-text)] mb-1">Resume Review</h2>
                                    <p className="text-sm font-medium text-[var(--te-text-dim)]">{selectedReview.job_title}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="te-icon-btn"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1.5 text-xs font-bold rounded-md border ${getStatusColor(selectedReview.status)}`}>
                                    {selectedReview.status}
                                </span>
                                <span className="font-mono text-xs text-[var(--te-text-dim)]">Submitted {selectedReview.submitted_date}</span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[var(--te-surface-alt)] rounded-lg p-4 border border-[var(--te-border)]">
                                    <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-2">Level</p>
                                    <p className="text-base font-bold text-[var(--te-text)]">{selectedReview.level}</p>
                                </div>
                                {selectedReview.reviewer_name && (
                                    <div className="bg-[var(--te-surface-alt)] rounded-lg p-4 border border-[var(--te-border)]">
                                        <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-2">Reviewer</p>
                                        <p className="text-base font-bold text-[var(--te-text)]">{selectedReview.reviewer_name}</p>
                                    </div>
                                )}
                            </div>

                            {/* Resume Link */}
                            <div>
                                <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-3">Resume</p>
                                <a
                                    href={selectedReview.resume_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group te-btn-secondary group"
                                >
                                    <DocumentTextIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    View Resume
                                </a>
                            </div>

                            {/* Notes */}
                            {selectedReview.notes && (
                                <div>
                                    <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-3">Your Notes</p>
                                    <div className="bg-[var(--te-surface-alt)] rounded-lg p-4 border border-[var(--te-border)]">
                                        <p className="text-sm text-[var(--te-text-dim)] leading-relaxed whitespace-pre-wrap">{selectedReview.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Feedback */}
                            {selectedReview.feedback && selectedReview.feedback.trim() && (
                                <div>
                                    <p className="text-xs font-semibold text-[var(--te-text)] uppercase tracking-wider mb-3">
                                        Feedback from {selectedReview.reviewer_name || 'Reviewer'}
                                    </p>
                                    <div className="bg-[var(--te-surface-alt)] rounded-lg p-4 border-2 border-[var(--te-border)] shadow-sm">
                                        <p className="text-sm text-[var(--te-text)] leading-relaxed whitespace-pre-wrap">{selectedReview.feedback}</p>
                                    </div>
                                </div>
                            )}

                            {/* Member Info (for volunteers and above) */}
                            {isVolunteerOrAbove && (
                                <div>
                                    <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-3">Member Information</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[var(--te-surface-alt)] rounded-lg p-4 border border-[var(--te-border)]">
                                            <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-2">Name</p>
                                            <p className="text-sm font-bold text-[var(--te-text)]">{selectedReview.member_name}</p>
                                        </div>
                                        {selectedReview.member_email && (
                                            <div className="bg-[var(--te-surface-alt)] rounded-lg p-4 border border-[var(--te-border)]">
                                                <p className="text-xs font-semibold text-[var(--te-text-dim)] uppercase tracking-wider mb-2">Email</p>
                                                <p className="text-sm font-bold text-[var(--te-text)] break-all">{selectedReview.member_email}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type={confirmDialog.type}
                confirmText="Confirm"
                cancelText="Cancel"
            />

            {/* Input Dialog */}
            <InputDialog
                isOpen={inputDialog.isOpen}
                onClose={() => setInputDialog(prev => ({ ...prev, isOpen: false }))}
                onSubmit={inputDialog.onSubmit}
                title={inputDialog.title}
                message={inputDialog.message}
                required={inputDialog.required}
                isTextArea={inputDialog.isTextArea}
                submitText="Submit"
                cancelText="Cancel"
            />
        </div>
    );
};

export default ResumeReviews;
