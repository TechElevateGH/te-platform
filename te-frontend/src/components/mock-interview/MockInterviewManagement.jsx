import { useState, useEffect, useCallback, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    CalendarIcon,
    ClockIcon,
    UserIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    UserPlusIcon,
    PaperAirplaneIcon,
    FunnelIcon,
    PencilIcon,
    TrashIcon,
    XMarkIcon,
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon
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
        coding: 'Coding'
    };
    return names[type] || type;
};

const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
};

const MockInterviewManagement = () => {
    const { accessToken, userRole } = useAuth();
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

    // Action modals
    const [assignModal, setAssignModal] = useState({ open: false, interview: null });
    const [confirmModal, setConfirmModal] = useState({ open: false, interview: null, meetingLink: '' });
    const [completeModal, setCompleteModal] = useState({ open: false, interview: null, feedback: '' });
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
        if (!confirmModal.meetingLink.trim()) {
            toast.warning('Please provide a meeting link');
            return;
        }

        setSubmitting(true);
        try {
            await axiosInstance.post(`/interviews/${confirmModal.interview.id}/confirm`, {
                meeting_link: confirmModal.meetingLink
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setConfirmModal({ open: false, interview: null, meetingLink: '' });
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

    const handleCancel = async (interviewId) => {
        const reason = window.prompt('Please provide a cancellation reason:');
        if (reason === null) return;

        try {
            await axiosInstance.post(`/interviews/${interviewId}/cancel`, {
                cancellation_reason: reason || 'Cancelled by admin'
            }, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            fetchInterviews();
        } catch (error) {
            console.error('Error cancelling interview:', error);
            toast.error(error.response?.data?.detail || 'Failed to cancel interview');
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
                aValue = a.assigned_to_name || 'zzz';
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
            <div className="te-card flex items-center justify-between px-4 py-3">
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
                        className="te-select"
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
                <div className="py-12 te-card">
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
                                                            {interview.timeslot_date}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-[var(--te-text-dim)]">
                                                        <ClockIcon className="h-4 w-4 text-[var(--te-text-dim)] flex-shrink-0" />
                                                        <span>{interview.timeslot_time}</span>
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
                                                    {interview.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleCancel(interview.id)}
                                                            className="te-btn-danger te-btn-sm"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteClick(interview)}
                                                            className="te-icon-btn text-[var(--te-text)]"
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
                                                    className="te-card-interactive w-full text-left px-4 py-3 disabled:opacity-50"
                                                >
                                                    <div className="font-semibold text-[var(--te-text)]">{interviewer.full_name}</div>
                                                    {interviewer.email && (
                                                        <div className="text-sm text-[var(--te-text-dim)]">{interviewer.email}</div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setAssignModal({ open: false, interview: null })}
                                        className="te-btn-secondary w-full mt-4"
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
                                                Meeting Link
                                            </label>
                                            <input
                                                type="url"
                                                value={confirmModal.meetingLink}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, meetingLink: e.target.value }))}
                                                placeholder="https://zoom.us/j/..."
                                                className="te-input"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleConfirm}
                                                disabled={submitting}
                                                className="te-btn-primary flex-1"
                                            >
                                                {submitting ? 'Confirming...' : 'Confirm'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmModal({ open: false, interview: null, meetingLink: '' })}
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
                                                className="te-btn-primary flex-1"
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

export default MockInterviewManagement;
