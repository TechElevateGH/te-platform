import { useState, useEffect, useCallback } from 'react';
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserPlusIcon,
    PaperAirplaneIcon,
    ChatBubbleLeftRightIcon,
    FunnelIcon
} from '@heroicons/react/20/solid';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
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

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const MockInterviewManagement = () => {
    const { accessToken } = useAuth();
    const [interviews, setInterviews] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    // Action modals
    const [assignModal, setAssignModal] = useState({ open: false, interview: null });
    const [confirmModal, setConfirmModal] = useState({ open: false, interview: null, meetingLink: '' });
    const [completeModal, setCompleteModal] = useState({ open: false, interview: null, feedback: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchInterviews = useCallback(async () => {
        if (!accessToken) return;

        setLoading(true);
        try {
            const response = await axiosInstance.get('/mock-interviews/all', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setInterviews(response.data.interviews || []);
        } catch (error) {
            console.error('Error fetching interviews:', error);
            setInterviews([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    const fetchVolunteers = useCallback(async () => {
        if (!accessToken) return;

        try {
            const response = await axiosInstance.get('/mock-interviews/volunteers/list', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setVolunteers(response.data.volunteers || []);
        } catch (error) {
            console.error('Error fetching volunteers:', error);
            setVolunteers([]);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchInterviews();
        fetchVolunteers();
    }, [fetchInterviews, fetchVolunteers]);

    const handleAssign = async (interviewId, assignedToId) => {
        setSubmitting(true);
        try {
            await axiosInstance.post(`/mock-interviews/${interviewId}/assign`, {
                assigned_to: assignedToId
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setAssignModal({ open: false, interview: null });
            fetchInterviews();
        } catch (error) {
            console.error('Error assigning interviewer:', error);
            alert(error.response?.data?.detail || 'Failed to assign interviewer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirmModal.meetingLink.trim()) {
            alert('Please provide a meeting link');
            return;
        }

        setSubmitting(true);
        try {
            await axiosInstance.post(`/mock-interviews/${confirmModal.interview.id}/confirm`, {
                meeting_link: confirmModal.meetingLink
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setConfirmModal({ open: false, interview: null, meetingLink: '' });
            fetchInterviews();
        } catch (error) {
            console.error('Error confirming interview:', error);
            alert(error.response?.data?.detail || 'Failed to confirm interview');
        } finally {
            setSubmitting(false);
        }
    };

    const handleComplete = async () => {
        if (!completeModal.feedback.trim()) {
            alert('Please provide feedback for the member');
            return;
        }

        setSubmitting(true);
        try {
            await axiosInstance.post(`/mock-interviews/${completeModal.interview.id}/complete`, {
                interviewer_feedback: completeModal.feedback
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCompleteModal({ open: false, interview: null, feedback: '' });
            fetchInterviews();
        } catch (error) {
            console.error('Error completing interview:', error);
            alert(error.response?.data?.detail || 'Failed to complete interview');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (interviewId) => {
        const reason = window.prompt('Please provide a cancellation reason:');
        if (reason === null) return;

        try {
            await axiosInstance.post(`/mock-interviews/${interviewId}/cancel`, {
                cancellation_reason: reason || 'Cancelled by admin'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchInterviews();
        } catch (error) {
            console.error('Error cancelling interview:', error);
            alert(error.response?.data?.detail || 'Failed to cancel interview');
        }
    };

    const filteredInterviews = interviews.filter(i =>
        statusFilter === 'all' || i.status === statusFilter
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loading />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Filter */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Interview Requests</h3>
                <div className="flex items-center gap-2">
                    <FunnelIcon className="h-4 w-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:border-purple-500"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Interviews List */}
            {filteredInterviews.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Interview Requests</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {statusFilter === 'all' ? 'No mock interview requests yet.' : `No ${statusFilter} interviews.`}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredInterviews.map((interview) => {
                        const typeColors = INTERVIEW_TYPE_COLORS[interview.interview_type] || INTERVIEW_TYPE_COLORS.technical;
                        const statusColors = STATUS_COLORS[interview.status] || STATUS_COLORS.pending;
                        const isExpanded = expandedId === interview.id;

                        return (
                            <div
                                key={interview.id}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                            >
                                {/* Main Card */}
                                <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : interview.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Requester Name */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <UserIcon className="h-4 w-4 text-gray-400" />
                                                <span className="font-bold text-gray-900 dark:text-white">{interview.user_name}</span>
                                            </div>

                                            {/* Type and Status Badges */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${typeColors.bg} ${typeColors.text} ${typeColors.border} border`}>
                                                    {formatInterviewType(interview.interview_type)}
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusColors.bg} ${statusColors.text} ${statusColors.border} border`}>
                                                    {formatStatus(interview.status)}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    ({interview.duration_minutes} min)
                                                </span>
                                            </div>

                                            {/* Date and Time */}
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-700 dark:text-gray-300">{interview.timeslot_date}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <ClockIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-gray-600 dark:text-gray-400">{interview.timeslot_time}</span>
                                                </div>
                                            </div>

                                            {/* Assigned To */}
                                            {interview.assigned_to_name && (
                                                <div className="flex items-center gap-1.5 mt-2 text-sm">
                                                    <UserPlusIcon className="h-4 w-4 text-purple-500" />
                                                    <span className="text-gray-600 dark:text-gray-300">Assigned to: </span>
                                                    <span className="font-semibold text-gray-900 dark:text-white">{interview.assigned_to_name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-2">
                                            {interview.status === 'pending' && !interview.assigned_to && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAssignModal({ open: true, interview });
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                                >
                                                    <UserPlusIcon className="h-3.5 w-3.5" />
                                                    Assign
                                                </button>
                                            )}
                                            {interview.status === 'pending' && interview.assigned_to && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmModal({ open: true, interview, meetingLink: '' });
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                                                >
                                                    <PaperAirplaneIcon className="h-3.5 w-3.5" />
                                                    Confirm
                                                </button>
                                            )}
                                            {interview.status === 'confirmed' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCompleteModal({ open: true, interview, feedback: '' });
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                >
                                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                                    Complete
                                                </button>
                                            )}
                                            {(interview.status === 'pending' || interview.status === 'confirmed') && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCancel(interview.id);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                >
                                                    <XCircleIcon className="h-3.5 w-3.5" />
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-4">
                                        {/* Pending Companies */}
                                        {interview.pending_companies && interview.pending_companies.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Pending Interviews With</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {interview.pending_companies.map((company, idx) => (
                                                        <span key={idx} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full">
                                                            {company}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Earliest Interview Date */}
                                        {interview.earliest_interview_date && (
                                            <div>
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Earliest Real Interview</span>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                    {formatDate(interview.earliest_interview_date)}
                                                </p>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {interview.notes && (
                                            <div>
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">User Notes</span>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                                    {interview.notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Meeting Link */}
                                        {interview.meeting_link && (
                                            <div>
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Meeting Link</span>
                                                <a
                                                    href={interview.meeting_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-sm text-purple-600 dark:text-purple-400 hover:underline mt-1"
                                                >
                                                    {interview.meeting_link}
                                                </a>
                                            </div>
                                        )}

                                        {/* Feedback */}
                                        {interview.interviewer_feedback && (
                                            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Feedback Given</span>
                                                </div>
                                                <p className="text-sm text-blue-900 dark:text-blue-200 whitespace-pre-wrap">
                                                    {interview.interviewer_feedback}
                                                </p>
                                            </div>
                                        )}

                                        {/* Cancellation Reason */}
                                        {interview.cancellation_reason && (
                                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4">
                                                <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase">Cancellation Reason</span>
                                                <p className="text-sm text-red-900 dark:text-red-200 mt-1">
                                                    {interview.cancellation_reason}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Assign Modal */}
            {assignModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Assign Interviewer</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Select a volunteer or lead to conduct this {formatInterviewType(assignModal.interview?.interview_type)} interview.
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {volunteers.map((volunteer) => (
                                <button
                                    key={volunteer.id}
                                    onClick={() => handleAssign(assignModal.interview.id, volunteer.id)}
                                    disabled={submitting}
                                    className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600 transition-colors disabled:opacity-50"
                                >
                                    <span className="font-semibold text-gray-900 dark:text-white">{volunteer.name}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({volunteer.email})</span>
                                </button>
                            ))}
                            {volunteers.length === 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No volunteers available</p>
                            )}
                        </div>
                        <button
                            onClick={() => setAssignModal({ open: false, interview: null })}
                            className="w-full mt-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirm Interview</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Provide the meeting link to confirm this interview and notify the member.
                        </p>
                        <input
                            type="url"
                            value={confirmModal.meetingLink}
                            onChange={(e) => setConfirmModal(prev => ({ ...prev, meetingLink: e.target.value }))}
                            placeholder="https://meet.google.com/..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ open: false, interview: null, meetingLink: '' })}
                                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={submitting}
                                className="flex-1 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Confirming...' : 'Confirm & Notify'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Modal */}
            {completeModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Complete Interview</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Mark this interview as completed and optionally provide feedback for the member.
                        </p>
                        <textarea
                            value={completeModal.feedback}
                            onChange={(e) => setCompleteModal(prev => ({ ...prev, feedback: e.target.value }))}
                            placeholder="Enter feedback for the member (optional)..."
                            rows={4}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCompleteModal({ open: false, interview: null, feedback: '' })}
                                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={submitting}
                                className="flex-1 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Completing...' : 'Mark Complete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MockInterviewManagement;
