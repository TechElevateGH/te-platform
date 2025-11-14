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

const Files = () => {
    const { userId, accessToken, userRole } = useAuth();
    const { resumes, setFetchFiles, userInfo } = useData();

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
            await axiosInstance.delete(`/users/${userId}/resumes/${fileId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Refresh the files list
            setFetchFiles(true);
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
            await axiosInstance.patch(`/users/${userId}/resumes/${resume.id}`,
                { name: trimmedName },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            setToast({ message: 'Resume name updated.', type: 'success' });
            setFetchFiles(true);
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
            await axiosInstance.patch(`/users/${userId}/resumes/${resume.id}`,
                { archived: !resume.archived },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            setFetchFiles(true);
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



    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900/50 transition-colors">
            {/* Premium Header */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Resumes & Essays</h1>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Manage your resumes, cover letters, and referral essays</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Modern Tab Switcher */}
                            <div className="inline-flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setActiveTab('resumes')}
                                    className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'resumes'
                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <span className="relative z-10">My Resumes</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`relative px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'reviews'
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 dark:shadow-purple-500/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <span className="relative z-10">Resume Reviews</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                <div className="lg:grid lg:grid-cols-12 lg:gap-6">
                    {/* Main Content Section with Tabs - now on the left */}
                    <div className="lg:col-span-7 mb-6 lg:mb-0">
                        {/* Tab Content */}
                        {activeTab === 'resumes' ? (
                            <div className="space-y-4">
                                {/* Header with Actions */}
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 p-4 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">My Resumes</h2>
                                        {isMember && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg text-xs"
                                                    onClick={() => setShowReviewModal(true)}
                                                >
                                                    <DocumentTextIcon className="h-4 w-4" />
                                                    <span>Request Review</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg text-xs"
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
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 overflow-hidden transition-colors">
                                    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100/40 dark:from-gray-800 dark:to-gray-900/30">
                                        <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800/80 p-1 border border-gray-200/70 dark:border-gray-700/70">
                                            <button
                                                type="button"
                                                onClick={() => setResumeView('active')}
                                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${resumeView === 'active'
                                                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-300 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                                    }`}
                                            >
                                                Active
                                                <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 text-[11px] font-bold">
                                                    {activeResumesCount}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResumeView('archived')}
                                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${resumeView === 'archived'
                                                    ? 'bg-white dark:bg-gray-900 text-amber-600 dark:text-amber-200 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                                    }`}
                                                title={!hasArchivedResumes ? 'No archived resumes yet' : undefined}
                                            >
                                                Archived
                                                <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5 text-[11px] font-bold">
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
                                                <div className="px-6 py-10 text-center text-sm text-gray-600 dark:text-gray-400 space-y-3">
                                                    <p>All of your resumes are currently archived.</p>
                                                    {isMember && (
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 shadow hover:from-blue-700 hover:to-cyan-700 transition-all"
                                                            onClick={() => setAddFile(true)}
                                                        >
                                                            <PlusIcon className="h-4 w-4" />
                                                            Upload New Resume
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <div className="px-6 py-10 text-center text-sm text-gray-600 dark:text-gray-400">
                                                <p>No archived resumes yet. Archive a resume to keep it accessible without cluttering your active list.</p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 border-b border-gray-200 dark:border-gray-700">
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
                                                                className={`hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all duration-150 group ${!isEditing ? 'cursor-pointer' : ''}`}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                                            <PaperClipIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                                        </div>
                                                                        <div className="flex-1 space-y-2">
                                                                            {isEditing ? (
                                                                                <>
                                                                                    <input
                                                                                        type="text"
                                                                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                                        value={editedResumeName}
                                                                                        onChange={(event) => setEditedResumeName(event.target.value)}
                                                                                        autoFocus
                                                                                    />
                                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleRenameSubmit(file)}
                                                                                            disabled={isUpdating}
                                                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                                        >
                                                                                            {isUpdating ? (
                                                                                                <>
                                                                                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
                                                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
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
                                                                                            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                                        >
                                                                                            {file.name}
                                                                                        </a>
                                                                                        {file.archived && (
                                                                                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5 text-[11px] font-semibold">
                                                                                                Archived
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
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
                                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed"
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
                                                                                    ? 'text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/40'
                                                                                    : 'text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-200 dark:bg-blue-900/30'}
                                                                                `}
                                                                            >
                                                                                {isUpdating ? (
                                                                                    <>
                                                                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
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
                                                                                        <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
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
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                        <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                                        {userInfo?.cover_letter && userInfo.cover_letter !== "" ? (
                                            <div className="space-y-3">
                                                <div className="max-h-60 overflow-y-auto">
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                        {userInfo.cover_letter}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(userInfo.cover_letter);
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                                    >
                                                        <ClipboardIcon className="h-4 w-4" />
                                                        Copy
                                                    </button>
                                                    {isMember && (
                                                        <button
                                                            onClick={() => setExpandedCoverLetter(false)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                                                        onClick={() => setExpandedCoverLetter(false)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all"
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
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                                        <UserIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Referral Essay</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {userInfo?.essay ? 'Third person - used for referral requests' : 'No referral essay added'}
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
                                        {userInfo?.essay && userInfo.essay !== "" ? (
                                            <div className="space-y-3">
                                                <div className="max-h-60 overflow-y-auto">
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                        {userInfo.essay}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(userInfo.essay);
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                                                    >
                                                        <ClipboardIcon className="h-4 w-4" />
                                                        Copy
                                                    </button>
                                                    {isMember && (
                                                        <button
                                                            onClick={() => setExpandedReferralEssay(false)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
                                                        onClick={() => setExpandedReferralEssay(false)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all"
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
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-2xl">
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
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">
                                            Important: Grant Edit Access
                                        </h3>
                                        <p className="text-xs text-purple-800 dark:text-purple-300">
                                            Please ensure <span className="font-semibold">info@techelevate.org</span> has <span className="font-semibold">Edit access</span> to your Google Doc so our reviewers can add comments and suggestions directly to your resume.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Google Docs Resume Link *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={reviewFormData.resume_link}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, resume_link: e.target.value })}
                                    placeholder="https://docs.google.com/document/d/..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Target Job Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={reviewFormData.job_title}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, job_title: e.target.value })}
                                    placeholder="e.g., Software Engineer, Data Analyst"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Experience Level *
                                </label>
                                <select
                                    required
                                    value={reviewFormData.level}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, level: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="Intern">Intern</option>
                                    <option value="Entry Level">Entry Level (0-2 years)</option>
                                    <option value="Mid Level">Mid Level (3-5 years)</option>
                                    <option value="Senior Level">Senior Level (6-10 years)</option>
                                    <option value="Lead/Principal">Lead/Principal (10+ years)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    value={reviewFormData.notes}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, notes: e.target.value })}
                                    placeholder="Any specific areas you'd like feedback on?"
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
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
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <PaperClipIcon className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedResume.name}</h2>
                                        <p className="text-sm text-blue-100">Resume Details</p>
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
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedResume.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                <a
                                    href={selectedResume.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
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
                                                : 'text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
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

export default Files;
