import { useState, useEffect, useCallback } from 'react';
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    LinkIcon
} from 'icons';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loading } from '../_custom/Loading';

const INTERVIEW_TYPE_COLORS = {
    system_design: { bg: 'bg-[var(--te-surface-alt)]', text: 'text-[var(--te-text)]', border: 'border-[var(--te-border)]' },
    behavioral: { bg: 'bg-[var(--te-gold-soft)]', text: 'text-te-gold', border: 'border-[var(--te-gold)]' },
    coding: { bg: 'bg-[var(--te-green-soft)]', text: 'text-te-green', border: 'border-[var(--te-green)]' },
    one_on_one: { bg: 'bg-[var(--te-green-soft)]', text: 'text-te-green', border: 'border-[var(--te-green)]' },
};

const STATUS_COLORS = {
    pending: { bg: 'bg-[var(--te-gold-soft)]', text: 'text-te-gold', border: 'border-[var(--te-gold)]' },
    scheduled: { bg: 'bg-[var(--te-gold-soft)]', text: 'text-te-gold', border: 'border-[var(--te-gold)]' },
    upcoming: { bg: 'bg-[var(--te-gold-soft)]', text: 'text-te-gold', border: 'border-[var(--te-gold)]' },
    confirmed: { bg: 'bg-[var(--te-green-soft)]', text: 'text-te-green', border: 'border-[var(--te-green)]' },
    completed: { bg: 'bg-[var(--te-green-soft)]', text: 'text-te-green', border: 'border-[var(--te-green)]' },
    cancelled: { bg: 'bg-[var(--te-red-soft)]', text: 'text-te-red', border: 'border-[var(--te-red)]' },
    missed: { bg: 'bg-[var(--te-red-soft)]', text: 'text-te-red', border: 'border-[var(--te-red)]' },
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
        hour12: true,
        timeZoneName: 'short'
    });
};

// Helper function to format date with day of week
const formatDateWithDay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// Helper to get week label for grouping
const getWeekLabel = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr + 'T12:00:00');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const interviewDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = interviewDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return 'This Week';
    if (diffDays > 7 && diffDays <= 14) return 'Next Week';

    // Get month name for future dates
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return monthYear;
};

const MyAssignedInterviews = () => {
    const { accessToken } = useAuth();
    const toast = useToast();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completeModal, setCompleteModal] = useState({ open: false, interview: null, feedback: '' });
    const [editNotesModal, setEditNotesModal] = useState({ open: false, interview: null, notes: '' });
    const [submitting, setSubmitting] = useState(false);
    const [sortBy, setSortBy] = useState('date'); // 'date' or 'type'
    const [groupBy, setGroupBy] = useState('week'); // 'week' or 'month' or 'none'

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
            toast.success('Interview marked as completed');
        } catch (error) {
            console.error('Error completing interview:', error);
            toast.error(error.response?.data?.detail || 'Failed to complete interview');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateNotes = async () => {
        if (!editNotesModal.notes.trim()) {
            toast.warning('Please provide meeting notes or link');
            return;
        }

        setSubmitting(true);
        try {
            await axiosInstance.patch(`/interviews/${editNotesModal.interview.id}/notes`, {
                meeting_notes: editNotesModal.notes
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setEditNotesModal({ open: false, interview: null, notes: '' });
            fetchAssignedInterviews();
            toast.success('Meeting notes updated and member notified');
        } catch (error) {
            console.error('Error updating notes:', error);
            toast.error(error.response?.data?.detail || 'Failed to update notes');
        } finally {
            setSubmitting(false);
        }
    };

    // Separate upcoming (pending/confirmed) and past (completed/cancelled)
    let upcomingInterviews = interviews.filter(i => i.status === 'pending' || i.status === 'confirmed');
    let pastInterviews = interviews.filter(i => i.status === 'completed' || i.status === 'cancelled');

    // Sort interviews
    const sortInterviews = (interviewsList) => {
        return [...interviewsList].sort((a, b) => {
            if (sortBy === 'date') {
                const dateA = new Date(a.timeslot_date + 'T' + a.timeslot_time);
                const dateB = new Date(b.timeslot_date + 'T' + b.timeslot_time);
                return dateA - dateB;
            } else if (sortBy === 'type') {
                return a.interview_type.localeCompare(b.interview_type);
            }
            return 0;
        });
    };

    upcomingInterviews = sortInterviews(upcomingInterviews);
    pastInterviews = sortInterviews(pastInterviews);

    // Group interviews by week/month
    const groupInterviews = (interviewsList) => {
        if (groupBy === 'none') return { 'All': interviewsList };

        const grouped = {};
        interviewsList.forEach(interview => {
            const label = groupBy === 'week' ? getWeekLabel(interview.timeslot_date) :
                new Date(interview.timeslot_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!grouped[label]) grouped[label] = [];
            grouped[label].push(interview);
        });
        return grouped;
    };

    const groupedUpcoming = groupInterviews(upcomingInterviews);
    const groupedPast = groupInterviews(pastInterviews);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loading />
            </div>
        );
    }

    if (interviews.length === 0) {
        return (
            <div className="te-card flex flex-col items-center py-14">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                    <CalendarIcon className="h-6 w-6 text-[var(--te-text-dim)]" />
                </div>
                <h3 className="font-mono text-lg font-bold text-[var(--te-text)] mb-2">No assigned interviews</h3>
                <p className="text-sm text-[var(--te-text-dim)]">
                    You don&apos;t have any interviews assigned to you yet.
                </p>
            </div>
        );
    }

    const renderInterviewCard = (interview) => {
        const typeColors = INTERVIEW_TYPE_COLORS[interview.interview_type] || INTERVIEW_TYPE_COLORS.coding;
        const statusColors = STATUS_COLORS[interview.status] || STATUS_COLORS.pending;

        return (
            <div
                key={interview.id}
                className="te-card-interactive grid gap-4 p-4 md:grid-cols-[180px_1fr_auto]"
            >
                <div className="font-mono">
                    <div className="text-sm font-semibold text-[var(--te-text)]">{formatDateWithDay(interview.timeslot_date)}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-te-green">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {formatTime(interview.timeslot_time)}
                    </div>
                    <div className="mt-1 text-xs text-[var(--te-text-dim)]">{interview.duration_minutes} min</div>
                </div>

                <div className="min-w-0 space-y-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                            <span className="font-semibold text-[var(--te-text)] truncate">{interview.user_name}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className={`te-chip border ${typeColors.border} ${typeColors.bg} ${typeColors.text}`}>
                            {formatInterviewType(interview.interview_type)}
                            </span>
                            <span className={`te-chip border ${statusColors.border} ${statusColors.bg} ${statusColors.text}`}>
                            {formatStatus(interview.status)}
                            </span>
                        </div>
                    </div>

                    {/* Companies */}
                    {interview.pending_companies && interview.pending_companies.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <BuildingOfficeIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />
                                <span className="text-xs font-semibold text-[var(--te-text-dim)]">Companies</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {interview.pending_companies.slice(0, 2).map((company, idx) => (
                                    <span key={idx} className="te-chip max-w-[160px] truncate">
                                        {company}
                                    </span>
                                ))}
                                {interview.pending_companies.length > 2 && (
                                    <span className="te-chip text-[var(--te-text-dim)]">
                                        +{interview.pending_companies.length - 2}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes Preview */}
                    {interview.notes && (
                        <div className="te-panel line-clamp-2 p-3 text-xs text-[var(--te-text-dim)]">
                            {interview.notes}
                        </div>
                    )}

                    {/* Feedback Given */}
                    {interview.interviewer_feedback && (
                        <div className="te-panel p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-[var(--te-text)]" />
                                <span className="text-xs font-semibold text-[var(--te-text)]">Your Feedback</span>
                            </div>
                            <p className="text-xs text-[var(--te-text)] line-clamp-3">
                                {interview.interviewer_feedback}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                </div>

                <div className="flex items-start gap-2 md:justify-end">
                    {interview.meeting_notes && interview.meeting_notes.startsWith('http') && interview.status === 'confirmed' && (
                        <a
                            href={interview.meeting_notes}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="te-btn-primary te-btn-sm"
                        >
                            <LinkIcon className="h-3.5 w-3.5" />
                            Join
                        </a>
                    )}
                    {interview.status === 'confirmed' && (
                        <>
                            <button
                                onClick={() => setEditNotesModal({ open: true, interview, notes: interview.meeting_notes || '' })}
                                className="te-btn-secondary te-btn-sm"
                            >
                                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5" />
                                Notes
                            </button>
                            <button
                                onClick={() => setCompleteModal({ open: true, interview, feedback: '' })}
                                className="te-btn-primary te-btn-sm"
                            >
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Complete
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            {interviews.length > 0 && (
                <div className="te-card flex flex-wrap gap-3 items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--te-text)]">Sort by:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="te-select py-1.5 text-sm"
                        >
                            <option value="date">Date</option>
                            <option value="type">Type</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--te-text)]">Group by:</span>
                        <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="te-select py-1.5 text-sm"
                        >
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                            <option value="none">None</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Upcoming Interviews */}
            {upcomingInterviews.length > 0 && (
                <div className="space-y-6">
                    <h4 className="te-eyebrow">{'// upcoming'}</h4>
                    {Object.entries(groupedUpcoming).map(([label, groupInterviews]) => (
                        <div key={label}>
                            {groupBy !== 'none' && (
                                <h5 className="text-xs font-bold text-[var(--te-text-dim)] uppercase mb-3 flex items-center gap-2">
                                    <span className="flex-shrink-0">{label}</span>
                                    <span className="flex-1 h-px bg-[var(--te-hover)]"></span>
                                    <span className="text-xs font-normal text-[var(--te-text-dim)]">{groupInterviews.length}</span>
                                </h5>
                            )}
                            <div className="grid grid-cols-1 gap-3">
                                {groupInterviews.map(renderInterviewCard)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Past Interviews */}
            {pastInterviews.length > 0 && (
                <div className="space-y-6">
                    <h4 className="te-eyebrow">{'// past'}</h4>
                    {Object.entries(groupedPast).map(([label, groupInterviews]) => (
                        <div key={label}>
                            {groupBy !== 'none' && (
                                <h5 className="text-xs font-bold text-[var(--te-text-dim)] uppercase mb-3 flex items-center gap-2">
                                    <span className="flex-shrink-0">{label}</span>
                                    <span className="flex-1 h-px bg-[var(--te-hover)]"></span>
                                    <span className="text-xs font-normal text-[var(--te-text-dim)]">{groupInterviews.length}</span>
                                </h5>
                            )}
                            <div className="grid grid-cols-1 gap-3">
                                {groupInterviews.map(renderInterviewCard)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Complete Modal */}
            {completeModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="te-card max-w-md w-full p-6">
                        <h3 className="font-mono text-lg font-bold text-[var(--te-text)] mb-4">Complete Interview</h3>
                        <p className="text-sm text-[var(--te-text-dim)] mb-4">
                            Mark this interview with <strong>{completeModal.interview?.user_name}</strong> as completed and provide feedback.
                        </p>
                        <textarea
                            value={completeModal.feedback}
                            onChange={(e) => setCompleteModal(prev => ({ ...prev, feedback: e.target.value }))}
                            placeholder="Enter feedback for the member..."
                            rows={5}
                            className="te-textarea mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCompleteModal({ open: false, interview: null, feedback: '' })}
                                className="te-btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={submitting}
                                className="te-btn-primary flex-1 disabled:opacity-50"
                            >
                                {submitting ? 'Completing...' : 'Mark Complete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Notes Modal */}
            {editNotesModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="te-card max-w-md w-full p-6">
                        <h3 className="font-mono text-lg font-bold text-[var(--te-text)] mb-4">Update Meeting Notes</h3>
                        <p className="text-sm text-[var(--te-text-dim)] mb-4">
                            Update the meeting details for <strong>{editNotesModal.interview?.user_name}</strong>. The member will be notified via email.
                        </p>
                        <textarea
                            value={editNotesModal.notes}
                            onChange={(e) => setEditNotesModal(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Enter meeting link or details..."
                            rows={4}
                            className="te-textarea mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setEditNotesModal({ open: false, interview: null, notes: '' })}
                                className="te-btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateNotes}
                                disabled={submitting}
                                className="te-btn-primary flex-1 disabled:opacity-50"
                            >
                                {submitting ? 'Updating...' : 'Update Notes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyAssignedInterviews;
