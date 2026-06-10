import { useState, useEffect } from "react";
import ResumeReviews from "./ResumeReviews";
import { PlusIcon, PaperClipIcon, CheckIcon, XMarkIcon, ChevronDownIcon, ClipboardIcon, UserIcon, EyeIcon } from 'icons'
import { TrashIcon, DocumentTextIcon, PencilSquareIcon, ArchiveBoxIcon, ArrowUturnLeftIcon } from 'icons'
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
                { "essay": referralEssayText },
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
        <div className="min-h-screen bg-[var(--te-bg)] text-[var(--te-text)]">
            <div className="border-b border-[var(--te-border)] bg-[var(--te-surface)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <span className="te-eyebrow">{'// resumes'}</span>
                            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--te-text)] sm:text-4xl">
                                Resumes & Essays
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--te-text-dim)]">
                                Manage targeted resume files, cover letters, referral essays, and review requests in one clean workspace.
                            </p>
                        </div>
                        <div className="flex flex-col items-stretch gap-3 sm:items-end">
                            {isMember && (
                                <button
                                    type="button"
                                    className="te-btn-primary gap-2"
                                    onClick={() => setAddFile(true)}
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Upload Resume
                                </button>
                            )}
                            <div className="inline-flex items-center border border-[var(--te-border)] bg-[var(--te-surface)] p-1">
                                <button
                                    onClick={() => setActiveTab('resumes')}
                                    className={`px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${activeTab === 'resumes'
                                        ? 'bg-[var(--te-green-soft)] text-[var(--te-green)]'
                                        : 'text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] hover:text-[var(--te-green)]'
                                        }`}
                                >
                                    Files
                                </button>
                                <button
                                    onClick={() => setActiveTab('reviews')}
                                    className={`px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${activeTab === 'reviews'
                                        ? 'bg-[var(--te-green-soft)] text-[var(--te-green)]'
                                        : 'text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] hover:text-[var(--te-green)]'
                                        }`}
                                >
                                    Reviews
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                <div className="lg:grid lg:grid-cols-12 lg:gap-6">
                    {/* Main Content Section with Tabs - now on the left */}
                    <div className="lg:col-span-7 mb-6 lg:mb-0">
                        {/* Tab Content */}
                        {activeTab === 'resumes' ? (
                            <div className="space-y-4">
                                {/* Header with Actions */}
                                <div className="te-card p-5">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <span className="te-eyebrow">{'// files'}</span>
                                            <h2 className="mt-2 font-display text-xl font-bold text-[var(--te-text)]">Resume library</h2>
                                        </div>
                                        {isMember && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="te-btn-primary te-btn-sm gap-1.5"
                                                    onClick={() => setShowReviewModal(true)}
                                                >
                                                    <DocumentTextIcon className="h-4 w-4" />
                                                    <span>Request Review</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="te-btn-primary te-btn-sm gap-1.5"
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
                                <div className="te-card overflow-hidden">
                                    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                        <div className="inline-flex items-center gap-1 rounded-lg bg-[var(--te-surface)] p-1 border border-[var(--te-border)]">
                                            <button
                                                type="button"
                                                onClick={() => setResumeView('active')}
                                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${resumeView === 'active'
                                                    ? 'bg-[var(--te-green-soft)] text-[var(--te-green)]'
                                                    : 'text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] hover:text-[var(--te-green)]'
                                                    }`}
                                            >
                                                Active
                                                <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${resumeView === 'active'
                                                    ? 'bg-[var(--te-surface)] text-[var(--te-green)]'
                                                    : 'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)]'
                                                    }`}>
                                                    {activeResumesCount}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setResumeView('archived')}
                                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${resumeView === 'archived'
                                                    ? 'bg-[var(--te-green-soft)] text-[var(--te-green)]'
                                                    : 'text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] hover:text-[var(--te-green)]'
                                                    }`}
                                                title={!hasArchivedResumes ? 'No archived resumes yet' : undefined}
                                            >
                                                Archived
                                                <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${resumeView === 'archived'
                                                    ? 'bg-[var(--te-surface)] text-[var(--te-green)]'
                                                    : 'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)]'
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
                                                <div className="px-6 py-10 text-center text-sm text-[var(--te-text)] space-y-3">
                                                    <p>All of your resumes are currently archived.</p>
                                                    {isMember && (
                                                        <button
                                                            type="button"
                                                            className="te-btn-primary te-btn-sm gap-1.5"
                                                            onClick={() => setAddFile(true)}
                                                        >
                                                            <PlusIcon className="h-4 w-4" />
                                                            Upload New Resume
                                                        </button>
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <div className="px-6 py-10 text-center text-sm text-[var(--te-text)]">
                                                <p>No archived resumes yet. Archive a resume to keep it accessible without cluttering your active list.</p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="grid grid-cols-1 gap-px border-t border-[var(--te-border)] bg-[var(--te-border)] sm:grid-cols-2">
                                            {displayedResumes.map((file) => {
                                                const isEditing = editingResumeId === file.id;
                                                const isUpdating = updatingResumeId === file.id;
                                                const isDeleting = deletingFileId === file.id;
                                                const disableOtherActions = Boolean(editingResumeId) && !isEditing;

                                                return (
                                                    <article
                                                        key={file.id}
                                                        onClick={() => {
                                                            if (!isEditing) {
                                                                setSelectedResume(file);
                                                                setShowResumeModal(true);
                                                            }
                                                        }}
                                                        className={`group bg-[var(--te-surface)] p-5 transition-colors hover:bg-[var(--te-hover)] ${!isEditing ? 'cursor-pointer' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center border border-[var(--te-gold)] bg-[var(--te-gold-soft)]">
                                                                <PaperClipIcon className="h-5 w-5 text-[var(--te-gold)]" />
                                                            </div>
                                                            <div className="min-w-0 flex-1 space-y-3">
                                                                {isEditing ? (
                                                                    <>
                                                                        <input
                                                                            type="text"
                                                                            className="te-input font-semibold"
                                                                            value={editedResumeName}
                                                                            onChange={(event) => setEditedResumeName(event.target.value)}
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRenameSubmit(file)}
                                                                                disabled={isUpdating}
                                                                                className="te-btn-primary te-btn-sm gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                            >
                                                                                {isUpdating ? 'Saving...' : (<><CheckIcon className="h-4 w-4" />Save</>)}
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={handleRenameCancel}
                                                                                disabled={isUpdating}
                                                                                className="te-btn-secondary te-btn-sm gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                            >
                                                                                <XMarkIcon className="h-4 w-4" />
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div className="min-w-0">
                                                                                <a
                                                                                    href={file.link}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    className="te-link break-words font-semibold"
                                                                                >
                                                                                    {file.name}
                                                                                </a>
                                                                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-[var(--te-text-dim)]">
                                                                                    <span>{file.date || 'No date'}</span>
                                                                                    {file.role && <span>{file.role}</span>}
                                                                                    {file.archived && <span className="te-chip text-[11px]">Archived</span>}
                                                                                </div>
                                                                            </div>
                                                                            <a
                                                                                href={file.link}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="te-icon-btn flex-shrink-0"
                                                                                title="View resume"
                                                                            >
                                                                                <EyeIcon className="h-4 w-4" />
                                                                            </a>
                                                                        </div>
                                                                        {file.notes && (
                                                                            <p className="line-clamp-2 text-sm leading-6 text-[var(--te-text-dim)]">
                                                                                {file.notes}
                                                                            </p>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {canDelete && (
                                                            <div className="mt-4 flex items-center justify-end gap-2 border-t border-[var(--te-border)] pt-4" onClick={(e) => e.stopPropagation()}>
                                                                {!isEditing && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRenameClick(file)}
                                                                        disabled={disableOtherActions || isUpdating || isDeleting}
                                                                        className="te-icon-btn disabled:opacity-60 disabled:cursor-not-allowed"
                                                                        title="Rename"
                                                                    >
                                                                        <PencilSquareIcon className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleArchiveToggle(file)}
                                                                    disabled={isUpdating || isDeleting}
                                                                    className="te-icon-btn disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    title={file.archived ? 'Restore' : 'Archive'}
                                                                >
                                                                    {file.archived ? <ArrowUturnLeftIcon className="h-4 w-4" /> : <ArchiveBoxIcon className="h-4 w-4" />}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteClick(file.id, file.name)}
                                                                    disabled={isDeleting || isUpdating}
                                                                    className="te-icon-btn disabled:opacity-60 disabled:cursor-not-allowed"
                                                                    title="Delete"
                                                                >
                                                                    <TrashIcon className="h-4 w-4 text-[var(--te-red)]" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </article>
                                                );
                                            })}
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
                        <div className="te-card overflow-hidden">
                            <button
                                onClick={() => setExpandedCoverLetter(!expandedCoverLetter)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--te-hover)] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center border border-[var(--te-green)] bg-[var(--te-green-soft)]">
                                        <DocumentTextIcon className="h-5 w-5 text-[var(--te-green)]" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-display text-sm font-bold text-[var(--te-text)]">Cover Letter</h3>
                                        <p className="text-xs text-[var(--te-text-dim)]">
                                            {userInfo?.cover_letter ? 'First person - for job applications' : 'No cover letter added'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDownIcon
                                    className={`h-5 w-5 text-[var(--te-text-dim)] transition-transform duration-200 ${expandedCoverLetter ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {expandedCoverLetter && (
                                <div className="px-6 pb-6 border-t border-[var(--te-border)]">
                                    <div className="pt-4">
                                        {editingCoverLetter ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={coverLetterText}
                                                    onChange={(e) => setCoverLetterText(e.target.value)}
                                                    placeholder="Write your cover letter in first person (I, me, my)..."
                                                    rows="10"
                                                    className="te-textarea resize-none"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleSaveCoverLetter}
                                                        className="te-btn-primary gap-1.5"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingCoverLetter(false)}
                                                        className="te-btn-secondary gap-1.5"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : userInfo?.cover_letter && userInfo.cover_letter !== "" ? (
                                            <div className="space-y-3">
                                                <div className="max-h-60 overflow-y-auto">
                                                    <p className="text-sm text-[var(--te-text)] leading-relaxed whitespace-pre-wrap">
                                                        {userInfo.cover_letter}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(userInfo.cover_letter);
                                                            setToast({ message: 'Cover letter copied to clipboard!', type: 'success' });
                                                        }}
                                                        className="te-btn-primary te-btn-sm gap-1.5"
                                                    >
                                                        <ClipboardIcon className="h-4 w-4" />
                                                        Copy
                                                    </button>
                                                    {isMember && (
                                                        <button
                                                            onClick={() => setEditingCoverLetter(true)}
                                                            className="te-btn-secondary te-btn-sm gap-1.5"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-xs text-[var(--te-text-dim)] mb-3">
                                                    Write in first person (I, me, my)
                                                </p>
                                                {isMember && (
                                                    <button
                                                        onClick={() => setEditingCoverLetter(true)}
                                                        className="te-btn-primary te-btn-sm gap-1.5"
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
                        <div className="te-card overflow-hidden">
                            <button
                                onClick={() => setExpandedReferralEssay(!expandedReferralEssay)}
                                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[var(--te-hover)] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center border border-[var(--te-gold)] bg-[var(--te-gold-soft)]">
                                        <UserIcon className="h-5 w-5 text-[var(--te-gold)]" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-display text-sm font-bold text-[var(--te-text)]">Referral Essay</h3>
                                        <p className="text-xs text-[var(--te-text-dim)]">
                                            {userInfo?.referral_essay ? 'Third person - used for referral requests' : 'No referral essay added'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronDownIcon
                                    className={`h-5 w-5 text-[var(--te-text-dim)] transition-transform duration-200 ${expandedReferralEssay ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {expandedReferralEssay && (
                                <div className="px-6 pb-6 border-t border-[var(--te-border)]">
                                    <div className="pt-4">
                                        {editingReferralEssay ? (
                                            <div className="space-y-3">
                                                <textarea
                                                    value={referralEssayText}
                                                    onChange={(e) => setReferralEssayText(e.target.value)}
                                                    placeholder="Write your referral essay in third person (he, she, they)..."
                                                    rows="10"
                                                    className="te-textarea resize-none"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={handleSaveReferralEssay}
                                                        className="te-btn-primary gap-1.5"
                                                    >
                                                        <CheckIcon className="h-4 w-4" />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingReferralEssay(false)}
                                                        className="te-btn-secondary gap-1.5"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : userInfo?.referral_essay && userInfo.referral_essay !== "" ? (
                                            <div className="space-y-3">
                                                <div className="max-h-60 overflow-y-auto">
                                                    <p className="text-sm text-[var(--te-text)] leading-relaxed whitespace-pre-wrap">
                                                        {userInfo.referral_essay}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(userInfo.referral_essay);
                                                            setToast({ message: 'Referral essay copied to clipboard!', type: 'success' });
                                                        }}
                                                        className="te-btn-secondary te-btn-sm gap-1.5"
                                                    >
                                                        <ClipboardIcon className="h-4 w-4" />
                                                        Copy
                                                    </button>
                                                    {isMember && (
                                                        <button
                                                            onClick={() => setEditingReferralEssay(true)}
                                                            className="te-btn-secondary te-btn-sm gap-1.5"
                                                        >
                                                            <PencilSquareIcon className="h-4 w-4" />
                                                            Edit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-xs text-[var(--te-text-dim)] mb-3">
                                                    Write in third person (he, she, they)
                                                </p>
                                                {isMember && (
                                                    <button
                                                        onClick={() => setEditingReferralEssay(true)}
                                                        className="te-btn-primary te-btn-sm gap-1.5"
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
                        <p className="font-semibold text-[var(--te-text)]">"{confirmDelete.fileName}"?</p>
                        <p className="mt-2 text-xs text-[var(--te-text-dim)]">This action cannot be undone.</p>
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
                    <div className="te-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 border-b border-[var(--te-border)] bg-[var(--te-surface)] px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-display text-xl font-bold text-[var(--te-text)] flex items-center gap-2">
                                    <DocumentTextIcon className="h-6 w-6" />
                                    Request Resume Review
                                </h2>
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="te-icon-btn"
                                >
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
                            {/* Important Info Banner */}
                            <div className="bg-[var(--te-gold-soft)] border border-[var(--te-gold)] rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <svg className="h-5 w-5 text-[var(--te-gold)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-[var(--te-text)] mb-1">
                                            Important: Grant Edit Access
                                        </h3>
                                        <p className="text-xs text-[var(--te-text)]">
                                            Please ensure <span className="font-semibold">info@techelevate.org</span> has <span className="font-semibold">Edit access</span> to your Google Doc so our reviewers can add comments and suggestions directly to your resume.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--te-text)] mb-1.5">
                                    Google Docs Resume Link *
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={reviewFormData.resume_link}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, resume_link: e.target.value })}
                                    placeholder="https://docs.google.com/document/d/..."
                                    className="te-input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--te-text)] mb-1.5">
                                    Target Job Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={reviewFormData.job_title}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, job_title: e.target.value })}
                                    placeholder="e.g., Software Engineer, Data Analyst"
                                    className="te-input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--te-text)] mb-1.5">
                                    Experience Level *
                                </label>
                                <select
                                    required
                                    value={reviewFormData.level}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, level: e.target.value })}
                                    className="te-input"
                                >
                                    <option value="Intern">Intern</option>
                                    <option value="Entry Level">Entry Level (0-2 years)</option>
                                    <option value="Mid Level">Mid Level (3-5 years)</option>
                                    <option value="Senior Level">Senior Level (6-10 years)</option>
                                    <option value="Lead/Principal">Lead/Principal (10+ years)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[var(--te-text)] mb-1.5">
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    value={reviewFormData.notes}
                                    onChange={(e) => setReviewFormData({ ...reviewFormData, notes: e.target.value })}
                                    placeholder="Any specific areas you'd like feedback on?"
                                    rows="3"
                                    className="te-input"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowReviewModal(false)}
                                    className="te-btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="te-btn-primary flex-1"
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
                    <div className="te-panel max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="sticky top-0 border-b border-[var(--te-border)] bg-[var(--te-surface)] px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center border border-[var(--te-gold)] bg-[var(--te-gold-soft)] text-[var(--te-gold)]">
                                        <PaperClipIcon className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <h2 className="font-display text-xl font-bold text-[var(--te-text)]">{selectedResume.name}</h2>
                                        <p className="text-sm text-[var(--te-text-dim)]">Resume Details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowResumeModal(false)}
                                    className="te-icon-btn"
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
                                <h3 className="text-lg font-bold text-[var(--te-text)] mb-4 flex items-center gap-2">
                                    <DocumentTextIcon className="h-5 w-5" />
                                    File Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                        <p className="text-xs font-semibold text-[var(--te-text-dim)] mb-1">File Name</p>
                                        <p className="text-sm font-medium text-[var(--te-text)] break-all">{selectedResume.name}</p>
                                    </div>
                                    <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                        <p className="text-xs font-semibold text-[var(--te-text-dim)] mb-1">Upload Date</p>
                                        <p className="text-sm font-medium text-[var(--te-text)]">{selectedResume.date || 'Not available'}</p>
                                    </div>
                                    {selectedResume.role && (
                                        <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                            <p className="text-xs font-semibold text-[var(--te-text-dim)] mb-1">Target Role</p>
                                            <p className="text-sm font-medium text-[var(--te-text)]">{selectedResume.role}</p>
                                        </div>
                                    )}
                                    <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                        <p className="text-xs font-semibold text-[var(--te-text-dim)] mb-1">Status</p>
                                        <p className="text-sm font-medium text-[var(--te-text)]">
                                            {selectedResume.archived ? (
                                                <span className="te-chip text-xs">
                                                    Archived
                                                </span>
                                            ) : (
                                                <span className="te-chip te-chip-green text-xs">
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
                                    <h3 className="text-lg font-bold text-[var(--te-text)] mb-4">Notes</h3>
                                    <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                        <p className="text-sm text-[var(--te-text)] whitespace-pre-wrap">{selectedResume.notes}</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-4 border-t border-[var(--te-border)] space-y-3">
                                <a
                                    href={selectedResume.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="te-btn-primary w-full gap-2"
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
                                            className="te-btn-secondary gap-2"
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
                                            className="te-btn-danger gap-2"
                                        >
                                            <TrashIcon className="h-4 w-4 text-[var(--te-red)]" />
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
