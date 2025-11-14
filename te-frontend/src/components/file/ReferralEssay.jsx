import { useState, useEffect } from 'react'
import { XMarkIcon, ClipboardIcon, CheckIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/20/solid'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { copyTextToClipboard } from '../../utils'
import { useData } from '../../context/DataContext'
import axiosInstance from '../../axiosConfig'
import { useAuth } from '../../context/AuthContext'


const Essay = ({ isMember = true }) => {
    const { userId, accessToken } = useAuth();
    const { userInfo, setUserInfo } = useData();
    const [updateCoverLetter, setUpdateCoverLetter] = useState(false);
    const [updateReferralEssay, setUpdateReferralEssay] = useState(false);
    const [coverLetterBody, setCoverLetterBody] = useState(userInfo?.cover_letter || '');
    const [referralEssayBody, setReferralEssayBody] = useState(userInfo?.essay || '');
    const [copiedCover, setCopiedCover] = useState(false);
    const [copiedReferral, setCopiedReferral] = useState(false);

    // Sync state with userInfo when it updates
    useEffect(() => {
        if (userInfo?.cover_letter !== undefined) {
            setCoverLetterBody(userInfo.cover_letter);
        }
        if (userInfo?.essay !== undefined) {
            setReferralEssayBody(userInfo.essay);
        }
    }, [userInfo]);

    const handleCopyCover = () => {
        copyTextToClipboard(userInfo?.cover_letter);
        setCopiedCover(true);
        setTimeout(() => setCopiedCover(false), 2000);
    };

    const handleCopyReferral = () => {
        copyTextToClipboard(userInfo?.essay);
        setCopiedReferral(true);
        setTimeout(() => setCopiedReferral(false), 2000);
    };

    const updateCoverLetterRequest = async () => {
        await axiosInstance.post(`/users/${userId}/cover-letter`,
            { "cover_letter": coverLetterBody },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then((_) => {
                // Update userInfo in context instead of reloading
                setUserInfo({ ...userInfo, cover_letter: coverLetterBody });
                setUpdateCoverLetter(false);
            })
            .catch((error) => {
                console.error('Error updating cover letter:', error);
            })
    };

    const updateReferralEssayRequest = async () => {
        await axiosInstance.post(`/users/${userId}/essay`,
            { "essay": referralEssayBody },
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            })
            .then((_) => {
                // Update userInfo in context instead of reloading
                setUserInfo({ ...userInfo, essay: referralEssayBody });
                setUpdateReferralEssay(false);
            })
            .catch((error) => {
                console.error('Error updating referral essay:', error);
            })
    };


    return (
        <div className="space-y-6">
            {/* Cover Letter Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cover Letter</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300">First person - for job applications</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {!updateCoverLetter && userInfo?.cover_letter && (
                                <button
                                    onClick={handleCopyCover}
                                    className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all"
                                    title="Copy to clipboard"
                                >
                                    {copiedCover ? (
                                        <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <ClipboardIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                    )}
                                </button>
                            )}

                            {isMember && (
                                !updateCoverLetter ? (
                                    <button
                                        onClick={() => setUpdateCoverLetter(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-gray-600 transition-all border border-blue-200 dark:border-blue-700"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Edit
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setUpdateCoverLetter(false)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all border border-gray-200 dark:border-gray-600"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                        Cancel
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!updateCoverLetter ? (
                        <div>
                            {userInfo?.cover_letter && userInfo.cover_letter !== "" ? (
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                        {userInfo.cover_letter}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <DocumentTextIcon className="h-8 w-8 text-blue-400 dark:text-blue-500" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                        No cover letter added
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-300 mb-4">
                                        Write in first person (I, me, my)
                                    </p>
                                    <button
                                        onClick={() => setUpdateCoverLetter(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Add Cover Letter
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                                <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                                    💡 Write in <strong>first person</strong>: "I am a software engineer with 5 years of experience..."
                                </p>
                            </div>
                            <textarea
                                rows={10}
                                name="cover_letter"
                                id="cover_letter"
                                className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all text-sm font-medium resize-none"
                                placeholder="I am writing to express my interest in..."
                                defaultValue={userInfo?.cover_letter || ''}
                                onChange={(e) => setCoverLetterBody(e.target.value)}
                            />

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-300">
                                    {coverLetterBody?.length || 0} characters
                                </p>
                                <button
                                    type="button"
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 active:scale-95 transition-all duration-200"
                                    onClick={updateCoverLetterRequest}
                                >
                                    Save Cover Letter
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Referral Essay Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                <UserIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Referral Essay</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-300">Third person - used for referral requests</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {!updateReferralEssay && userInfo?.essay && (
                                <button
                                    onClick={handleCopyReferral}
                                    className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition-all"
                                    title="Copy to clipboard"
                                >
                                    {copiedReferral ? (
                                        <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <ClipboardIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                    )}
                                </button>
                            )}

                            {isMember && (
                                !updateReferralEssay ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setUpdateReferralEssay(true);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 text-sm font-semibold rounded-lg hover:bg-emerald-50 dark:hover:bg-gray-600 transition-all border border-emerald-200 dark:border-emerald-700"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Edit
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setUpdateReferralEssay(false);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all border border-gray-200 dark:border-gray-600"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                        Cancel
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!updateReferralEssay ? (
                        <div>
                            {userInfo?.essay && userInfo.essay !== "" ? (
                                <div className="prose prose-sm max-w-none">
                                    <p className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                        {userInfo.essay}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <UserIcon className="h-8 w-8 text-emerald-400 dark:text-emerald-500" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                        No referral essay added
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-300 mb-4">
                                        Write in third person (he/she, him/her)
                                    </p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setUpdateReferralEssay(true);
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Add Referral Essay
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3">
                                <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                                    💡 Write in <strong>third person</strong>: "[Name] is a software engineer with 5 years of experience..." This will be used when requesting referrals.
                                </p>
                            </div>
                            <textarea
                                rows={10}
                                name="referral_essay"
                                id="referral_essay"
                                className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent transition-all text-sm font-medium resize-none"
                                placeholder="[Your name] is a passionate software engineer with expertise in..."
                                defaultValue={userInfo?.essay || ''}
                                onChange={(e) => setReferralEssayBody(e.target.value)}
                            />

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-300">
                                    {referralEssayBody?.length || 0} characters
                                </p>
                                <button
                                    type="button"
                                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:from-emerald-700 hover:to-green-700 active:scale-95 transition-all duration-200"
                                    onClick={updateReferralEssayRequest}
                                >
                                    Save Referral Essay
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
export default Essay;