import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    BriefcaseIcon,
    UserIcon,
    CalendarIcon,
    ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { FormTextArea } from '../_custom/FormInputs';
import SelectCombobox from '../_custom/SelectCombobox';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';

const ReferralManagement = ({ referral, isOpen, setIsOpen, onUpdate }) => {
    const { accessToken } = useAuth();
    const [status, setStatus] = useState(referral.status);
    const [reviewNote, setReviewNote] = useState(referral.review_note || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const statusOptions = ['In review', 'Completed', 'Declined', 'Cancelled'];

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await axiosInstance.post(
                `/referrals/${referral.id}/review`,
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
                return 'text-emerald-700 bg-emerald-50 border-emerald-200';
            case 'In review':
                return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'Declined':
                return 'text-red-700 bg-red-50 border-red-200';
            case 'Cancelled':
                return 'text-gray-700 bg-gray-50 border-gray-200';
            default:
                return 'text-blue-700 bg-blue-50 border-blue-200';
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
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
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
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <UserIcon className="h-4 w-4" />
                                            Member Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Name</p>
                                                <p className="font-semibold text-gray-900 mt-1">{referral.user_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="font-semibold text-gray-900 mt-1">{referral.user_email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Position Details */}
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <BriefcaseIcon className="h-4 w-4" />
                                            Position Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Company</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <img
                                                        src={referral.company.image}
                                                        alt={referral.company.name}
                                                        className="h-6 w-6 rounded object-cover border border-gray-200"
                                                    />
                                                    <p className="font-semibold text-gray-900">{referral.company.name}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Role</p>
                                                <p className="font-semibold text-gray-900 mt-1">{referral.role}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500">Job Title</p>
                                                <p className="font-semibold text-gray-900 mt-1">{referral.job_title}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Request Details */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                                Request Note
                                            </label>
                                            <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                    {referral.request_note || 'No note provided'}
                                                </p>
                                            </div>
                                        </div>

                                        {referral.resume && (
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Resume
                                                </label>
                                                <a
                                                    href={referral.resume}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-2 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                                >
                                                    <DocumentTextIcon className="h-4 w-4" />
                                                    View Resume
                                                </a>
                                            </div>
                                        )}

                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4" />
                                                Submission Date
                                            </label>
                                            <p className="mt-2 text-sm font-semibold text-gray-700">{referral.date}</p>
                                        </div>
                                    </div>

                                    {/* Management Section */}
                                    <div className="border-t pt-6 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-900 mb-4">Review & Update Status</h3>

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
                                        <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
                                            <p className="text-xs text-gray-600 mb-2">Current Status</p>
                                            <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full border ${getStatusColor(referral.status)}`}>
                                                {referral.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
