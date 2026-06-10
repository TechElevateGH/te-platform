import { useState, useEffect, useCallback, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    CheckCircleIcon,
    UserPlusIcon,
    PaperAirplaneIcon,
    FunnelIcon,
    PencilIcon,
    TrashIcon,
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    XCircleIcon,
    CalendarDaysIcon
} from 'icons';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loading } from '../_custom/Loading';
import DeleteConfirmationModal from '../_custom/DeleteConfirmationModal';

const INTERVIEW_TYPE_COLORS = {
    system_design: { bg: 'bg-[var(--te-hover)]', text: 'text-[var(--te-text)]', border: 'border-[var(--te-border)]' },
    behavioral: { bg: 'bg-[var(--te-hover)]', text: 'text-[var(--te-text)]', border: 'border-[var(--te-border)]' },
    coding: { bg: 'bg-[var(--te-surface-alt)]', text: 'text-[var(--te-text-dim)]', border: 'border-[var(--te-border)]' },
    one_on_one: { bg: 'bg-[var(--te-hover)]', text: 'text-[var(--te-text)]', border: 'border-[var(--te-border)]' },
};

const STATUS_COLORS = {
    pending: { bg: 'bg-[var(--te-surface-alt)]', text: 'text-[var(--te-text-dim)]', border: 'border-[var(--te-border)]' },
    confirmed: { bg: 'bg-[var(--te-hover)]', text: 'text-[var(--te-text)]', border: 'border-[var(--te-border)]' },
    completed: { bg: 'bg-[var(--te-hover)]', text: 'text-[var(--te-text)]', border: 'border-[var(--te-border)]' },
    cancelled: { bg: 'bg-[var(--te-surface-alt)]', text: 'text-[var(--te-text-dim)]', border: 'border-[var(--te-border)]' },
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

// Helper function to format time with timezone
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

// Helper function to format date
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// Helper function to format timestamp with timezone
const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    // Parse the timestamp - it comes from backend as ISO string in UTC
    let date;
    if (timestamp.endsWith('Z') || timestamp.includes('+')) {
        // Already has timezone info
        date = new Date(timestamp);
    } else {
        // No timezone info, assume UTC and append 'Z'
        date = new Date(timestamp + 'Z');
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const InterviewManagement = () => {
    const { accessToken, userRole, userId } = useAuth();
    const toast = useToast();
    const [interviews, setInterviews] = useState([]);
    const [interviewers, setInterviewers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending status
    const [sortField, setSortField] = useState('timeslot_date'); // Field to sort by
    const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'

    // Selection and bulk delete state
    const [selectedItems, setSelectedItems] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const isAdmin = parseInt(userRole) === 5;
    const _isLead = parseInt(userRole) === 4; // eslint-disable-line no-unused-vars

    // Action modals
    const [assignModal, setAssignModal] = useState({ open: false, interview: null });
    const [confirmModal, setConfirmModal] = useState({ open: false, interview: null, meeting_notes: '' });
    const [completeModal, setCompleteModal] = useState({ open: false, interview: null, feedback: '' });
    const [cancelModal, setCancelModal] = useState({ open: false, interview: null, reason: '' });
    const [viewModal, setViewModal] = useState({ open: false, interview: null });
    const [submitting, setSubmitting] = useState(false);

    const fetchInterviews = useCallback(async () => {
        if (!accessToken) return;

        setLoading(true);
        try {
            const response = await axiosInstance.get('/interviews/all', {
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

    const fetchInterviewers = useCallback(async () => {
        if (!accessToken) return;

        try {
            const response = await axiosInstance.get('/interviews/interviewers', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setInterviewers(response.data.interviewers || []);
        } catch (error) {
            console.error('Error fetching interviewers:', error);
            setInterviewers([]);
        }
    }, [accessToken]);

    useEffect(() => {
        fetchInterviews();
        fetchInterviewers();
    }, [fetchInterviews, fetchInterviewers]);

    const handleAssign = async (interviewId, assignedToId) => {
        setSubmitting(true);
        try {
            await axiosInstance.post(`/interviews/${interviewId}/assign`, {
                assigned_to: assignedToId
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setAssignModal({ open: false, interview: null });
            fetchInterviews();
        } catch (error) {
            console.error('Error assigning interviewer:', error);
            toast.error(error.response?.data?.detail || 'Failed to assign interviewer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirmModal.meeting_notes.trim()) {
            toast.warning('Please provide notes');
            return;
        }

        setSubmitting(true);
        try {
            await axiosInstance.post(`/interviews/${confirmModal.interview.id}/confirm`, {
                meeting_notes: confirmModal.meeting_notes
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setConfirmModal({ open: false, interview: null, meeting_notes: '' });
            fetchInterviews();
        } catch (error) {
            console.error('Error confirming interview:', error);
            toast.error(error.response?.data?.detail || 'Failed to confirm interview');
        } finally {
            setSubmitting(false);
        }
    };

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
            fetchInterviews();
        } catch (error) {
            console.error('Error completing interview:', error);
            toast.error(error.response?.data?.detail || 'Failed to complete interview');
        } finally {
            setSubmitting(false);
        }
    };

    const openCancelModal = (interview) => {
        setCancelModal({ open: true, interview, reason: '' });
    };

    const handleCancel = async () => {
        if (!cancelModal.interview) return;

        setSubmitting(true);
        try {
            await axiosInstance.post(`/interviews/${cancelModal.interview.id}/cancel`, {
                cancellation_reason: cancelModal.reason || 'Cancelled by admin'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            toast.success('Interview cancelled successfully');
            setCancelModal({ open: false, interview: null, reason: '' });
            fetchInterviews();
        } catch (error) {
            console.error('Error cancelling interview:', error);
            toast.error(error.response?.data?.detail || 'Failed to cancel interview');
        } finally {
            setSubmitting(false);
        }
    };

    // Selection handlers
    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === filteredInterviews.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredInterviews.map(interview => interview.id));
        }
    };

    // Delete handlers
    const handleDeleteClick = (interview = null) => {
        if (interview) {
            setItemToDelete(interview);
        } else if (selectedItems.length > 0) {
            setItemToDelete({ bulk: true, count: selectedItems.length });
        }
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        try {
            if (itemToDelete?.bulk) {
                await axiosInstance.post('/interviews/bulk-delete',
                    { request_ids: selectedItems },
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                setSelectedItems([]);
                toast.success(`Successfully deleted ${itemToDelete.count} interview(s)`);
            } else {
                await axiosInstance.delete(`/interviews/${itemToDelete.id}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                toast.success('Interview deleted successfully');
            }
            fetchInterviews();
        } catch (error) {
            console.error('Error deleting interview(s):', error);
            toast.error(error.response?.data?.detail || 'Failed to delete');
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const filteredInterviews = interviews.filter(i =>
        statusFilter === 'all' || i.status === statusFilter
    );

    // Sort function
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Apply sorting
    const sortedInterviews = [...filteredInterviews].sort((a, b) => {
        let aValue, bValue;

        switch (sortField) {
            case 'user_name':
                aValue = a.user_name || '';
                bValue = b.user_name || '';
                break;
            case 'interview_type':
                aValue = a.interview_type || '';
                bValue = b.interview_type || '';
                break;
            case 'timeslot_date':
                aValue = new Date(a.timeslot_date + 'T' + (a.timeslot_time || '00:00'));
                bValue = new Date(b.timeslot_date + 'T' + (b.timeslot_time || '00:00'));
                break;
            case 'assigned_to_name':
                aValue = a.assigned_to_name || 'zzz'; // Put unassigned at end
                bValue = b.assigned_to_name || 'zzz';
                break;
            case 'status':
                aValue = a.status || '';
                bValue = b.status || '';
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loading />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Compact Header with Filter */}
            <div className="te-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <h3 className="font-mono text-base font-bold text-[var(--te-text)]">All Interview Requests</h3>
                <div className="flex items-center gap-2">
                    {isAdmin && selectedItems.length > 0 && (
                        <button
                            onClick={() => handleDeleteClick()}
                            className="te-btn-danger te-btn-sm"
                        >
                            <TrashIcon className="h-4 w-4 mr-1.5" />
                            Delete ({selectedItems.length})
                        </button>
                    )}
                    <FunnelIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="te-select py-1.5 text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Interviews Table */}
            {filteredInterviews.length === 0 ? (
                <div className="te-card flex flex-col items-center py-14">
                    <CalendarIcon className="mb-4 h-12 w-12 text-[var(--te-text-dim)]" />
                    <h3 className="font-mono text-lg font-bold text-[var(--te-text)] mb-2">No Interview Requests</h3>
                    <p className="text-sm text-[var(--te-text-dim)]">
                        {statusFilter === 'all' ? 'No interview requests yet.' : `No ${statusFilter} interviews.`}
                    </p>
                </div>
            ) : (
                <div className="te-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                <tr>
                                    {isAdmin && (
                                        <th className="px-4 py-3 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.length === sortedInterviews.length && sortedInterviews.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-[var(--te-border)] text-[var(--te-text)] focus:ring-[var(--te-ring)]"
                                            />
                                        </th>
                                    )}
                                    <th
                                        onClick={() => handleSort('user_name')}
                                        className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text)] uppercase tracking-wider cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            Member
                                            {sortField === 'user_name' ? (
                                                sortDirection === 'asc' ?
                                                    <ChevronUpIcon className="h-4 w-4" /> :
                                                    <ChevronDownIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('interview_type')}
                                        className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text)] uppercase tracking-wider cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            Type
                                            {sortField === 'interview_type' ? (
                                                sortDirection === 'asc' ?
                                                    <ChevronUpIcon className="h-4 w-4" /> :
                                                    <ChevronDownIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('timeslot_date')}
                                        className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text)] uppercase tracking-wider cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            Date & Time
                                            {sortField === 'timeslot_date' ? (
                                                sortDirection === 'asc' ?
                                                    <ChevronUpIcon className="h-4 w-4" /> :
                                                    <ChevronDownIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        onClick={() => handleSort('assigned_to_name')}
                                        className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text)] uppercase tracking-wider cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            Interviewer
                                            {sortField === 'assigned_to_name' ? (
                                                sortDirection === 'asc' ?
                                                    <ChevronUpIcon className="h-4 w-4" /> :
                                                    <ChevronDownIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text)] uppercase tracking-wider">
                                        Companies
                                    </th>
                                    <th
                                        onClick={() => handleSort('status')}
                                        className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text)] uppercase tracking-wider cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            Status
                                            {sortField === 'status' ? (
                                                sortDirection === 'asc' ?
                                                    <ChevronUpIcon className="h-4 w-4" /> :
                                                    <ChevronDownIcon className="h-4 w-4" />
                                            ) : (
                                                <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-[var(--te-text)] uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--te-border)]">
                                {sortedInterviews.map((interview) => {
                                    const typeColors = INTERVIEW_TYPE_COLORS[interview.interview_type] || INTERVIEW_TYPE_COLORS.coding;
                                    const statusColors = STATUS_COLORS[interview.status] || STATUS_COLORS.pending;

                                    return (
                                        <tr
                                            key={interview.id}
                                            className="hover:bg-[var(--te-hover)] transition-colors"
                                        >
                                            {isAdmin && (
                                                <td className="px-4 py-3 w-12" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(interview.id)}
                                                        onChange={() => toggleSelectItem(interview.id)}
                                                        className="rounded border-[var(--te-border)] text-[var(--te-text)] focus:ring-[var(--te-ring)]"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4 text-[var(--te-text-dim)] flex-shrink-0" />
                                                    <span className="font-semibold text-[var(--te-text)] text-sm">
                                                        {interview.user_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`te-chip border ${typeColors.border} ${typeColors.bg} ${typeColors.text}`}>
                                                    {formatInterviewType(interview.interview_type)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CalendarIcon className="h-4 w-4 text-[var(--te-text-dim)] flex-shrink-0" />
                                                        <span className="font-medium text-[var(--te-text)]">
                                                            {formatDate(interview.timeslot_date)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-[var(--te-text-dim)]">
                                                        <ClockIcon className="h-4 w-4 text-[var(--te-text-dim)] flex-shrink-0" />
                                                        <span>{formatTime(interview.timeslot_time)}</span>
                                                        <span className="text-xs text-[var(--te-text-dim)]">({interview.duration_minutes} min)</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {interview.assigned_to_name ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-[var(--te-text)] text-sm">
                                                                {interview.assigned_to_name}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setAssignModal({ open: true, interview })}
                                                            className="te-icon-btn"
                                                            title="Change interviewer"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[var(--te-text-dim)] italic">Not assigned</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {interview.pending_companies && interview.pending_companies.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {interview.pending_companies.slice(0, 2).map((company, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="te-chip"
                                                            >
                                                                {company}
                                                            </span>
                                                        ))}
                                                        {interview.pending_companies.length > 2 && (
                                                            <span className="te-chip text-[var(--te-text-dim)]">
                                                                +{interview.pending_companies.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[var(--te-text-dim)]">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`te-chip border ${statusColors.border} ${statusColors.bg} ${statusColors.text}`}>
                                                    {formatStatus(interview.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setViewModal({ open: true, interview })}
                                                        className="te-btn-secondary te-btn-sm"
                                                    >
                                                        View
                                                    </button>
                                                    {interview.status === 'pending' && !interview.assigned_to && (
                                                        <button
                                                            onClick={() => setAssignModal({ open: true, interview })}
                                                            className="te-btn-primary te-btn-sm"
                                                        >
                                                            <UserPlusIcon className="h-3.5 w-3.5" />
                                                            Assign
                                                        </button>
                                                    )}
                                                    {interview.status === 'pending' && interview.assigned_to && (
                                                        <button
                                                            onClick={() => setConfirmModal({ open: true, interview, meetingLink: '' })}
                                                            className="te-btn-primary te-btn-sm"
                                                        >
                                                            <PaperAirplaneIcon className="h-3.5 w-3.5" />
                                                            Confirm
                                                        </button>
                                                    )}
                                                    {interview.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => setCompleteModal({ open: true, interview, feedback: '' })}
                                                            className="te-btn-primary te-btn-sm"
                                                        >
                                                            <CheckCircleIcon className="h-3.5 w-3.5" />
                                                            Complete
                                                        </button>
                                                    )}
                                                    {interview.status === 'pending' && isAdmin && (
                                                        <button
                                                            onClick={() => openCancelModal(interview)}
                                                            className="te-btn-ghost te-btn-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteClick(interview)}
                                                            className="te-icon-btn"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            <Transition appear show={assignModal.open} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setAssignModal({ open: false, interview: null })}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
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
                                <Dialog.Panel className="te-card w-full max-w-md transform overflow-hidden p-6 transition-all">
                                    <Dialog.Title className="font-mono text-lg font-bold text-[var(--te-text)] mb-4">
                                        Assign Interviewer
                                    </Dialog.Title>
                                    {interviewers.length === 0 ? (
                                        <p className="text-sm text-[var(--te-text-dim)] py-4">No interviewers available</p>
                                    ) : (
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {interviewers.map((interviewer) => (
                                                <button
                                                    key={interviewer.id}
                                                    onClick={() => {
                                                        handleAssign(assignModal.interview?.id, interviewer.id);
                                                    }}
                                                    disabled={submitting}
                                                    className="w-full text-left px-4 py-3 rounded-lg border border-[var(--te-border)] hover:bg-[var(--te-hover)] hover:border-[var(--te-border-strong)] transition-all disabled:opacity-50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-semibold text-[var(--te-text)]">{interviewer.full_name}</div>
                                                        {interviewer.id === userId && (
                                                            <span className="inline-flex items-center rounded-md bg-[var(--te-hover)] px-2 py-0.5 text-xs font-medium text-[var(--te-text)]">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    {interviewer.email && (
                                                        <div className="text-sm text-[var(--te-text-dim)]">{interviewer.email}</div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setAssignModal({ open: false, interview: null })}
                                        className="mt-4 w-full px-4 py-2 text-sm font-semibold text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Confirm Modal */}
            <Transition appear show={confirmModal.open} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setConfirmModal({ open: false, interview: null, meetingLink: '' })}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
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
                                <Dialog.Panel className="te-card w-full max-w-md transform overflow-hidden p-6 transition-all">
                                    <Dialog.Title className="font-mono text-lg font-bold text-[var(--te-text)] mb-4">
                                        Confirm Interview
                                    </Dialog.Title>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-[var(--te-text)] mb-2">
                                                Notes
                                            </label>
                                            <input
                                                type="text"
                                                value={confirmModal.meeting_notes}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, meeting_notes: e.target.value }))}
                                                placeholder="Add meeting notes, link, or details..."
                                                className="te-textarea"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleConfirm}
                                                disabled={submitting}
                                                className="te-btn-primary flex-1 disabled:opacity-50"
                                            >
                                                {submitting ? 'Confirming...' : 'Confirm'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmModal({ open: false, interview: null, meeting_notes: '' })}
                                                className="te-btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Complete Modal */}
            <Transition appear show={completeModal.open} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setCompleteModal({ open: false, interview: null, feedback: '' })}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/50" />
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
                                <Dialog.Panel className="te-card w-full max-w-md transform overflow-hidden p-6 transition-all">
                                    <Dialog.Title className="font-mono text-lg font-bold text-[var(--te-text)] mb-4">
                                        Complete Interview
                                    </Dialog.Title>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-[var(--te-text)] mb-2">
                                                Interviewer Feedback
                                            </label>
                                            <textarea
                                                value={completeModal.feedback}
                                                onChange={(e) => setCompleteModal(prev => ({ ...prev, feedback: e.target.value }))}
                                                rows={6}
                                                placeholder="Provide constructive feedback for the member..."
                                                className="te-textarea"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleComplete}
                                                disabled={submitting}
                                                className="te-btn-primary flex-1 disabled:opacity-50"
                                            >
                                                {submitting ? 'Submitting...' : 'Complete'}
                                            </button>
                                            <button
                                                onClick={() => setCompleteModal({ open: false, interview: null, feedback: '' })}
                                                className="te-btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* View Details Modal */}
            <Transition appear show={viewModal.open} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setViewModal({ open: false, interview: null })}>
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
                                        <Dialog.Title className="font-mono text-xl font-bold text-[var(--te-text)] mb-6">
                                            Meeting Request Details
                                        </Dialog.Title>

                                        {viewModal.interview && (
                                            <div className="space-y-6">
                                                {/* Header with Status */}
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${INTERVIEW_TYPE_COLORS[viewModal.interview.interview_type]?.bg} ${INTERVIEW_TYPE_COLORS[viewModal.interview.interview_type]?.text}`}>
                                                                {formatInterviewType(viewModal.interview.interview_type)}
                                                            </span>
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold ${STATUS_COLORS[viewModal.interview.status]?.bg} ${STATUS_COLORS[viewModal.interview.status]?.text}`}>
                                                                {formatStatus(viewModal.interview.status)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Member Information */}
                                                <div className="te-panel p-4">
                                                    <h3 className="text-sm font-bold text-[var(--te-text)] uppercase mb-3">Member Information</h3>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <UserIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                                            <span className="text-sm font-semibold text-[var(--te-text)]">{viewModal.interview.user_name}</span>
                                                        </div>
                                                        <div className="text-sm text-[var(--te-text-dim)]">{viewModal.interview.user_email}</div>
                                                    </div>
                                                </div>

                                                {/* Date & Time */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="te-panel p-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <CalendarIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                                            <span className="text-xs font-bold text-[var(--te-text)] uppercase">Date</span>
                                                        </div>
                                                        <div className="text-sm font-semibold text-[var(--te-text)]">{formatDate(viewModal.interview.timeslot_date)}</div>
                                                    </div>
                                                    <div className="te-panel p-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <ClockIcon className="h-4 w-4 text-[var(--te-text-dim)]" />
                                                            <span className="text-xs font-bold text-[var(--te-text)] uppercase">Time</span>
                                                        </div>
                                                        <div className="text-sm font-semibold text-[var(--te-text)]">
                                                            {formatTime(viewModal.interview.timeslot_time)} <span className="text-xs text-[var(--te-text-dim)]">({viewModal.interview.duration_minutes} min)</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Interviewer */}
                                                {viewModal.interview.assigned_to_name && (
                                                    <div className="te-panel p-4">
                                                        <h3 className="text-sm font-bold text-[var(--te-text)] uppercase mb-2">Assigned Interviewer</h3>
                                                        <div className="text-sm font-semibold text-[var(--te-text)]">{viewModal.interview.assigned_to_name}</div>
                                                    </div>
                                                )}

                                                {/* Companies */}
                                                {viewModal.interview.pending_companies && viewModal.interview.pending_companies.length > 0 && (
                                                    <div className="te-panel p-4">
                                                        <h3 className="text-sm font-bold text-[var(--te-text)] uppercase mb-3">Pending Interviews</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {viewModal.interview.pending_companies.map((company, idx) => (
                                                                <span key={idx} className="te-chip">
                                                                    {company}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {viewModal.interview.earliest_interview_date && (
                                                            <div className="mt-3 text-sm text-[var(--te-text-dim)]">
                                                                Earliest: {formatDate(viewModal.interview.earliest_interview_date)}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Member Notes */}
                                                {viewModal.interview.member_notes && (
                                                    <div className="te-panel p-4">
                                                        <h3 className="text-sm font-bold text-[var(--te-text)] uppercase mb-2">Member Notes</h3>
                                                        <p className="text-sm text-[var(--te-text)]">{viewModal.interview.member_notes}</p>
                                                    </div>
                                                )}

                                                {/* Meeting Notes */}
                                                {viewModal.interview.meeting_notes && (
                                                    <div className="te-panel p-4">
                                                        <h3 className="text-sm font-bold text-[var(--te-text)] uppercase mb-2">Meeting Notes</h3>
                                                        <p className="text-sm text-[var(--te-text)] break-all">{viewModal.interview.meeting_notes}</p>
                                                    </div>
                                                )}

                                                {/* Feedback */}
                                                {viewModal.interview.interviewer_feedback && (
                                                    <div className="te-panel p-4">
                                                        <h3 className="text-sm font-bold text-[var(--te-text)] uppercase mb-2">Interviewer Feedback</h3>
                                                        <p className="text-sm text-[var(--te-text)] whitespace-pre-wrap">{viewModal.interview.interviewer_feedback}</p>
                                                    </div>
                                                )}

                                                {/* Timestamps */}
                                                <div className="te-panel p-4">
                                                    <h3 className="text-sm font-bold text-[var(--te-text)] uppercase mb-3">Timeline</h3>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-[var(--te-text-dim)]">Created:</span>
                                                            <span className="font-medium text-[var(--te-text)]">{formatTimestamp(viewModal.interview.created_at)}</span>
                                                        </div>
                                                        {viewModal.interview.assigned_at && (
                                                            <div className="flex justify-between">
                                                                <span className="text-[var(--te-text-dim)]">Assigned:</span>
                                                                <span className="font-medium text-[var(--te-text)]">{formatTimestamp(viewModal.interview.assigned_at)}</span>
                                                            </div>
                                                        )}
                                                        {viewModal.interview.confirmed_at && (
                                                            <div className="flex justify-between">
                                                                <span className="text-[var(--te-text-dim)]">Confirmed:</span>
                                                                <span className="font-medium text-[var(--te-text)]">{formatTimestamp(viewModal.interview.confirmed_at)}</span>
                                                            </div>
                                                        )}
                                                        {viewModal.interview.completed_at && (
                                                            <div className="flex justify-between">
                                                                <span className="text-[var(--te-text-dim)]">Completed:</span>
                                                                <span className="font-medium text-[var(--te-text)]">{formatTimestamp(viewModal.interview.completed_at)}</span>
                                                            </div>
                                                        )}
                                                        {viewModal.interview.cancelled_at && (
                                                            <div className="flex justify-between">
                                                                <span className="text-[var(--te-text-dim)]">Cancelled:</span>
                                                                <span className="font-medium text-[var(--te-text)]">{formatTimestamp(viewModal.interview.cancelled_at)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Close Button */}
                                                <button
                                                    onClick={() => setViewModal({ open: false, interview: null })}
                                                    className="te-btn-primary w-full"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Cancel Interview Modal */}
            <Transition appear show={cancelModal.open} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setCancelModal({ open: false, interview: null, reason: '' })}>
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
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                                <XCircleIcon className="h-6 w-6 text-[var(--te-text)]" />
                                            </div>
                                            <div className="flex-1">
                                                <Dialog.Title className="font-mono text-lg font-semibold text-[var(--te-text)] mb-2">
                                                    Cancel Interview Request
                                                </Dialog.Title>
                                                {cancelModal.interview && (
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-[var(--te-text-dim)]">
                                                            Cancel {formatInterviewType(cancelModal.interview.interview_type).toLowerCase()} interview for <strong>{cancelModal.interview.user_name}</strong>?
                                                        </p>
                                                        <div className="bg-[var(--te-surface-alt)] rounded-lg p-3 text-sm">
                                                            <div className="flex items-center gap-2 text-[var(--te-text)]">
                                                                <CalendarDaysIcon className="h-4 w-4" />
                                                                <span>{formatDate(cancelModal.interview.timeslot_date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[var(--te-text)] mt-1">
                                                                <ClockIcon className="h-4 w-4" />
                                                                <span>{formatTime(cancelModal.interview.timeslot_time)}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--te-text)] mb-2">
                                                                Cancellation Reason
                                                            </label>
                                                            <textarea
                                                                value={cancelModal.reason}
                                                                onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                                                                rows={3}
                                                                placeholder="Please provide a reason for cancellation..."
                                                                className="te-textarea"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-[var(--te-surface-alt)] px-6 py-4 flex gap-3 justify-end">
                                        <button
                                            onClick={() => setCancelModal({ open: false, interview: null, reason: '' })}
                                            disabled={submitting}
                                            className="px-4 py-2 text-sm font-semibold text-[var(--te-text)] hover:bg-[var(--te-hover)] rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            Keep Interview
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={submitting}
                                            className="te-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {submitting ? 'Cancelling...' : 'Yes, Cancel Interview'}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Interview(s)"
                message={itemToDelete?.bulk
                    ? `You are about to permanently delete ${itemToDelete.count} interview request(s).`
                    : `You are about to permanently delete the ${itemToDelete?.interview_type} interview for ${itemToDelete?.user_name}.`
                }
                itemCount={itemToDelete?.bulk ? itemToDelete.count : 1}
                isDeleting={deleting}
                itemType="interview"
            />
        </div>
    );
};

export default InterviewManagement;
