import { useState, useEffect } from "react";
import ReferralEssay from "../components/file/ReferralEssay";
import { PlusIcon, PaperClipIcon, BriefcaseIcon } from '@heroicons/react/20/solid'
import { TrashIcon } from '@heroicons/react/24/outline'
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
    const [deletingFileId, setDeletingFileId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, fileId: null, fileName: '' });
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);

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



    return (
        <div className="">
            <header className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1.5">
                            Resumes & Referral Essays
                        </h1>
                        <p className="text-xs text-gray-600">
                            Manage your resumes, cover letters, and referral essays
                        </p>
                    </div>
                </div>
            </header>

            <div className="flex mx-6">
                <div className="w-full lg:grid lg:grid-cols-12 lg:gap-x-8">
                    {/* Referral Essay Section */}
                    <div className="pb-24 sm:pb-32 lg:col-span-5 lg:px-0 lg:pb-56 h-screen">
                        <div className="mt-6 text-sm sm:w-96 lg:w-72 xl:w-96 mx-auto text-gray-600">
                            <ReferralEssay isMember={isMember} />
                        </div>
                    </div>

                    {/* Resumes Section */}
                    <div className="w-full lg:col-span-7 xl:relative xl:inset-0 xl:mr-6 h-screen">
                        <header className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
                            <h2 className="text-lg font-semibold text-gray-900">My Resumes</h2>
                            {isMember && (
                                <button
                                    type="button"
                                    className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-medium rounded-xl hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 active:scale-95 transition-all duration-200"
                                    onClick={() => setAddFile(true)}
                                >
                                    <PlusIcon className="h-4 w-4" aria-hidden="true" />
                                    Upload Resume
                                </button>
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
                                            className="group bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-200"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Left Section: Icon + Details */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {/* File Icon */}
                                                    <div className="p-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg group-hover:from-blue-100 group-hover:to-cyan-100 transition-all">
                                                        <PaperClipIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
                                                    </div>

                                                    {/* Resume Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h3 className="text-xs font-semibold text-gray-900 truncate">
                                                                {resume.name}
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px]">
                                                            <div className="flex items-center gap-1.5">
                                                                <BriefcaseIcon className="h-3.5 w-3.5 text-blue-500" />
                                                                <span className="font-medium text-blue-600 truncate">
                                                                    {resume.role}
                                                                </span>
                                                            </div>
                                                            {resume.uploadDate && (
                                                                <>
                                                                    <span className="text-gray-400">•</span>
                                                                    <span className="text-gray-500">{new Date(resume.uploadDate).toLocaleDateString()}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {resume.notes && (
                                                            <p className="text-[11px] text-gray-600 mt-1.5 line-clamp-1">
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
                                                        className="px-2.5 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-md hover:bg-blue-100 transition-all"
                                                    >
                                                        View
                                                    </a>
                                                    {isMember && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteClick(resume.id, resume.name)}
                                                            disabled={deletingFileId === resume.id}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

        </div>
    )
}

export default Files;
