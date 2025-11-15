import { useState, useEffect } from "react";
import ResumeReviews from "./ResumeReviews";
import { PlusIcon, PaperClipIcon, CheckIcon, XMarkIcon, ChevronDownIcon, ClipboardIcon, UserIcon } from '@heroicons/react/20/solid'
import { TrashIcon, DocumentTextIcon, PencilSquareIcon, ArchiveBoxIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline'
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import FileCreate from "../components/file/FileCreate";
import EmptyResumes from "../components/_custom/Alert/EmptyResumes";
import SignInPrompt from "../components/_custom/Alert/SignInPrompt";
import ConfirmDialog from "../components/_custom/Alert/ConfirmDialog";
import Toast from "../components/_custom/Toast";
import axiosInstance from "../axiosConfig";
import { trackEvent } from "../analytics/events";

const ResumesAndEssays = () => {
    const { userId, accessToken, userRole } = useAuth();
    const { resumes, setFetchResumes, userInfo } = useData();

    // UserRoles: Guest=0, Member=1, Referrer=2, Volunteer=3, Lead=4, Admin=5
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const isMember = userRoleInt === 1; // Only Members can upload resumes/essays
    const canDelete = [1, 4, 5].includes(userRoleInt); // Member, Lead, or Admin can delete

    const [activeTab, setActiveTab] = useState('resumes');
    const [addFile, setAddFile] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [deletingFileId, setDeletingFileId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, fileId: null, fileName: '' });
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);
    const [toast, setToast] = useState(null);
    const [resumeView, setResumeView] = useState('active');
    const [editingResumeId, setEditingResumeId] = useState(null);
    const [editedResumeName, setEditedResumeName] = useState('');
    const [updatingResumeId, setUpdatingResumeId] = useState(null);

    // Essay expansion state
    const [expandedCoverLetter, setExpandedCoverLetter] = useState(false);
    const [expandedReferralEssay, setExpandedReferralEssay] = useState(false);

    // Essay inline editing states
    const [editingCoverLetter, setEditingCoverLetter] = useState(false);
    const [editingReferralEssay, setEditingReferralEssay] = useState(false);
    const [coverLetterText, setCoverLetterText] = useState('');
    const [referralEssayText, setReferralEssayText] = useState('');

    // Resume details modal
    const [selectedResume, setSelectedResume] = useState(null);
    const [showResumeModal, setShowResumeModal] = useState(false);

    // Resume Review Form Data
    const [reviewFormData, setReviewFormData] = useState({
        resume_link: '',
        job_title: '',
        level: 'Intern',
        notes: ''
    });

    // Check if user is authenticated
    useEffect(() => {
        if (!accessToken) {
            setShowSignInPrompt(true);
        }
    }, [accessToken]);

    const handleDeleteClick = (fileId, fileName) => {
        setConfirmDelete({ isOpen: true, fileId, fileName });
    };

    const handleDeleteConfirm = async () => {
        const { fileId } = confirmDelete;
        setDeletingFileId(fileId);

        try {
            await axiosInstance.delete(`/resumes/${fileId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    user_id: userId
                }
            });

            // Refresh the files list
            setFetchResumes(true);
        } catch (error) {
            console.error("Delete error:", error);
            setToast({ message: `Failed to delete file: ${error.response?.data?.detail || error.message}`, type: "error" });
        } finally {
            setDeletingFileId(null);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/resumes/reviews', reviewFormData, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            // Track resume review request
            trackEvent.resumeReviewRequested({
                job_title: reviewFormData.job_title,
                level: reviewFormData.level,
                has_notes: !!reviewFormData.notes,
                resume_link: reviewFormData.resume_link,
            });

            setToast({ message: 'Resume review request submitted successfully!', type: 'success' });
            setReviewFormData({
                resume_link: '',
                job_title: '',
                level: 'Intern',
                notes: ''
            });
            setShowReviewModal(false);
        } catch (error) {
            console.error('Error submitting request:', error);
            setToast({ message: 'Failed to submit request. Please try again.', type: 'error' });
        }
    };

    const displayedResumes = (resumes || []).filter((resume) =>
        resumeView === 'archived' ? resume.archived : !resume.archived
    );

    const activeResumesCount = (resumes || []).filter((resume) => !resume.archived).length;
    const archivedResumesCount = (resumes || []).filter((resume) => resume.archived).length;
    const hasActiveResumes = activeResumesCount > 0;
    const hasArchivedResumes = archivedResumesCount > 0;

    const handleRenameClick = (resume) => {
        setEditingResumeId(resume.id);
        setEditedResumeName(resume.name || '');
    };

    const handleRenameCancel = () => {
        setEditingResumeId(null);
        setEditedResumeName('');
    };

    const handleRenameSubmit = async (resume) => {
        const trimmedName = editedResumeName.trim();
        if (!trimmedName) {
            setToast({ message: 'Resume name cannot be empty.', type: 'error' });
            return;
        }

        if (trimmedName === (resume.name || '')) {
            handleRenameCancel();
            return;
        }

        setUpdatingResumeId(resume.id);
        try {
            await axiosInstance.patch(`/resumes/${resume.id}`,
                { name: trimmedName },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    params: {
                        user_id: userId
                    }
                }
            );
            setToast({ message: 'Resume name updated.', type: 'success' });
            setFetchResumes(true);
            setEditingResumeId(null);
            setEditedResumeName('');
        } catch (error) {
            console.error('Rename error:', error);
            setToast({ message: `Failed to rename resume: ${error.response?.data?.detail || error.message}`, type: 'error' });
        } finally {
            setUpdatingResumeId(null);
        }
    };

    const handleArchiveToggle = async (resume) => {
        setUpdatingResumeId(resume.id);
        try {
            await axiosInstance.patch(`/resumes/${resume.id}`,
                { archived: !resume.archived },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    params: {
                        user_id: userId
                    }
                }
            );
            setFetchResumes(true);
            setToast({
                message: resume.archived ? 'Resume restored.' : 'Resume archived.',
                type: 'success',
            });
            handleRenameCancel();
        } catch (error) {
            console.error('Archive error:', error);
            setToast({ message: `Unable to update resume status: ${error.response?.data?.detail || error.message}`, type: 'error' });
        } finally {
            setUpdatingResumeId(null);
        }
    };

    useEffect(() => {
        handleRenameCancel();
    }, [resumeView]);

    // Handle cover letter save
    const handleSaveCoverLetter = async () => {
        try {
            await axiosInstance.post(`/users/${userId}/cover-letter`,
                { "cover_letter": coverLetterText },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setToast({ message: 'Cover letter saved successfully!', type: 'success' });
            setEditingCoverLetter(false);
            setFetchResumes(true); // Refresh user info
        } catch (error) {
            console.error('Error saving cover letter:', error);
            setToast({ message: 'Failed to save cover letter. Please try again.', type: 'error' });
        }
    };

    // Handle referral essay save
    const handleSaveReferralEssay = async () => {
        try {
            await axiosInstance.post(`/users/${userId}/essay`,
                { "referral_essay": referralEssayText },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setToast({ message: 'Referral essay saved successfully!', type: 'success' });
            setEditingReferralEssay(false);
            setFetchResumes(true); // Refresh user info
        } catch (error) {
            console.error('Error saving referral essay:', error);
            setToast({ message: 'Failed to save referral essay. Please try again.', type: 'error' });
        }
    };

    // Initialize text when entering edit mode
    useEffect(() => {
        if (editingCoverLetter) {
            setCoverLetterText(userInfo?.cover_letter || '');
        }
    }, [editingCoverLetter, userInfo?.cover_letter]);

    useEffect(() => {
        if (editingReferralEssay) {
            setReferralEssayText(userInfo?.referral_essay || '');
        }
    }, [editingReferralEssay, userInfo?.referral_essay]);



    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Professional Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Resumes & Essays</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your resumes, cover letters, and referral essays</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Modern Tab Switcher */}
                            <div className="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-lg">
                                <button
                                    onClick={() => setActiveTab('resumes')}
                                    className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'resumes'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    My Resumes
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${activeTab === 'reviews'
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    Resume Reviews
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="lg:grid lg:grid-cols-12 lg:gap-6">
                    {/* Main Content Section with Tabs - now on the left */}
                    <div className="lg:col-span-7 mb-6 lg:mb-0">
                        {/* Tab Content */}
                        {activeTab === 'resumes' ? (
                            <div className="space-y-4">
                                {/* Header with Actions */}
                                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 p-4 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">My Resumes</h2>
                                        {isMember && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-sm text-sm"
                                                    onClick={() => setShowReviewModal(true)}
                                                >
                                                    <DocumentTextIcon className="h-4 w-4" />
                                                    <span>Request Review</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm text-sm"
                                                    onClick={() => setAddFile(true)}
                                                >
                                                    <PlusIcon className="h-4 w-4" />
                                                    <span>Upload Resume</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Resumes List */}
                                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors">
                                    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                                        <div className="inline-flex items-center gap-1 rounded-lg bg-white dark:bg-slate-900 p-1 border border-gray-200 dark:border-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => setResumeView('active')}
                                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${resumeView === 'active'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                Active
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${resumeView === 'active'
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                                    }`}>
                                                    {activeResumesCount}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResumeView('archived')}
                                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${resumeView === 'archived'
                                                    ? 'bg-amber-600 text-white shadow-sm'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                                    }`}
                                                title={!hasArchivedResumes ? 'No archived resumes yet' : undefined}
                                            >
                                                Archived
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${resumeView === 'archived'
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                    }`}>
                                                    {archivedResumesCount}
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {displayedResumes.length === 0 ? (
                                        resumeView === 'active' ? (
                                            hasActiveResumes || resumes.length === 0 ? (
                                                <EmptyResumes onUploadClick={() => setAddFile(true)} />
                                            ) : (
                                                <div className="px-6 py-10 text-center text-sm text-gray-800 dark:text-gray-200 space-y-3">
                                                    <p>All of your resumes are currently archived.</p>
                                                    {isMember && (
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg  hover:shadow-indigo-600 shadow-lg/40 transition-all"
                                                            onClick={() => setAddFile(true)}
                                                        >
                                                            <PlusIcon className="h-4 w-4" />
                                                            Upload New Resume
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <div className="px-6 py-10 text-center text-sm text-gray-800 dark:text-gray-200">
                                                <p>No archived resumes yet. Archive a resume to keep it accessible without cluttering your active list.</p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                            <div className="flex items-center gap-2">
                                                                <DocumentTextIcon className="h-4 w-4" />
                                                                Resume Details
                                                            </div>
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {displayedResumes.map((file) => {
                                                        const isEditing = editingResumeId === file.id;
                                                        const isUpdating = updatingResumeId === file.id;
                                                        const isDeleting = deletingFileId === file.id;
                                                        const disableOtherActions = Boolean(editingResumeId) && !isEditing;

                                                        return (
                                                            <tr
                                                                key={file.id}
                                                                onClick={() => {
                                                                    if (!isEditing) {
                                                                        setSelectedResume(file);
                                                                        setShowResumeModal(true);
                                                                    }
                                                                }}
                                                                className={`hover:bg-gradient-to-r hover:from-indigo-100/40 hover:via-blue-100/40 hover:to-violet-100/40 dark:hover:from-indigo-900/50 dark:hover:via-blue-900/50 dark:hover:to-violet-900/50 transition-all duration-150 group ${!isEditing ? 'cursor-pointer' : ''}`}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-200 dark:bg-indigo-900/60 border  dark: rounded-lg flex items-center justify-center">
                                                                            <PaperClipIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                                        </div>
                                                                        <div className="flex-1 space-y-2">
                                                                            {isEditing ? (
                                                                                <>
                                                                                    <input
                                                                                        type="text"
                                                                                        className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                                                        value={editedResumeName}
                                                                                        onChange={(event) => setEditedResumeName(event.target.value)}
                                                                                        autoFocus
                                                                                    />
                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleRenameSubmit(file)}
                                                                                            disabled={isUpdating}
                                                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white shadow  disabled:opacity-60 disabled:cursor-not-allowed"
                                                                                        >
                                                                                            {isUpdating ? (
                                                                                                <>
                                                                                                    <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                                                                                                    Saving...
                                                                                                </>
                                                                                            ) : (
                                                                                                <>
                                                                                                    <CheckIcon className="h-4 w-4" />
                                                                                                    Save
                                                                                                </>
                                                                                            )}
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={handleRenameCancel}
                                                                                            disabled={isUpdating}
                                                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                                        >
                                                                                            <XMarkIcon className="h-4 w-4" />
                                                                                            Cancel
                                                                                        </button>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                                        <a
                                                                                            href={file.link}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                            className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                                                        >
                                                                                            {file.name}
                                                                                        </a>
                                                                                        {file.archived && (
                                                                                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5 text-[11px] font-semibold">
                                                                                                Archived
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-800 dark:text-gray-200">
                                                                                        <span>Uploaded {file.date || '—'}</span>
                                                                                        {file.role && <span>Target role: {file.role}</span>}
                                                                                        {file.notes && <span className="truncate max-w-[220px] sm:max-w-none">Notes: {file.notes}</span>}
                                                                                    </div>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                                    {canDelete && (
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            {!isEditing && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRenameClick(file)}
                                                                                    disabled={disableOtherActions || isUpdating || isDeleting}
                                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-emerald-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                                >
                                                                                    <PencilSquareIcon className="h-4 w-4" />
                                                                                    Rename
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleArchiveToggle(file)}
                                                                                disabled={isUpdating || isDeleting}
                                                                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed ${file.archived
                                                                                    ? 'bg-gradient-to-r bg-emerald-600 text-white hover:bg-emerald-700'
                                                                                    : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600'}
                                                                                `}
                                                                            >
                                                                                {isUpdating ? (
                                                                                    <>
                                                                                        <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                                                                                        Updating...
                                                                                    </>
                                                                                ) : file.archived ? (
                                                                                    <>
                                                                                        <ArrowUturnLeftIcon className="h-4 w-4" />
                                                                                        Restore
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <ArchiveBoxIcon className="h-4 w-4" />
                                                                                        Archive
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteClick(file.id, file.name)}
                                                                                disabled={isDeleting || isUpdating}
                                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                            >
                                                                                {isDeleting ? (
                                                                                    <>
                                                                                        <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
                                                                                        Deleting...
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <TrashIcon className="h-4 w-4" />
                                                                                        Delete
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <ResumeReviews />
                            </div>
                        )}
                    </div>

                    {/* Essays Section - now on the right with compact expandable cards */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Cover Letter Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 overflow-hidden transition-all">
                            <button
                                onClick={() => setExpandedCoverLetter(!expandedCoverLetter)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                        <DocumentTextIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cover Letter</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {userInfo?.cover_letter ? 'First person - for job applications' : 'No cover letter added'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDownIcon
                                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedCoverLetter ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {expandedCoverLetter && (
                                <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
                                    <div className="pt-4">
                                        {editingCoverLetter ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={coverLetterText}
                                                    onChange={(e) => setCoverLetterText(e.target.value)}
                                                    placeholder="Write your cover letter in first person (I, me, my)..."
                                                    rows="10"
                                                    className="w-full px-4 py-3 border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleSaveCoverLetter}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg  transition-colors shadow-md"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCoverLetter(false)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : userInfo?.cover_letter && userInfo.cover_letter !== "" ? (
                                            <div className="space-y-3">
                                                <div className="max-h-60 overflow-y-auto">
                                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                                        {userInfo.cover_letter}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(userInfo.cover_letter);
                                                            setToast({ message: 'Cover letter copied to clipboard!', type: 'success' });
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-md"
                                                    >
                                                        <ClipboardIcon className="h-4 w-4" />
                                                        Copy
                                                    </button>
                                                    {isMember && (
                                                        <button
                                                            onClick={() => setEditingCoverLetter(true)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-indigo-200 dark:border-indigo-700"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                                    Write in first person (I, me, my)
                                                </p>
                                                {isMember && (
                                                    <button
                                                        onClick={() => setEditingCoverLetter(true)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                        Add Cover Letter
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Referral Essay Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 overflow-hidden transition-all">
                            <button
                                onClick={() => setExpandedReferralEssay(!expandedReferralEssay)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-indigo-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                        <UserIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Referral Essay</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {userInfo?.referral_essay ? 'Third person - used for referral requests' : 'No referral essay added'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDownIcon
                                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${expandedReferralEssay ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {expandedReferralEssay && (
                                <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
                                    <div className="pt-4">
                                        {editingReferralEssay ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={referralEssayText}
                                                    onChange={(e) => setReferralEssayText(e.target.value)}
                                                    placeholder="Write your referral essay in third person (he, she, they)..."
                                                    rows="10"
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleSaveReferralEssay}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg  transition-colors shadow-md"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingReferralEssay(false)}
                                                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : userInfo?.referral_essay && userInfo.referral_essay !== "" ? (
                                            <div className="space-y-3">
                                                <div className="max-h-60 overflow-y-auto">
                                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                                        {userInfo.referral_essay}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(userInfo.referral_essay);
                                                            setToast({ message: 'Referral essay copied to clipboard!', type: 'success' });
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        <ClipboardIcon className="h-4 w-4" />
                                                        Copy
                                                    </button>
                                                    {isMember && (
                                                        <button
                                                            onClick={() => setEditingReferralEssay(true)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-indigo-200 dark:border-indigo-700"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                                    Write in third person (he, she, they)
                                                </p>
                                                {isMember && (
                                                    <button
                                                        onClick={() => setEditingReferralEssay(true)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all"
                                                    >
                                                        <PencilSquareIcon className="h-4 w-4" />
                                                        Add Referral Essay
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {addFile && <FileCreate setFileUpload={setAddFile} />}

            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, fileId: null, fileName: '' })}
                onConfirm={handleDeleteConfirm}
                type="danger"
                title="Delete Resume"
                message={
                    <div>
                        <p className="mb-2">Are you sure you want to delete</p>
                        <p className="font-semibold text-gray-900">"{confirmDelete.fileName}"?</p>
                        <p className="mt-2 text-xs text-gray-500">This action cannot be undone.</p>
                    </div>
                }
                confirmText="Delete Resume"
                cancelText="Cancel"
            />

            <SignInPrompt
                isOpen={showSignInPrompt}
                onClose={() => setShowSignInPrompt(false)}
            />

            {/* Resume Review Request Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <DocumentTextIcon className="h-6 w-6" />
                                    Request Resume Review
                                </h2>
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="text-white hover:bg-white/20 rounded p-1 transition-colors"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
                            {/* Important Info Banner */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                                            Important: Grant Edit Access
                                        </h3>
                                        <p className="text-xs text-blue-800 dark:text-blue-300">
                                            Please ensure <span className="font-semibold">info@techelevate.org</span> has <span className="font-semibold">Edit access</span> to your Google Doc so our reviewers can add comments and suggestions directly to your resume.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                                    Google Docs Resume Link *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={reviewFormData.resume_link}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, resume_link: e.target.value })}
                                    placeholder="https://docs.google.com/document/d/..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                                    Target Job Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={reviewFormData.job_title}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, job_title: e.target.value })}
                                    placeholder="e.g., Software Engineer, Data Analyst"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                                    Experience Level *
                                </label>
                                <select
                                    required
                                    value={reviewFormData.level}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, level: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="Intern">Intern</option>
                                    <option value="Entry Level">Entry Level (0-2 years)</option>
                                    <option value="Mid Level">Mid Level (3-5 years)</option>
                                    <option value="Senior Level">Senior Level (6-10 years)</option>
                                    <option value="Lead/Principal">Lead/Principal (10+ years)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    value={reviewFormData.notes}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, notes: e.target.value })}
                                    placeholder="Any specific areas you'd like feedback on?"
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resume Details Modal */}
            {selectedResume && showResumeModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowResumeModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <PaperClipIcon className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedResume.name}</h2>
                                        <p className="text-sm text-indigo-100">Resume Details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowResumeModal(false)}
                                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* File Information */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <DocumentTextIcon className="h-5 w-5" />
                                    File Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">File Name</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{selectedResume.name}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Upload Date</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedResume.date || 'Not available'}</p>
                                    </div>
                                    {selectedResume.role && (
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Target Role</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedResume.role}</p>
                                        </div>
                                    )}
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Status</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {selectedResume.archived ? (
                                                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-1 text-xs font-semibold">
                                                    Archived
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200 px-2 py-1 text-xs font-semibold">
                                                    Active
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedResume.notes && (
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notes</h3>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{selectedResume.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
                                <a
                                    href={selectedResume.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold  transition-all shadow-lg"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Open Resume
                                </a>
                                {canDelete && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => {
                                                handleArchiveToggle(selectedResume);
                                                setShowResumeModal(false);
                                            }}
                                            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${selectedResume.archived
                                                ? 'text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50'
                                                }`}
                                        >
                                            {selectedResume.archived ? (
                                                <>
                                                    <ArrowUturnLeftIcon className="h-4 w-4" />
                                                    Restore
                                                </>
                                            ) : (
                                                <>
                                                    <ArchiveBoxIcon className="h-4 w-4" />
                                                    Archive
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleDeleteClick(selectedResume.id, selectedResume.name);
                                                setShowResumeModal(false);
                                            }}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-all"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    )
}

export default ResumesAndEssays;
