import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
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
    SparklesIcon
} from '@heroicons/react/24/outline';
import { trackEvent } from '../analytics/events';

const ResumeReviews = () => {
    const { accessToken, userRole } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [myRequestsStatusFilter, setMyRequestsStatusFilter] = useState('active'); // 'active' means Pending + In Review
    const [levelFilter, setLevelFilter] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [selectedReview, setSelectedReview] = useState(null);
    const [seenReviewFeedback, setSeenReviewFeedback] = useState(new Set());

    // Check if user is volunteer or above (role >= 3)
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const isVolunteerOrAbove = userRoleInt >= 3;

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
            const myResponse = await axiosInstance.get('/resume-reviews/my-requests', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const myReqs = myResponse.data?.reviews || [];
            setMyRequests(myReqs);

            // Debug logging
            console.log('ResumeReviews - My requests count:', myReqs.length);
            console.log('ResumeReviews - Requests with feedback:', myReqs.filter(r => r.feedback && r.feedback.trim()).length);
            console.log('ResumeReviews - My requests data:', myReqs.map(r => ({
                job_title: r.job_title,
                status: r.status,
                has_feedback: !!r.feedback,
                feedback: r.feedback,
                reviewer_name: r.reviewer_name
            })));

            // If volunteer or above, fetch all requests
            if (isVolunteerOrAbove) {
                const allResponse = await axiosInstance.get('/resume-reviews/all', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setReviews(allResponse.data?.reviews || []);
            }
        } catch (error) {
            console.error('Error fetching resume reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [accessToken, isVolunteerOrAbove]);

    useEffect(() => {
        if (accessToken) {
            fetchData();
        }
    }, [accessToken, fetchData]);

    const handleSubmitRequest = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/resume-reviews', formData, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            // Track resume review request
            trackEvent.resumeReviewRequested({
                job_title: formData.job_title,
                level: formData.level,
                has_notes: !!formData.notes,
                resume_link: formData.resume_link,
            });

            alert('Resume review request submitted successfully!');
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
            alert('Failed to submit request. Please try again.');
        }
    };

    const handleUpdateStatus = async (reviewId, newStatus, feedback = '') => {
        try {
            await axiosInstance.patch(`/resume-reviews/${reviewId}`, {
                status: newStatus,
                feedback: feedback
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            alert('Status updated successfully!');
            fetchData();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status.');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
            'In Review': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            'Completed': 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            'Declined': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    };

    const filteredReviews = reviews.filter(review => {
        const matchesStatus = !statusFilter || review.status === statusFilter;
        const matchesLevel = !levelFilter || review.level === levelFilter;
        return matchesStatus && matchesLevel;
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
        setStatusFilter('');
        setLevelFilter('');
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
            {/* Sticky Header */}
            <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors">
                <div className="max-w-7xl mx-auto px-4">
                    {/* Title Row */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <DocumentTextIcon className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                                Resume Reviews
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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
                                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                            Columns
                                        </button>
                                        {showColumnSelector && (
                                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 p-3 z-50">
                                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">Visible Columns</span>
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
                                                                className="rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                                                            />
                                                            <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{col.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                                                    <button onClick={resetColumns} className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500">Reset</button>
                                                    <button onClick={showAllColumns} className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700">Show All</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Export CSV */}
                                    <button
                                        onClick={exportToCSV}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                        Export
                                    </button>
                                </>
                            )}

                            {/* Request Button */}
                            <button
                                onClick={() => setShowRequestForm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Request Review
                            </button>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    {isVolunteerOrAbove && (
                        <div className="flex items-center gap-6 py-2.5 text-sm">
                            <div className="flex items-center gap-2">
                                <ChartBarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <span className="text-gray-500 dark:text-gray-400">Total:</span>
                                <span className="font-bold text-gray-900 dark:text-white">{stats.total}</span>
                            </div>
                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <div className="flex items-center gap-2">
                                <ClockIcon className="h-4 w-4 text-yellow-500" />
                                <span className="text-gray-500 dark:text-gray-400">Pending:</span>
                                <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</span>
                            </div>
                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <div className="flex items-center gap-2">
                                <SparklesIcon className="h-4 w-4 text-blue-500" />
                                <span className="text-gray-500 dark:text-gray-400">In Review:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.inReview}</span>
                            </div>
                            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                            <div className="flex items-center gap-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                <span className="text-gray-500 dark:text-gray-400">Completed:</span>
                                <span className="font-bold text-green-600 dark:text-green-400">{stats.completed}</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-3">
                {/* My Requests Section */}
                {!isVolunteerOrAbove && myRequests.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                My Resume Review Requests
                            </h2>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</label>
                                <select
                                    value={myRequestsStatusFilter}
                                    onChange={(e) => setMyRequestsStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 transition-colors"
                                >
                                    <option value="active">Active (Pending + In Review)</option>
                                    <option value="">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="In Review">In Review</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Declined">Declined</option>
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
                                    onClick={() => handleReviewClick(request)}
                                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow relative cursor-pointer"
                                >
                                    {request.feedback && request.feedback.trim() && !seenReviewFeedback.has(request.id) && (
                                        <span className="absolute -top-2 -right-2 flex h-5 w-5 bg-red-500 rounded-full items-center justify-center">
                                            <span className="text-white text-[10px] font-bold">!</span>
                                        </span>
                                    )}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">{request.job_title}</h3>
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(request.status)}`}>
                                                    {request.status}
                                                </span>
                                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                    {request.level}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                Submitted: {request.submitted_date}
                                            </p>
                                            {request.feedback && (
                                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                                                    <div className="flex items-start gap-2">
                                                        <span className="inline-flex rounded-full h-2 w-2 mt-1 bg-blue-500"></span>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Feedback from {request.reviewer_name}</p>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{request.feedback}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters (for Volunteers and above) */}
                {isVolunteerOrAbove && (
                    <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            {/* Status Filter */}
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-purple-500 transition-colors"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="In Review">In Review</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Declined">Declined</option>
                                </select>
                            </div>

                            {/* Level Filter */}
                            <div className="md:col-span-3">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                    Level
                                </label>
                                <select
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-purple-500 transition-colors"
                                >
                                    <option value="">All Levels</option>
                                    <option value="Intern">Intern</option>
                                    <option value="Entry Level">Entry Level</option>
                                    <option value="Mid Level">Mid Level</option>
                                    <option value="Senior Level">Senior Level</option>
                                    <option value="Lead/Principal">Lead/Principal</option>
                                </select>
                            </div>

                            {/* Sort */}
                            <div className="md:col-span-4">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                    Sort by
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-purple-500 transition-colors"
                                >
                                    <option value="date_desc">Date (Newest)</option>
                                    <option value="date_asc">Date (Oldest)</option>
                                    <option value="member_asc">Member (A-Z)</option>
                                    <option value="member_desc">Member (Z-A)</option>
                                    <option value="status_asc">Status (A-Z)</option>
                                    <option value="status_desc">Status (Z-A)</option>
                                </select>
                            </div>

                            {/* Results Count */}
                            <div className="md:col-span-2 text-xs font-medium text-gray-500 dark:text-gray-400 text-right">
                                {sortedReviews.length} of {reviews.length}
                            </div>
                        </div>

                        {/* Active Filters */}
                        {(statusFilter || levelFilter) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {statusFilter && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                            Status: {statusFilter}
                                        </span>
                                    )}
                                    {levelFilter && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                            Level: {levelFilter}
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
                )}

                {/* All Requests Table (for Volunteers and above) */}
                {isVolunteerOrAbove && (
                    <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-600 transition-colors">
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
                                        {visibleColumns.jobTitle && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Job Title
                                            </th>
                                        )}
                                        {visibleColumns.level && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Level
                                            </th>
                                        )}
                                        {visibleColumns.status && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                        )}
                                        {visibleColumns.date && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Submitted
                                            </th>
                                        )}
                                        {visibleColumns.reviewer && (
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Reviewer
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
                                    {sortedReviews.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                No resume review requests found
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedReviews.map((review) => (
                                            <tr
                                                key={review.id}
                                                className="hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-pink-50/30 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all"
                                            >
                                                {visibleColumns.member && (
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {review.user_name}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.email && (
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                                            {review.user_email}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.jobTitle && (
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">
                                                            {review.job_title}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.level && (
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                                            {review.level}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.status && (
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${getStatusColor(review.status)}`}>
                                                            {review.status}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.date && (
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {review.submitted_date}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.reviewer && (
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                                            {review.reviewer_name || 'N/A'}
                                                        </span>
                                                    </td>
                                                )}
                                                {visibleColumns.actions && (
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a
                                                                href={review.resume_link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-2.5 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                                                            >
                                                                <EyeIcon className="h-3.5 w-3.5" />
                                                                View
                                                            </a>
                                                            {review.status === 'Pending' && (
                                                                <button
                                                                    onClick={() => {
                                                                        const feedback = prompt('Enter your feedback (optional):');
                                                                        if (feedback !== null) {
                                                                            handleUpdateStatus(review.id, 'In Review', feedback);
                                                                        }
                                                                    }}
                                                                    className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors"
                                                                >
                                                                    Start Review
                                                                </button>
                                                            )}
                                                            {review.status === 'In Review' && (
                                                                <button
                                                                    onClick={() => {
                                                                        const feedback = prompt('Enter your final feedback:');
                                                                        if (feedback) {
                                                                            handleUpdateStatus(review.id, 'Completed', feedback);
                                                                        }
                                                                    }}
                                                                    className="px-2.5 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors"
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
            </div>

            {/* Request Form Modal */}
            {showRequestForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <DocumentTextIcon className="h-6 w-6" />
                                    Request Resume Review
                                </h2>
                                <button
                                    onClick={() => setShowRequestForm(false)}
                                    className="text-white hover:bg-white/20 rounded p-1"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Google Docs Resume Link *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.resume_link}
                                    onChange={(e) => setFormData({ ...formData, resume_link: e.target.value })}
                                    placeholder="https://docs.google.com/document/d/..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Make sure your resume is shared with "Anyone with the link can view"
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Target Job Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.job_title}
                                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                    placeholder="e.g., Software Engineer, Data Analyst"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Experience Level *
                                </label>
                                <select
                                    required
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="Intern">Intern</option>
                                    <option value="Entry Level">Entry Level (0-2 years)</option>
                                    <option value="Mid Level">Mid Level (3-5 years)</option>
                                    <option value="Senior Level">Senior Level (6-10 years)</option>
                                    <option value="Lead/Principal">Lead/Principal (10+ years)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any specific areas you'd like feedback on?"
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowRequestForm(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resume Review Details Modal */}
            {selectedReview && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReview(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-700 dark:to-pink-700 px-6 py-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1">Resume Review</h2>
                                    <p className="text-sm text-white/95 font-medium">{selectedReview.job_title}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedReview(null)}
                                    className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(selectedReview.status)}`}>
                                    {selectedReview.status}
                                </span>
                                <span className="text-xs text-white/80 font-medium">Submitted {selectedReview.submitted_date}</span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Level</p>
                                    <p className="text-base font-bold text-gray-900 dark:text-white">{selectedReview.level}</p>
                                </div>
                                {selectedReview.reviewer_name && (
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Reviewer</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white">{selectedReview.reviewer_name}</p>
                                    </div>
                                )}
                            </div>

                            {/* Resume Link */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Resume</p>
                                <a
                                    href={selectedReview.resume_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-2 border-purple-200 dark:border-purple-700 rounded-xl transition-all hover:shadow-lg hover:shadow-purple-500/20"
                                >
                                    <DocumentTextIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                    View Resume
                                </a>
                            </div>

                            {/* Notes */}
                            {selectedReview.notes && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Your Notes</p>
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedReview.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Feedback */}
                            {selectedReview.feedback && selectedReview.feedback.trim() && (
                                <div>
                                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
                                        Feedback from {selectedReview.reviewer_name || 'Reviewer'}
                                    </p>
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800 shadow-sm">
                                        <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed whitespace-pre-wrap">{selectedReview.feedback}</p>
                                    </div>
                                </div>
                            )}

                            {/* Member Info (for volunteers and above) */}
                            {isVolunteerOrAbove && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Member Information</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Name</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedReview.member_name}</p>
                                        </div>
                                        {selectedReview.member_email && (
                                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white break-all">{selectedReview.member_email}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeReviews;
