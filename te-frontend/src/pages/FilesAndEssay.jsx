import { useState, useEffect } from "react";
import ReferralEssay from "../components/file/ReferralEssay";
import ResumeReviews from "./ResumeReviews";
import { PlusIcon, PaperClipIcon } from '@heroicons/react/20/solid'
import { TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import FileCreate from "../components/file/FileCreate";
import EmptyResumes from "../components/_custom/Alert/EmptyResumes";
import SignInPrompt from "../components/_custom/Alert/SignInPrompt";
import ConfirmDialog from "../components/_custom/Alert/ConfirmDialog";
import axiosInstance from "../axiosConfig";
import { trackEvent } from "../analytics/events";

const Files = () => {
    const { userId, accessToken, userRole } = useAuth();
    const { resumes, setFetchFiles } = useData();

    // UserRoles: Guest=0, Member=1, Lead=2, Admin=3
    const isMember = userRole && parseInt(userRole) === 1; // Only Members can upload resumes/essays

    const [activeTab, setActiveTab] = useState('resumes');
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

            // Track resume review request
            trackEvent.resumeReviewRequested({
                job_title: reviewFormData.job_title,
                level: reviewFormData.level,
                has_notes: !!reviewFormData.notes,
                resume_link: reviewFormData.resume_link,
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
                    {/* Referral Essay Section */}
                    <div className="lg:col-span-5 mb-6 lg:mb-0">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/50 p-6 transition-colors">
                            <ReferralEssay isMember={isMember} />
                        </div>
                    </div>

                    {/* Main Content Section with Tabs */}
                    <div className="lg:col-span-7">
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
                                    {resumes.length === 0 ? (
                                        <EmptyResumes />
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                            <div className="flex items-center gap-2">
                                                                <DocumentTextIcon className="h-4 w-4" />
                                                                Resume Name
                                                            </div>
                                                        </th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {resumes.map((file) => (
                                                        <tr
                                                            key={file.id}
                                                            className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all duration-150 group"
                                                        >
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                                        <PaperClipIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                                    </div>
                                                                    <div>
                                                                        <a
                                                                            href={file.link}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                        >
                                                                            {file.name}
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <button
                                                                    onClick={() => handleDeleteClick(file.id, file.name)}
                                                                    disabled={deletingFileId === file.id}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {deletingFileId === file.id ? (
                                                                        <>
                                                                            <div className="animate-spin h-3 w-3 border-2 border-red-700 dark:border-red-400 border-t-transparent rounded-full" />
                                                                            Deleting...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <TrashIcon className="h-4 w-4" />
                                                                            Delete
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
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
