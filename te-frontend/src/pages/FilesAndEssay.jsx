import { useState, useEffect } from "react";
import ReferralEssay from "../components/file/ReferralEssay";
import { PlusIcon, PaperClipIcon, BriefcaseIcon } from '@heroicons/react/20/solid'
import { TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import FileCreate from "../components/file/FileCreate";
import EmptyResumes from "../components/_custom/Alert/EmptyResumes";
import SignInPrompt from "../components/_custom/Alert/SignInPrompt";
import ConfirmDialog from "../components/_custom/Alert/ConfirmDialog";
import axiosInstance from "../axiosConfig";

const Files = () => {
    const { userId, accessToken, userRole } = useAuth();
    const { resumes, setFetchFiles } = useData();

    // UserRoles: Guest=0, Member=1, Lead=2, Admin=3
    const isMember = userRole && parseInt(userRole) === 1; // Only Members can upload resumes/essays

    const [addFile, setAddFile] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [deletingFileId, setDeletingFileId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, fileId: null, fileName: '' });
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);

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
            await axiosInstance.delete(`/users/${userId}/files/${fileId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            // Refresh the files list
            setFetchFiles(true);
        } catch (error) {
            console.error("Delete error:", error);
            alert(`Failed to delete resume: ${error.response?.data?.detail || error.message}`);
        } finally {
            setDeletingFileId(null);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/resume-reviews', reviewFormData, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            alert('Resume review request submitted successfully!');
            setReviewFormData({
                resume_link: '',
                job_title: '',
                level: 'Intern',
                notes: ''
            });
            setShowReviewModal(false);
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Failed to submit request. Please try again.');
        }
    };



    return (
        <div className="dark:bg-gray-950">
            <header className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1.5">
                            Resumes & Referral Essays
                        </h1>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                            Manage your resumes, cover letters, and referral essays
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex mx-6">
                <div className="w-full lg:grid lg:grid-cols-12 lg:gap-x-8">
                    {/* Referral Essay Section */}
                    <div className="pb-24 sm:pb-32 lg:col-span-5 lg:px-0 lg:pb-56 h-screen">
                        <div className="mt-6 text-sm sm:w-96 lg:w-72 xl:w-96 mx-auto text-gray-600 dark:text-gray-300">
                            <ReferralEssay isMember={isMember} />
                        </div>
                    </div>

                    {/* Resumes Section */}
                    <div className="w-full lg:col-span-7 xl:relative xl:inset-0 xl:mr-6 h-screen">
                        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Resumes</h2>
                            {isMember && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium rounded-xl hover:shadow-lg hover:from-purple-700 hover:to-pink-700 active:scale-95 transition-all duration-200"
                                        onClick={() => setShowReviewModal(true)}
                                    >
                                        <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
                                        Request Review
                                    </button>
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-medium rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 active:scale-95 transition-all duration-200"
                                        onClick={() => setAddFile(true)}
                                    >
                                        <PlusIcon className="h-4 w-4" aria-hidden="true" />
                                        Upload Resume
                                    </button>
                                </div>
                            )}
                        </header>

                        <div className="px-4 py-6 sm:col-span-2 sm:px-0">
                            {resumes.length === 0 ? (
                                <EmptyResumes onUploadClick={() => isMember && setAddFile(true)} isMember={isMember} />
                            ) : (
                                <div className="space-y-3">
                                    {resumes.map((resume) => (
                                        <div
                                            key={resume.id}
                                            className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Left Section: Icon + Details */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {/* File Icon */}
                                                    <div className="p-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg group-hover:from-blue-100 group-hover:to-cyan-100 dark:group-hover:from-blue-900/40 dark:group-hover:to-cyan-900/40 transition-all">
                                                        <PaperClipIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                                                    </div>

                                                    {/* Resume Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h3 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                                                {resume.name}
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px]">
                                                            <div className="flex items-center gap-1.5">
                                                                <BriefcaseIcon className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                                                                <span className="font-medium text-blue-600 dark:text-blue-400 truncate">
                                                                    {resume.role}
                                                                </span>
                                                            </div>
                                                            {resume.uploadDate && (
                                                                <>
                                                                    <span className="text-gray-400 dark:text-gray-500">•</span>
                                                                    <span className="text-gray-500 dark:text-gray-300">{new Date(resume.uploadDate).toLocaleDateString()}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {resume.notes && (
                                                            <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1.5 line-clamp-1">
                                                                {resume.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Section: Actions */}
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <a
                                                        href={resume.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-medium rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                                                    >
                                                        View
                                                    </a>
                                                    {isMember && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteClick(resume.id, resume.name)}
                                                            disabled={deletingFileId === resume.id}
                                                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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

        </div>
    )
}

export default Files;
