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
    XMarkIcon
} from '@heroicons/react/20/solid';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loading } from '../_custom/Loading';
import DeleteConfirmationModal from '../_custom/DeleteConfirmationModal';

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

const InterviewManagement = () => {
    const { accessToken, userRole } = useAuth();
    const toast = useToast();
    const [interviews, setInterviews] = useState([]);
    const [interviewers, setInterviewers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending status

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
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">All Interview Requests</h3>
                <div className="flex items-center gap-2">
                    {isAdmin && selectedItems.length > 0 && (
                        <button
                            onClick={() => handleDeleteClick()}
                            className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <TrashIcon className="h-4 w-4 mr-1.5" />
                            Delete ({selectedItems.length})
                        </button>
                    )}
                    <FunnelIcon className="h-4 w-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:border-blue-500"
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
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Interview Requests</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {statusFilter === 'all' ? 'No interview requests yet.' : `No ${statusFilter} interviews.`}
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    {isAdmin && (
                                        <th className="px-4 py-3 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.length === filteredInterviews.length && filteredInterviews.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 dark:bg-gray-700"
                                            />
                                        </th>
                                    )}
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Member
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Interviewer
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Companies
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredInterviews.map((interview) => {
                                    const typeColors = INTERVIEW_TYPE_COLORS[interview.interview_type] || INTERVIEW_TYPE_COLORS.technical;
                                    const statusColors = STATUS_COLORS[interview.status] || STATUS_COLORS.pending;

                                    return (
                                        <tr
                                            key={interview.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                                        >
                                            {isAdmin && (
                                                <td className="px-4 py-3 w-12" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(interview.id)}
                                                        onChange={() => toggleSelectItem(interview.id)}
                                                        className="rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 dark:bg-gray-700"
                                                    />
                                                </td>
                                            )}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                                        {interview.user_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typeColors.bg} ${typeColors.text}`}>
                                                    {formatInterviewType(interview.interview_type)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {interview.timeslot_date}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                        <span>{interview.timeslot_time}</span>
                                                        <span className="text-xs text-gray-500">({interview.duration_minutes} min)</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {interview.assigned_to_name ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                                {interview.assigned_to_name}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setAssignModal({ open: true, interview })}
                                                            className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                                                            title="Change interviewer"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 italic">Not assigned</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {interview.pending_companies && interview.pending_companies.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {interview.pending_companies.slice(0, 2).map((company, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                                                            >
                                                                {company}
                                                            </span>
                                                        ))}
                                                        {interview.pending_companies.length > 2 && (
                                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                                                                +{interview.pending_companies.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text}`}>
                                                    {formatStatus(interview.status)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {interview.status === 'pending' && !interview.assigned_to && (
                                                        <button
                                                            onClick={() => setAssignModal({ open: true, interview })}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            <UserPlusIcon className="h-3.5 w-3.5" />
                                                            Assign
                                                        </button>
                                                    )}
                                                    {interview.status === 'pending' && interview.assigned_to && (
                                                        <button
                                                            onClick={() => setConfirmModal({ open: true, interview, meetingLink: '' })}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                                        >
                                                            <PaperAirplaneIcon className="h-3.5 w-3.5" />
                                                            Confirm
                                                        </button>
                                                    )}
                                                    {interview.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => setCompleteModal({ open: true, interview, feedback: '' })}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            <CheckCircleIcon className="h-3.5 w-3.5" />
                                                            Complete
                                                        </button>
                                                    )}
                                                    {interview.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleCancel(interview.id)}
                                                            className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteClick(interview)}
                                                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                        Assign Interviewer
                                    </Dialog.Title>
                                    {interviewers.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No interviewers available</p>
                                    ) : (
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {interviewers.map((interviewer) => (
                                                <button
                                                    key={interviewer.id}
                                                    onClick={() => {
                                                        handleAssign(assignModal.interview?.id, interviewer.id);
                                                    }}
                                                    disabled={submitting}
                                                    className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all disabled:opacity-50"
                                                >
                                                    <div className="font-semibold text-gray-900 dark:text-white">{interviewer.full_name}</div>
                                                    {interviewer.email && (
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{interviewer.email}</div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setAssignModal({ open: false, interview: null })}
                                        className="mt-4 w-full px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                        Confirm Interview
                                    </Dialog.Title>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Meeting Link
                                            </label>
                                            <input
                                                type="url"
                                                value={confirmModal.meetingLink}
                                                onChange={(e) => setConfirmModal(prev => ({ ...prev, meetingLink: e.target.value }))}
                                                placeholder="https://zoom.us/j/..."
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleConfirm}
                                                disabled={submitting}
                                                className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                            >
                                                {submitting ? 'Confirming...' : 'Confirm'}
                                            </button>
                                            <button
                                                onClick={() => setConfirmModal({ open: false, interview: null, meetingLink: '' })}
                                                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                                        Complete Interview
                                    </Dialog.Title>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Interviewer Feedback
                                            </label>
                                            <textarea
                                                value={completeModal.feedback}
                                                onChange={(e) => setCompleteModal(prev => ({ ...prev, feedback: e.target.value }))}
                                                rows={6}
                                                placeholder="Provide constructive feedback for the member..."
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleComplete}
                                                disabled={submitting}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                {submitting ? 'Submitting...' : 'Complete'}
                                            </button>
                                            <button
                                                onClick={() => setCompleteModal({ open: false, interview: null, feedback: '' })}
                                                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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

export default InterviewManagement;
