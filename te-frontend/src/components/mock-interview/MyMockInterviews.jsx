import { useState, useEffect, useCallback, Fragment, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    BuildingOfficeIcon,
    ChatBubbleLeftRightIcon,
    LinkIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
    FunnelIcon
} from '@heroicons/react/20/solid';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loading } from '../_custom/Loading';

const INTERVIEW_TYPE_COLORS = {
    system_design: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
    behavioral: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
    coding: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
};

const STATUS_COLORS = {
    pending: { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700' },
    confirmed: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700' },
    completed: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
    cancelled: { bg: 'bg-gray-50 dark:bg-gray-700/50', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-600' },
};

const formatInterviewType = (type) => {
    const names = {
        system_design: 'System Design',
        behavioral: 'Behavioral',
        coding: 'Coding'
    };
    return names[type] || type;
};

const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
};

const MyMockInterviews = ({ onFeedbackCount, onRequestNew }) => {
    const { accessToken } = useAuth();
    const toast = useToast();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [interviewToCancel, setInterviewToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchMyInterviews = useCallback(async () => {
        if (!accessToken) return;

        setLoading(true);
        try {
            const response = await axiosInstance.get('/interviews/my-requests', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            console.log('My Interviews API Response:', response.data);
            const interviewData = response.data.interviews || [];
            console.log('Interview Data:', interviewData);
            setInterviews(interviewData);

            // Count interviews with new feedback (completed with feedback)
            const feedbackCount = interviewData.filter(
                i => i.status === 'completed' && i.interviewer_feedback
            ).length;
            if (onFeedbackCount) onFeedbackCount(feedbackCount);
        } catch (error) {
            console.error('Error fetching interviews:', error);
            console.error('Error details:', error.response?.data);
            setInterviews([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken, onFeedbackCount]);

    useEffect(() => {
        fetchMyInterviews();
    }, [fetchMyInterviews]);

    const openCancelModal = (interview) => {
        setInterviewToCancel(interview);
        setShowCancelModal(true);
        setCancelReason('');
    };

    const closeCancelModal = () => {
        setShowCancelModal(false);
        setInterviewToCancel(null);
        setCancelReason('');
    };

    const handleCancel = async () => {
        if (!interviewToCancel) return;

        setCancellingId(interviewToCancel.id);
        try {
            await axiosInstance.post(`/interviews/${interviewToCancel.id}/cancel`, {
                cancellation_reason: cancelReason || 'Cancelled by user'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchMyInterviews();
            closeCancelModal();
        } catch (error) {
            console.error('Error cancelling interview:', error);
            toast.error(error.response?.data?.detail || 'Failed to cancel interview');
        } finally {
            setCancellingId(null);
        }
    };

    // Filter interviews by status
    const filteredInterviews = useMemo(() => {
        if (statusFilter === 'all') return interviews;
        return interviews.filter(interview => interview.status === statusFilter);
    }, [interviews, statusFilter]);

    // Get status counts
    const statusCounts = useMemo(() => {
        return {
            all: interviews.length,
            pending: interviews.filter(i => i.status === 'pending').length,
            confirmed: interviews.filter(i => i.status === 'confirmed').length,
            completed: interviews.filter(i => i.status === 'completed').length,
            cancelled: interviews.filter(i => i.status === 'cancelled').length,
        };
    }, [interviews]);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loading />
            </div>
        );
    }

    if (interviews.length === 0) {
        return (
            <div className="flex flex-col items-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <CalendarIcon className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No Mock Interviews</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    You haven&apos;t scheduled any mock interviews yet.
                </p>
                {onRequestNew && (
                    <button
                        onClick={onRequestNew}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Request Mock Interview
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${statusFilter === 'all'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    All
                    {statusCounts.all > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusFilter === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                            {statusCounts.all}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setStatusFilter('pending')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${statusFilter === 'pending'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    Pending
                    {statusCounts.pending > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusFilter === 'pending'
                                ? 'bg-amber-500 text-white'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            }`}>
                            {statusCounts.pending}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setStatusFilter('confirmed')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${statusFilter === 'confirmed'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    Confirmed
                    {statusCounts.confirmed > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusFilter === 'confirmed'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            }`}>
                            {statusCounts.confirmed}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setStatusFilter('completed')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${statusFilter === 'completed'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    Completed
                    {statusCounts.completed > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusFilter === 'completed'
                                ? 'bg-blue-500 text-white'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            }`}>
                            {statusCounts.completed}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setStatusFilter('cancelled')}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${statusFilter === 'cancelled'
                            ? 'bg-gray-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    Cancelled
                    {statusCounts.cancelled > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusFilter === 'cancelled'
                                ? 'bg-gray-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}>
                            {statusCounts.cancelled}
                        </span>
                    )}
                </button>
            </div>

            {/* Interviews Grid */}
            {filteredInterviews.length === 0 ? (
                <div className="flex flex-col items-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                        <FunnelIcon className="h-7 w-7 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No {statusFilter !== 'all' ? formatStatus(statusFilter) : ''} Interviews</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {statusFilter === 'all'
                            ? "You haven't scheduled any mock interviews yet."
                            : `No ${statusFilter} interviews found.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInterviews.map((interview) => {
                        const typeColors = INTERVIEW_TYPE_COLORS[interview.interview_type] || INTERVIEW_TYPE_COLORS.technical;
                        const statusColors = STATUS_COLORS[interview.status] || STATUS_COLORS.pending;

                        return (
                            <div
                                key={interview.id}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                            >
                                {/* Card Header */}
                                <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${statusColors.bg}`}>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors.bg} ${typeColors.text} border ${typeColors.border}`}>
                                            {formatInterviewType(interview.interview_type)}
                                        </span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors.text} bg-white dark:bg-gray-800 border ${statusColors.border}`}>
                                            {formatStatus(interview.status)}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-4 space-y-3">
                                    {/* Date & Time */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm">
                                            <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span className="font-semibold text-gray-900 dark:text-white">{interview.timeslot_date}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-600 dark:text-gray-400">{interview.timeslot_time}</span>
                                            <span className="text-xs text-gray-500">({interview.duration_minutes} min)</span>
                                        </div>
                                    </div>

                                    {/* Interviewer */}
                                    {interview.assigned_to_name ? (
                                        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                            <UserIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-600 dark:text-gray-400">Interviewer</div>
                                                <div className="font-semibold text-gray-900 dark:text-white truncate">{interview.assigned_to_name}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 italic px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                            Waiting for assignment
                                        </div>
                                    )}

                                    {/* Companies */}
                                    {interview.pending_companies && interview.pending_companies.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <BuildingOfficeIcon className="h-3.5 w-3.5 text-gray-400" />
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Pending Interviews</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {interview.pending_companies.slice(0, 2).map((company, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full truncate max-w-[120px]">
                                                        {company}
                                                    </span>
                                                ))}
                                                {interview.pending_companies.length > 2 && (
                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                                                        +{interview.pending_companies.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Feedback */}
                                    {interview.interviewer_feedback && (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Feedback</span>
                                            </div>
                                            <p className="text-xs text-emerald-900 dark:text-emerald-200 line-clamp-3">
                                                {interview.interviewer_feedback}
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                        {(interview.status === 'pending' || interview.status === 'confirmed') && (
                                            <button
                                                onClick={() => openCancelModal(interview)}
                                                disabled={cancellingId === interview.id}
                                                className="flex-1 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {cancellingId === interview.id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        )}
                                        {interview.meeting_link && interview.status === 'confirmed' && (
                                            <a
                                                href={interview.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <LinkIcon className="h-3.5 w-3.5" />
                                                Join Interview
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Cancellation Confirmation Modal */}
            <Transition appear show={showCancelModal} as={Fragment}>
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
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                    <div className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="flex-1">
                                                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                    Cancel Interview?
                                                </Dialog.Title>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                    Are you sure you want to cancel this {interviewToCancel && formatInterviewType(interviewToCancel.interview_type).toLowerCase()} interview scheduled for {interviewToCancel?.timeslot_date} at {interviewToCancel?.timeslot_time}?
                                                </p>
                                                {interviewToCancel?.status === 'confirmed' && interviewToCancel?.assigned_to_name && (
                                                    <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
                                                        This interview is confirmed with {interviewToCancel.assigned_to_name}. They will be notified of the cancellation.
                                                    </p>
                                                )}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Reason (optional)
                                                    </label>
                                                    <textarea
                                                        value={cancelReason}
                                                        onChange={(e) => setCancelReason(e.target.value)}
                                                        rows={3}
                                                        placeholder="Let us know why you're cancelling..."
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex gap-3 justify-end">
                                        <button
                                            onClick={closeCancelModal}
                                            disabled={cancellingId === interviewToCancel?.id}
                                            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            Keep Interview
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={cancellingId === interviewToCancel?.id}
                                            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {cancellingId === interviewToCancel?.id ? 'Cancelling...' : 'Yes, Cancel Interview'}
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

export default MyMockInterviews;
