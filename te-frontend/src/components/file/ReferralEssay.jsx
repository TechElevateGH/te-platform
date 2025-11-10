import { useState, useEffect } from 'react'
import { XMarkIcon, ClipboardIcon, CheckIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/20/solid'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { copyTextToClipboard } from '../../utils'
import { useData } from '../../context/DataContext'
import axiosInstance from '../../axiosConfig'
import { useAuth } from '../../context/AuthContext'


const Essay = () => {
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
                console.log(error);
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
                console.log(error);
            })
    };


    return (
        <div className="space-y-6">
            {/* Cover Letter Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Cover Letter</h3>
                                <p className="text-xs text-gray-600">First person - for job applications</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {!updateCoverLetter && userInfo?.cover_letter && (
                                <button
                                    onClick={handleCopyCover}
                                    className="p-2 hover:bg-white rounded-lg transition-all"
                                    title="Copy to clipboard"
                                >
                                    {copiedCover ? (
                                        <CheckIcon className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <ClipboardIcon className="h-5 w-5 text-gray-600" />
                                    )}
                                </button>
                            )}

                            {!updateCoverLetter ? (
                                <button
                                    onClick={() => setUpdateCoverLetter(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-50 transition-all border border-blue-200"
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                    Edit
                                </button>
                            ) : (
                                <button
                                    onClick={() => setUpdateCoverLetter(false)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all border border-gray-200"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                    Cancel
                                </button>
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
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {userInfo.cover_letter}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <DocumentTextIcon className="h-8 w-8 text-blue-400" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                        No cover letter added
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-4">
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
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-800 font-medium">
                                    💡 Write in <strong>first person</strong>: "I am a software engineer with 5 years of experience..."
                                </p>
                            </div>
                            <textarea
                                rows={10}
                                name="cover_letter"
                                id="cover_letter"
                                className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium resize-none"
                                placeholder="I am writing to express my interest in..."
                                defaultValue={userInfo?.cover_letter || ''}
                                onChange={(e) => setCoverLetterBody(e.target.value)}
                            />

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <UserIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Referral Essay</h3>
                                <p className="text-xs text-gray-600">Third person - used for referral requests</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {!updateReferralEssay && userInfo?.essay && (
                                <button
                                    onClick={handleCopyReferral}
                                    className="p-2 hover:bg-white rounded-lg transition-all"
                                    title="Copy to clipboard"
                                >
                                    {copiedReferral ? (
                                        <CheckIcon className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <ClipboardIcon className="h-5 w-5 text-gray-600" />
                                    )}
                                </button>
                            )}

                            {!updateReferralEssay ? (
                                <button
                                    onClick={() => setUpdateReferralEssay(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-50 transition-all border border-purple-200"
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                    Edit
                                </button>
                            ) : (
                                <button
                                    onClick={() => setUpdateReferralEssay(false)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all border border-gray-200"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                    Cancel
                                </button>
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
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {userInfo.essay}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <UserIcon className="h-8 w-8 text-purple-400" />
                                    </div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                        No referral essay added
                                    </h4>
                                    <p className="text-xs text-gray-500 mb-4">
                                        Write in third person (he/she, him/her)
                                    </p>
                                    <button
                                        onClick={() => setUpdateReferralEssay(true)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Add Referral Essay
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <p className="text-xs text-purple-800 font-medium">
                                    💡 Write in <strong>third person</strong>: "[Name] is a software engineer with 5 years of experience..." This will be used when requesting referrals.
                                </p>
                            </div>
                            <textarea
                                rows={10}
                                name="referral_essay"
                                id="referral_essay"
                                className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm font-medium resize-none"
                                placeholder="[Your name] is a passionate software engineer with expertise in..."
                                defaultValue={userInfo?.essay || ''}
                                onChange={(e) => setReferralEssayBody(e.target.value)}
                            />

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    {referralEssayBody?.length || 0} characters
                                </p>
                                <button
                                    type="button"
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:from-purple-700 hover:to-pink-700 active:scale-95 transition-all duration-200"
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