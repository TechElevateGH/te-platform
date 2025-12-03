import { useState, useEffect, useCallback } from 'react';
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    LinkIcon
} from '@heroicons/react/20/solid';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loading } from '../_custom/Loading';

const INTERVIEW_TYPE_COLORS = {
    system_design: { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-700' },
    behavioral: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-700' },
    coding: { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-700' },
    one_on_one: { bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700' },
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
        coding: 'Coding',
        one_on_one: '1-on-1 Mentorship'
    };
    return names[type] || type;
};

const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
};

// Helper function to format UTC time to local timezone
const formatTime = (timeStr) => {
    if (!timeStr) return '';
    // Parse the combined time string (e.g., "14:00 - 15:00")
    // Extract just the first time for display
    const firstTime = timeStr.includes(' - ') ? timeStr.split(' - ')[0] : timeStr;
    const [hours, minutes] = firstTime.split(':').map(Number);
    const today = new Date().toISOString().split('T')[0];
    // Parse as UTC and convert to local
    const utcDate = new Date(`${today}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);

    return utcDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const MyAssignedInterviews = () => {
    const { accessToken } = useAuth();
    const toast = useToast();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completeModal, setCompleteModal] = useState({ open: false, interview: null, feedback: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchAssignedInterviews = useCallback(async () => {
        if (!accessToken) return;

        setLoading(true);
        try {
            const response = await axiosInstance.get('/interviews/assigned', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setInterviews(response.data.interviews || []);
        } catch (error) {
            console.error('Error fetching assigned interviews:', error);
            setInterviews([]);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchAssignedInterviews();
    }, [fetchAssignedInterviews]);

    const handleComplete = async () => {
        if (!completeModal.feedback.trim()) {
            toast.warning('Please provide feedback for the member');
            return;
        }

        setSubmitting(true);
        try {
            await axiosInstance.post(`/interviews/${completeModal.interview.id}/complete`, {
                interviewer_feedback: completeModal.feedback
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setCompleteModal({ open: false, interview: null, feedback: '' });
            fetchAssignedInterviews();
        } catch (error) {
            console.error('Error completing interview:', error);
            toast.error(error.response?.data?.detail || 'Failed to complete interview');
        } finally {
            setSubmitting(false);
        }
    };

    // Separate upcoming (pending/confirmed) and past (completed/cancelled)
    const upcomingInterviews = interviews.filter(i => i.status === 'pending' || i.status === 'confirmed');
    const pastInterviews = interviews.filter(i => i.status === 'completed' || i.status === 'cancelled');

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loading />
            </div>
        );
    }

    if (interviews.length === 0) {
        return (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Assigned Interviews</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    You don&apos;t have any interviews assigned to you yet.
                </p>
            </div>
        );
    }

    const renderInterviewCard = (interview) => {
        const typeColors = INTERVIEW_TYPE_COLORS[interview.interview_type] || INTERVIEW_TYPE_COLORS.technical;
        const statusColors = STATUS_COLORS[interview.status] || STATUS_COLORS.pending;

        return (
            <div
                key={interview.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all"
            >
                {/* Card Header */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="font-bold text-gray-900 dark:text-white truncate">{interview.user_name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors.bg} ${typeColors.text}`}>
                            {formatInterviewType(interview.interview_type)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text}`}>
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
                            <span className="text-gray-600 dark:text-gray-400">{formatTime(interview.timeslot_time)}</span>
                            <span className="text-xs text-gray-500">({interview.duration_minutes} min)</span>
                        </div>
                    </div>

                    {/* Companies */}
                    {interview.pending_companies && interview.pending_companies.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <BuildingOfficeIcon className="h-3.5 w-3.5 text-gray-400" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Companies</span>
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

                    {/* Notes Preview */}
                    {interview.notes && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg">
                            {interview.notes}
                        </div>
                    )}

                    {/* Feedback Given */}
                    {interview.interviewer_feedback && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Your Feedback</span>
                            </div>
                            <p className="text-xs text-blue-900 dark:text-blue-200 line-clamp-3">
                                {interview.interviewer_feedback}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        {interview.meeting_notes && interview.meeting_notes.startsWith('http') && interview.status === 'confirmed' && (
                            <a
                                href={interview.meeting_notes}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <LinkIcon className="h-3.5 w-3.5" />
                                Join Interview
                            </a>
                        )}
                        {interview.status === 'confirmed' && (
                            <button
                                onClick={() => setCompleteModal({ open: true, interview, feedback: '' })}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Complete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Upcoming Interviews */}
            {upcomingInterviews.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Upcoming</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingInterviews.map(renderInterviewCard)}
                    </div>
                </div>
            )}

            {/* Past Interviews */}
            {pastInterviews.length > 0 && (
                <div>
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Past</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pastInterviews.map(renderInterviewCard)}
                    </div>
                </div>
            )}

            {/* Complete Modal */}
            {completeModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Complete Interview</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Mark this interview with <strong>{completeModal.interview?.user_name}</strong> as completed and provide feedback.
                        </p>
                        <textarea
                            value={completeModal.feedback}
                            onChange={(e) => setCompleteModal(prev => ({ ...prev, feedback: e.target.value }))}
                            placeholder="Enter feedback for the member..."
                            rows={5}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none mb-4"
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

export default MyAssignedInterviews;
