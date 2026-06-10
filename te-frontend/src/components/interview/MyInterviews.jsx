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
    FunnelIcon,
    EyeIcon
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

const MyInterviews = ({ onFeedbackCount, onRequestNew, interviewType = 'all' }) => {
    const { accessToken } = useAuth();
    const toast = useToast();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [interviewToCancel, setInterviewToCancel] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState(null);

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

    const openNotesModal = async (interview) => {
        setSelectedInterview(interview);
        setShowNotesModal(true);

        // Mark notes as viewed when opening the modal
        if (interview.meeting_notes && hasUnviewedNotes(interview)) {
            try {
                await axiosInstance.post(
                    `/interviews/${interview.id}/mark-notes-viewed`,
                    {},
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                // Refresh the interviews list to update the viewed status
                fetchMyInterviews();
            } catch (error) {
                console.error('Error marking notes as viewed:', error);
            }
        }
    };

    const closeNotesModal = () => {
        setShowNotesModal(false);
        setSelectedInterview(null);
    };

    // Helper function to check if notes have been updated but not viewed
    const hasUnviewedNotes = (interview) => {
        if (!interview.meeting_notes || !interview.notes_updated_at) return false;
        if (!interview.notes_viewed_at) return true;

        const updatedAt = new Date(interview.notes_updated_at);
        const viewedAt = new Date(interview.notes_viewed_at);
        return updatedAt > viewedAt;
    };

    // Filter interviews by interview type first
    const typeFilteredInterviews = useMemo(() => {
        let filtered = interviews;

        // Filter by interview type (mock interviews or one-on-one)
        if (interviewType === 'mock') {
            filtered = filtered.filter(i => i.interview_type !== 'one_on_one');
        } else if (interviewType === 'one_on_one') {
            filtered = filtered.filter(i => i.interview_type === 'one_on_one');
        }

        return filtered;
    }, [interviews, interviewType]);

    // Get status counts based on type-filtered interviews
    const statusCounts = useMemo(() => {
        return {
            all: typeFilteredInterviews.length,
            pending: typeFilteredInterviews.filter(i => i.status === 'pending').length,
            confirmed: typeFilteredInterviews.filter(i => i.status === 'confirmed').length,
            completed: typeFilteredInterviews.filter(i => i.status === 'completed').length,
            cancelled: typeFilteredInterviews.filter(i => i.status === 'cancelled').length,
        };
    }, [typeFilteredInterviews]);

    // Filter by status
    const filteredInterviews = useMemo(() => {
        if (statusFilter === 'all') return typeFilteredInterviews;
        return typeFilteredInterviews.filter(interview => interview.status === statusFilter);
    }, [typeFilteredInterviews, statusFilter]);

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
                    <CalendarIcon className="h-7 w-7 text-[var(--te-text-dim)]" />
                </div>
                <h3 className="font-mono text-base font-semibold text-[var(--te-text)] mb-1">
                    {interviewType === 'one_on_one' ? 'No 1-on-1 Sessions' : 'No Mock Interviews'}
                </h3>
                <p className="text-sm text-[var(--te-text-dim)] mb-4">
                    {interviewType === 'one_on_one'
                        ? "You haven't scheduled any 1-on-1 sessions yet."
                        : "You haven't scheduled any mock interviews yet."
                    }
                </p>
                {onRequestNew && (
                    <button
                        onClick={onRequestNew}
                        className="te-btn-primary te-btn-sm"
                    >
                        {interviewType === 'one_on_one' ? 'Request 1-on-1 Session' : 'Request Mock Interview'}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto pb-1 te-scroll">
                <div className="inline-flex rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-1 font-mono text-sm">
                    {[
                        ['all', 'All'],
                        ['pending', 'Pending'],
                        ['confirmed', 'Confirmed'],
                        ['completed', 'Completed'],
                        ['cancelled', 'Cancelled'],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 whitespace-nowrap transition-colors ${statusFilter === key
                                ? 'bg-[var(--te-green-soft)] text-te-green shadow-sm'
                                : 'text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] hover:text-[var(--te-text)]'
                                }`}
                        >
                            {label}
                            {statusCounts[key] > 0 && (
                                <span className="text-[11px] text-[var(--te-text-dim)]">{statusCounts[key]}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Interviews Grid */}
            {filteredInterviews.length === 0 ? (
                <div className="te-card flex flex-col items-center py-14">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                        <FunnelIcon className="h-7 w-7 text-[var(--te-text-dim)]" />
                    </div>
                    <h3 className="font-mono text-base font-semibold text-[var(--te-text)] mb-1">No {statusFilter !== 'all' ? formatStatus(statusFilter) : ''} Interviews</h3>
                    <p className="text-sm text-[var(--te-text-dim)]">
                        {statusFilter === 'all'
                            ? "You haven't scheduled any mock interviews yet."
                            : `No ${statusFilter} interviews found.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {filteredInterviews.map((interview) => {
                        const typeColors = INTERVIEW_TYPE_COLORS[interview.interview_type] || INTERVIEW_TYPE_COLORS.coding;
                        const statusColors = STATUS_COLORS[interview.status] || STATUS_COLORS.pending;

                        return (
                            <div
                                key={interview.id}
                                className="te-card-interactive grid gap-4 p-4 md:grid-cols-[180px_1fr_auto]"
                            >
                                <div className="font-mono">
                                    <div className="text-sm font-semibold text-[var(--te-text)]">
                                        {formatDateWithDay(interview.timeslot_date)}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-te-green">
                                        <ClockIcon className="h-3.5 w-3.5" />
                                        {formatTime(interview.timeslot_time)}
                                    </div>
                                    <div className="mt-1 text-xs text-[var(--te-text-dim)]">
                                        {interview.duration_minutes} min
                                    </div>
                                </div>

                                <div className="min-w-0 space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`te-chip border ${typeColors.border} ${typeColors.bg} ${typeColors.text}`}>
                                            {formatInterviewType(interview.interview_type)}
                                        </span>
                                        <span className={`te-chip border ${statusColors.border} ${statusColors.bg} ${statusColors.text}`}>
                                            {formatStatus(interview.status)}
                                        </span>
                                    </div>

                                    {interview.assigned_to_name ? (
                                        <div className="flex items-center gap-2 text-sm">
                                            <UserIcon className="h-4 w-4 text-[var(--te-text-dim)] flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-[var(--te-text-dim)]">Interviewer</div>
                                                <div className="font-semibold text-[var(--te-text)] truncate">{interview.assigned_to_name}</div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="font-mono text-xs text-[var(--te-text-dim)]">
                                            Waiting for assignment
                                        </div>
                                    )}

                                    {interview.pending_companies && interview.pending_companies.length > 0 && (
                                        <div>
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <BuildingOfficeIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />
                                                <span className="text-xs font-semibold text-[var(--te-text-dim)]">Pending Interviews</span>
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

                                    {interview.interviewer_feedback && (
                                        <div className="te-panel p-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-[var(--te-text)]" />
                                                <span className="text-xs font-semibold text-[var(--te-text)]">Feedback</span>
                                            </div>
                                            <p className="text-xs text-[var(--te-text)] line-clamp-3">
                                                {interview.interviewer_feedback}
                                            </p>
                                        </div>
                                    )}

                                    {interview.meeting_notes && interview.status === 'confirmed' && (
                                        <div className="te-panel p-3">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <LinkIcon className="h-3.5 w-3.5 text-[var(--te-text)]" />
                                                <span className="text-xs font-semibold text-[var(--te-text)]">Meeting Notes</span>
                                                {hasUnviewedNotes(interview) && (
                                                    <span className="relative flex h-2 w-2 ml-1">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-md bg-[var(--te-text-dim)] opacity-75"></span>
                                                        <span className="relative inline-flex rounded-md h-2 w-2 bg-[var(--te-text)]"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[var(--te-text)] break-all line-clamp-2">
                                                {interview.meeting_notes}
                                            </p>
                                        </div>
                                    )}

                                </div>

                                <div className="flex items-start gap-2 md:justify-end">
                                    {(interview.status === 'pending' || interview.status === 'confirmed') && (
                                        <button
                                            onClick={() => openCancelModal(interview)}
                                            disabled={cancellingId === interview.id}
                                            className="te-btn-danger te-btn-sm disabled:opacity-50"
                                        >
                                            {cancellingId === interview.id ? 'Cancelling...' : 'Cancel'}
                                        </button>
                                    )}
                                    {interview.meeting_notes && interview.status === 'confirmed' && (
                                        <>
                                            <button
                                                onClick={() => openNotesModal(interview)}
                                                className="te-btn-secondary te-btn-sm relative"
                                            >
                                                <EyeIcon className="h-3.5 w-3.5" />
                                                Notes
                                            </button>
                                            {interview.meeting_notes.startsWith('http') && (
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
                                        </>
                                    )}
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
                        <div className="fixed inset-0 bg-black/50 " />
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
                                <Dialog.Panel className="te-card w-full max-w-md transform overflow-hidden transition-all">
                                    <div className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-md border border-[var(--te-red)] bg-[var(--te-red-soft)] flex items-center justify-center">
                                                <ExclamationTriangleIcon className="h-6 w-6 text-te-red" />
                                            </div>
                                            <div className="flex-1">
                                                <Dialog.Title className="font-mono text-lg font-semibold text-[var(--te-text)] mb-2">
                                                    Cancel Interview?
                                                </Dialog.Title>
                                                <p className="text-sm text-[var(--te-text-dim)] mb-4">
                                                    Are you sure you want to cancel this {interviewToCancel && formatInterviewType(interviewToCancel.interview_type).toLowerCase()} interview scheduled for {interviewToCancel && formatDateWithDay(interviewToCancel.timeslot_date)} at {formatTime(interviewToCancel?.timeslot_time)}?
                                                </p>
                                                {interviewToCancel?.status === 'confirmed' && interviewToCancel?.assigned_to_name && (
                                                    <p className="text-sm text-te-gold bg-[var(--te-gold-soft)] border border-[var(--te-gold)] rounded-lg p-3 mb-4">
                                                        This interview is confirmed with {interviewToCancel.assigned_to_name}. They will be notified of the cancellation.
                                                    </p>
                                                )}
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--te-text)] mb-2">
                                                        Reason (optional)
                                                    </label>
                                                    <textarea
                                                        value={cancelReason}
                                                        onChange={(e) => setCancelReason(e.target.value)}
                                                        rows={3}
                                                        placeholder="Let us know why you're cancelling..."
                                                        className="te-textarea"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[var(--te-surface-alt)] px-6 py-4 flex gap-3 justify-end">
                                        <button
                                            onClick={closeCancelModal}
                                            disabled={cancellingId === interviewToCancel?.id}
                                            className="te-btn-secondary disabled:opacity-50"
                                        >
                                            Keep Interview
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={cancellingId === interviewToCancel?.id}
                                            className="te-btn-danger disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* View Notes Modal */}
            <Transition appear show={showNotesModal} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeNotesModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50 " />
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
                                <Dialog.Panel className="te-card w-full max-w-2xl transform overflow-hidden transition-all">
                                    <div className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <Dialog.Title className="font-mono text-xl font-bold text-[var(--te-text)] mb-1">
                                                    Meeting Notes
                                                </Dialog.Title>
                                                <p className="text-sm text-[var(--te-text-dim)]">
                                                    {selectedInterview && formatInterviewType(selectedInterview.interview_type)} • {selectedInterview && formatDateWithDay(selectedInterview.timeslot_date)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={closeNotesModal}
                                                className="te-icon-btn"
                                            >
                                                <XMarkIcon className="h-6 w-6" />
                                            </button>
                                        </div>

                                        {selectedInterview && (
                                            <div className="space-y-4">
                                                {/* Interviewer Info */}
                                                {selectedInterview.assigned_to_name && (
                                                    <div className="te-panel p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <UserIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                                            <span className="text-sm font-semibold text-[var(--te-text)]">Interviewer</span>
                                                        </div>
                                                        <p className="text-sm text-[var(--te-text)] font-medium">
                                                            {selectedInterview.assigned_to_name}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Meeting Notes */}
                                                <div className="te-panel p-4">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-[var(--te-text)]" />
                                                        <span className="text-sm font-bold text-[var(--te-text)] uppercase">Notes</span>
                                                    </div>
                                                    <div className="te-card p-4">
                                                        <p className="text-sm text-[var(--te-text)] whitespace-pre-wrap break-words">
                                                            {selectedInterview.meeting_notes}
                                                        </p>
                                                    </div>

                                                    {/* If it's a link, show join button */}
                                                    {selectedInterview.meeting_notes.startsWith('http') && (
                                                        <div className="mt-3">
                                                            <a
                                                                href={selectedInterview.meeting_notes}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="te-btn-primary"
                                                            >
                                                                <LinkIcon className="h-4 w-4" />
                                                                Join Interview
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Member Notes */}
                                                {selectedInterview.member_notes && (
                                                    <div className="te-panel p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <ChatBubbleLeftRightIcon className="h-4 w-4 text-[var(--te-text)]" />
                                                            <span className="text-sm font-semibold text-[var(--te-text)]">Your Notes</span>
                                                        </div>
                                                        <p className="text-sm text-[var(--te-text)]">
                                                            {selectedInterview.member_notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-[var(--te-surface-alt)] px-6 py-4 flex justify-end">
                                        <button
                                            onClick={closeNotesModal}
                                            className="te-btn-primary"
                                        >
                                            Close
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

export default MyInterviews;
