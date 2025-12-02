import { useState, useEffect, useCallback } from 'react';
import {
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    BuildingOfficeIcon,
    ChatBubbleLeftRightIcon,
    LinkIcon
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
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const MyMockInterviews = ({ onFeedbackCount, onRequestNew }) => {
    const { accessToken } = useAuth();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const fetchMyInterviews = useCallback(async () => {
        if (!accessToken) return;

        setLoading(true);
        try {
            const response = await axiosInstance.get('/mock-interviews/my-requests', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const interviewData = response.data.interviews || [];
            setInterviews(interviewData);

            // Count interviews with new feedback (completed with feedback)
            const feedbackCount = interviewData.filter(
                i => i.status === 'completed' && i.interviewer_feedback
            ).length;
            if (onFeedbackCount) onFeedbackCount(feedbackCount);
        } catch (error) {
            console.error('Error fetching interviews:', error);
            setInterviews([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken, onFeedbackCount]);

    useEffect(() => {
        fetchMyInterviews();
    }, [fetchMyInterviews]);

    const handleCancel = async (interviewId) => {
        if (!window.confirm('Are you sure you want to cancel this interview?')) return;

        setCancellingId(interviewId);
        try {
            await axiosInstance.post(`/mock-interviews/${interviewId}/cancel`, {
                cancellation_reason: 'Cancelled by user'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchMyInterviews();
        } catch (error) {
            console.error('Error cancelling interview:', error);
            alert(error.response?.data?.detail || 'Failed to cancel interview');
        } finally {
            setCancellingId(null);
        }
    };

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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Request Mock Interview
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {interviews.map((interview) => {
                const typeColors = INTERVIEW_TYPE_COLORS[interview.interview_type] || INTERVIEW_TYPE_COLORS.technical;
                const statusColors = STATUS_COLORS[interview.status] || STATUS_COLORS.pending;
                const isExpanded = expandedId === interview.id;

                return (
                    <div
                        key={interview.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
                    >
                        {/* Main Card Content */}
                        <div
                            className="p-4 cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : interview.id)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Type and Status Badges */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${typeColors.bg} ${typeColors.text} ${typeColors.border} border`}>
                                            {formatInterviewType(interview.interview_type)}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusColors.bg} ${statusColors.text} ${statusColors.border} border`}>
                                            {formatStatus(interview.status)}
                                        </span>
                                    </div>

                                    {/* Date and Time */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                                            <span className="font-semibold text-gray-900 dark:text-white">{interview.timeslot_date}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <ClockIcon className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-300">{interview.timeslot_time}</span>
                                        </div>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            ({interview.duration_minutes} min)
                                        </span>
                                    </div>

                                    {/* Interviewer Info */}
                                    {interview.assigned_to_name && (
                                        <div className="flex items-center gap-1.5 mt-2 text-sm">
                                            <UserIcon className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600 dark:text-gray-300">Interviewer: </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">{interview.assigned_to_name}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {interview.status === 'pending' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCancel(interview.id);
                                            }}
                                            disabled={cancellingId === interview.id}
                                            className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {cancellingId === interview.id ? 'Cancelling...' : 'Cancel'}
                                        </button>
                                    )}
                                    {interview.meeting_link && interview.status === 'confirmed' && (
                                        <a
                                            href={interview.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                        >
                                            <LinkIcon className="h-3.5 w-3.5" />
                                            Join
                                        </a>
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
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Your Notes</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
                                            {interview.notes}
                                        </p>
                                    </div>
                                )}

                                {/* Interviewer Feedback */}
                                {interview.interviewer_feedback && (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Interviewer Feedback</span>
                                        </div>
                                        <p className="text-sm text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap">
                                            {interview.interviewer_feedback}
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
                                            className="flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:underline mt-1"
                                        >
                                            <LinkIcon className="h-4 w-4" />
                                            {interview.meeting_link}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default MyMockInterviews;
