import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, DocumentTextIcon, BriefcaseIcon, UserIcon, CalendarIcon, ChatBubbleLeftRightIcon, ClipboardDocumentIcon, DocumentDuplicateIcon, PhoneIcon, ArrowDownTrayIcon } from 'icons';
import { FormTextArea } from '../_custom/FormInputs';
import SelectCombobox from '../_custom/SelectCombobox';
import axiosInstance from '../../axiosConfig';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getCompanyLogoUrl, handleCompanyLogoError } from '../../utils';
const ReferralManagement = ({
  referral,
  isOpen,
  setIsOpen,
  onUpdate
}) => {
  const {
    accessToken
  } = useAuth();
  const toast = useToast();
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

  // Legacy Google Drive links: convert download link to preview link.
  // Files uploaded to MongoDB are served directly by the API and pass through.
  const getViewableResumeUrl = url => {
    if (!url) return url;

    // webContentLink format: https://drive.google.com/uc?id=FILE_ID&export=download
    // View format: https://drive.google.com/file/d/FILE_ID/view

    const fileIdMatch = url.includes('drive.google.com')
      ? url.match(/[?&]id=([^&]+)/)
      : null;
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/view`;
    }
    return url;
  };
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.patch(`/referrals/${referral.id}`, {
        status: status,
        review_note: reviewNote
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (response.data.referral) {
        onUpdate(response.data.referral);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error updating referral:', error);
      toast.error('Failed to update referral. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const getStatusColor = status => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return "text-te-green bg-[var(--te-green-soft)] border-[var(--te-green)]";
      case 'Pending':
      case 'In Review':
        return "text-te-gold bg-[var(--te-gold-soft)] border-[var(--te-gold)]";
      case 'Declined':
      case 'Cancelled':
        return "text-te-red bg-[var(--te-red-soft)] border-[var(--te-red)]";
      default:
        return "text-[var(--te-text)] bg-[var(--te-surface-alt)] border-[var(--te-border)]";
    }
  };
  return <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={setIsOpen}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">

                    <div className="fixed inset-0 bg-black/50 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95" enterTo="opacity-100 translate-y-0 sm:scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 translate-y-0 sm:scale-100" leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">

                            <Dialog.Panel className="te-card relative transform overflow-hidden text-left transition-colors sm:my-8 sm:w-full sm:max-w-3xl">
                                {/* Header */}
                                <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-3 py-4 sm:px-6 sm:py-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface)] sm:h-12 sm:w-12">
                                                <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--te-text)]" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-base sm:text-xl font-bold text-[var(--te-text)]">
                                                    Referral Request
                                                </Dialog.Title>
                                                <p className="mt-1 hidden text-xs text-[var(--te-text-dim)] sm:block">
                                                    Review and manage this referral request
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsOpen(false)} className="te-icon-btn flex-shrink-0">

                                            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                                    {/* Member Information */}
                                    <div className="te-panel p-3 sm:p-4">
                                        <h3 className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em] mb-3 flex items-center gap-2">
                                            <UserIcon className="h-4 w-4" />
                                            Member Information
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <p className="text-xs text-[var(--te-text-dim)]">Name</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="font-semibold text-sm sm:text-base text-[var(--te-text)] truncate">{referral.user_name}</p>
                                                    <button onClick={() => copyToClipboard(referral.user_name, 'name')} className="te-icon-btn flex-shrink-0" title="Copy name">

                                                        {copiedField === 'name' ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)]" /> : <ClipboardDocumentIcon className="h-4 w-4 text-[var(--te-text-dim)]" />}

                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[var(--te-text-dim)]">Email</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="font-semibold text-sm sm:text-base text-[var(--te-text)] truncate">{referral.user_email}</p>
                                                    <button onClick={() => copyToClipboard(referral.user_email, 'email')} className="te-icon-btn flex-shrink-0" title="Copy email">

                                                        {copiedField === 'email' ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)]" /> : <ClipboardDocumentIcon className="h-4 w-4 text-[var(--te-text-dim)]" />}

                                                    </button>
                                                </div>
                                            </div>
                                            {referral.phone_number && <div className="sm:col-span-2">
                                                    <p className="text-xs text-[var(--te-text-dim)]">Contact</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <PhoneIcon className="h-4 w-4 text-[var(--te-text-dim)] flex-shrink-0" />
                                                        <p className="font-semibold text-sm sm:text-base text-[var(--te-text)]">{referral.phone_number}</p>
                                                        <button onClick={() => copyToClipboard(referral.phone_number, 'phone_number')} className="te-icon-btn flex-shrink-0" title="Copy contact">

                                                            {copiedField === 'phone_number' ? <CheckCircleIcon className="h-4 w-4 text-[var(--te-text)]" /> : <ClipboardDocumentIcon className="h-4 w-4 text-[var(--te-text-dim)]" />}

                                                        </button>
                                                    </div>
                                                </div>}

                                        </div>
                                    </div>

                                    {/* Position Details */}
                                    <div className="te-panel p-3 sm:p-4">
                                        <h3 className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em] mb-3 flex items-center gap-2">
                                            <BriefcaseIcon className="h-4 w-4" />
                                            Position Details
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div>
                                                <p className="text-xs text-[var(--te-text-dim)]">Company</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <img src={getCompanyLogoUrl(referral.company.name)} alt={referral.company.name} className="h-6 w-6 rounded object-cover border border-[var(--te-border)] flex-shrink-0" onError={handleCompanyLogoError} />

                                                    <p className="font-semibold text-sm sm:text-base text-[var(--te-text)] truncate">{referral.company.name}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-[var(--te-text-dim)]">Role</p>
                                                <p className="font-semibold text-sm sm:text-base text-[var(--te-text)] mt-1 truncate">{referral.role}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <p className="text-xs text-[var(--te-text-dim)]">Job Title</p>
                                                <p className="font-semibold text-sm sm:text-base text-[var(--te-text)] mt-1 break-words">{referral.job_title}</p>
                                            </div>
                                            {referral.job_id && <div className="sm:col-span-2">
                                                    <p className="text-xs text-[var(--te-text-dim)]">Job ID(s)</p>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {referral.job_id.split(/[,;\s]+/).filter(id => id.trim()).map((id, index) => <span key={index} className="inline-flex items-center px-2.5 py-1 bg-[var(--te-surface-alt)] text-[var(--te-text)] text-xs font-medium rounded-md border border-[var(--te-border)]">

                                                                {id.trim()}
                                                            </span>)}
                                                    </div>
                                                </div>}

                                        </div>
                                    </div>

                                    {/* Request Details */}
                                    <div className="space-y-3">
                                        {referral.resume && <div>
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                                    <label className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">
                                                        Resume
                                                    </label>
                                                    <a href={referral.resume} download className="te-btn-secondary te-btn-sm justify-center">

                                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                                        Download Resume
                                                    </a>
                                                </div>
                                                <a href={getViewableResumeUrl(referral.resume)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--te-text)] hover:text-[var(--te-text)] font-medium">

                                                    <DocumentTextIcon className="h-4 w-4" />
                                                    View Resume
                                                </a>
                                            </div>}


                                        {referral.essay && <div>
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                                    <label className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em] flex items-center gap-2">
                                                        <DocumentDuplicateIcon className="h-4 w-4" />
                                                        Referral Essay
                                                    </label>
                                                    <button onClick={() => copyToClipboard(referral.essay, 'essay')} className="te-btn-secondary te-btn-sm justify-center">

                                                        {copiedField === 'essay' ? <>
                                                                <CheckCircleIcon className="h-4 w-4" />
                                                                Copied!
                                                            </> : <>
                                                                <ClipboardDocumentIcon className="h-4 w-4" />
                                                                Copy Essay
                                                            </>}

                                                    </button>
                                                </div>
                                                <div className="te-card p-3 sm:p-4 max-h-48 overflow-y-auto te-scroll">
                                                    <p className="text-sm text-[var(--te-text-dim)] leading-relaxed whitespace-pre-wrap">
                                                        {referral.essay}
                                                    </p>
                                                </div>
                                            </div>}


                                        <div>
                                            <label className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em] flex items-center gap-2">
                                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                                Request Note
                                            </label>
                                            <div className="mt-2 te-panel p-3 sm:p-4">
                                                <p className="text-sm text-[var(--te-text-dim)] leading-relaxed">
                                                    {referral.request_note || 'No note provided'}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em] flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4" />
                                                Submission Date
                                            </label>
                                            <p className="mt-2 text-sm font-semibold text-[var(--te-text-dim)]">{referral.date}</p>
                                        </div>
                                    </div>

                                    {/* Management Section */}
                                    <div className="border-t border-[var(--te-border)] pt-4 sm:pt-6 space-y-4">
                                        <div>
                                            <h3 className="text-sm font-display font-bold text-[var(--te-text)] mb-1">Review & Update Status</h3>
                                            <p className="text-xs text-[var(--te-text-dim)]">Update the status and add feedback notes for this referral request</p>
                                        </div>

                                        <SelectCombobox label="Status" options={statusOptions} value={status} onChange={setStatus} placeholder="Select status..." required={true} />


                                        <FormTextArea label="Review Note" field="review_note" value={reviewNote} handleInputChange={({
                    value
                  }) => setReviewNote(value)} required={false} placeholder="Add any notes about your decision..." />


                                        {/* Current Status Display */}
                                        <div className="te-panel p-3">
                                            <p className="text-xs text-[var(--te-text-dim)] mb-2">Current Status</p>
                                            <span className={`te-chip ${getStatusColor(referral.status)}`}>
                                                {referral.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex flex-col-reverse items-stretch justify-end gap-2 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)] px-3 py-3 sm:flex-row sm:items-center sm:px-6 sm:py-4">
                                    <button onClick={() => setIsOpen(false)} className="te-btn-secondary" disabled={isSubmitting}>

                                        Cancel
                                    </button>
                                    <button onClick={handleSubmit} disabled={isSubmitting} className="te-btn-primary justify-center">

                                        {isSubmitting ? <>
                                                <div className="animate-spin h-4 w-4 border border-[var(--te-on-primary)] border-t-transparent rounded-md" />
                                                Updating...
                                            </> : <>
                                                <CheckCircleIcon className="h-5 w-5" />
                                                Update
                                            </>}

                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>;
};
export default ReferralManagement;
