import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    BriefcaseIcon,
    UserIcon,
    CalendarIcon,
    ChatBubbleLeftRightIcon,
    ClipboardDocumentIcon,
    DocumentDuplicateIcon,
    PhoneIcon,
    ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { FormTextArea } from '../_custom/FormInputs';
import SelectCombobox from '../_custom/SelectCombobox';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';

const ReferralManagement = ({ referral, isOpen, setIsOpen, onUpdate }) => {
    const { accessToken } = useAuth();
    const [status, setStatus] = useState(referral?.status || 'Pending');
    const [reviewNote, setReviewNote] = useState(referral?.review_note || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedField, setCopiedField] = useState(null);

    // Early return if no referral data
    if (!referral) {
        return null;
    }

    const statusOptions = ['Pending', 'Completed', 'Declined', 'Cancelled'];

    const copyToClipboard = async (text, fieldName) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Convert Google Drive download link to preview link
    const getViewableResumeUrl = (url) => {
        if (!url) return url;

        // If it's a Google Drive webContentLink (download), convert to view link
        // webContentLink format: https://drive.google.com/uc?id=FILE_ID&export=download
        // View format: https://drive.google.com/file/d/FILE_ID/view

        const fileIdMatch = url.match(/[?&]id=([^&]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            return `https://drive.google.com/file/d/${fileIdMatch[1]}/view`;
        }

        return url;
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await axiosInstance.patch(
                `/referrals/${referral.id}`,
                {
                    status: status,
                    review_note: reviewNote
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (response.data.referral) {
                onUpdate(response.data.referral);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Error updating referral:', error);
            alert('Failed to update referral. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700';
            case 'Pending':
                return 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700';
            case 'Declined':
                return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700';
            case 'Cancelled':
                return 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
            default:
                return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700';
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                                <DocumentTextIcon className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-bold text-white">
                                                    Referral Request
                                                </Dialog.Title>
                                                <p className="text-sm text-blue-100 mt-1">
                                                    Review and manage this referral request
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            <XMarkIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-6 py-6 space-y-6">
                                    {/* Member Information */}
                                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <UserIcon className="h-4 w-4" />
                                            Member Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="font-semibold text-gray-900 dark:text-white">{referral.user_name}</p>
                                                    <button
                                                        onClick={() => copyToClipboard(referral.user_name, 'name')}
                                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                        title="Copy name"
                                                    >
                                                        {copiedField === 'name' ? (
                                                            <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        ) : (
                                                            <ClipboardDocumentIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="font-semibold text-gray-900 dark:text-white">{referral.user_email}</p>
                                                    <button
                                                        onClick={() => copyToClipboard(referral.user_email, 'email')}
                                                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                        title="Copy email"
                                                    >
                                                        {copiedField === 'email' ? (
                                                            <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        ) : (
                                                            <ClipboardDocumentIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            {referral.contact && (
                                                <div className="col-span-2">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Contact</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <PhoneIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                        <p className="font-semibold text-gray-900 dark:text-white">{referral.contact}</p>
                                                        <button
                                                            onClick={() => copyToClipboard(referral.contact, 'contact')}
                                                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                            title="Copy contact"
                                                        >
                                                            {copiedField === 'contact' ? (
                                                                <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                            ) : (
                                                                <ClipboardDocumentIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Position Details */}
                                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 p-4">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <BriefcaseIcon className="h-4 w-4" />
                                            Position Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Company</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <img
                                                        src={referral.company.image}
                                                        alt={referral.company.name}
                                                        className="h-6 w-6 rounded object-cover border border-gray-200 dark:border-gray-600"
                                                    />
                                                    <p className="font-semibold text-gray-900 dark:text-white">{referral.company.name}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                                                <p className="font-semibold text-gray-900 dark:text-white mt-1">{referral.role}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Job Title</p>
                                                <p className="font-semibold text-gray-900 dark:text-white mt-1">{referral.job_title}</p>
                                                {referral.job_id && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Job ID: {referral.job_id}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Request Details */}
                                    <div className="space-y-3">
                                        {referral.resume && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                        Resume
                                                    </label>
                                                    <a
                                                        href={referral.resume}
                                                        download
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                                    >
                                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                                        Download Resume
                                                    </a>
                                                </div>
                                                <a
                                                    href={getViewableResumeUrl(referral.resume)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                                >
                                                    <DocumentTextIcon className="h-4 w-4" />
                                                    View Resume
                                                </a>
                                            </div>
                                        )}

                                        {referral.essay && (
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                        <DocumentDuplicateIcon className="h-4 w-4" />
                                                        Referral Essay
                                                    </label>
                                                    <button
                                                        onClick={() => copyToClipboard(referral.essay, 'essay')}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                                                    >
                                                        {copiedField === 'essay' ? (
                                                            <>
                                                                <CheckCircleIcon className="h-4 w-4" />
                                                                Copied!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ClipboardDocumentIcon className="h-4 w-4" />
                                                                Copy Essay
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 max-h-48 overflow-y-auto">
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                        {referral.essay}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                                Request Note
                                            </label>
                                            <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {referral.request_note || 'No note provided'}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4" />
                                                Submission Date
                                            </label>
                                            <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{referral.date}</p>
                                        </div>
                                    </div>

                                    {/* Management Section */}
                                    <div className="border-t dark:border-gray-700 pt-6 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Review & Update Status</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Update the status and add feedback notes for this referral request</p>
                                        </div>

                                        <SelectCombobox
                                            label="Status"
                                            options={statusOptions}
                                            value={status}
                                            onChange={setStatus}
                                            placeholder="Select status..."
                                            required={true}
                                        />

                                        <FormTextArea
                                            label="Review Note"
                                            field="review_note"
                                            value={reviewNote}
                                            handleInputChange={({ value }) => setReviewNote(value)}
                                            required={false}
                                            placeholder="Add any notes about your decision..."
                                        />

                                        {/* Current Status Display */}
                                        <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-3 border border-gray-200 dark:border-gray-600">
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Current Status</p>
                                            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(referral.status)}`}>
                                                {referral.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircleIcon className="h-5 w-5" />
                                                Update Referral
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default ReferralManagement;
