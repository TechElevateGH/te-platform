import { useState, useEffect } from 'react'
import { XMarkIcon, ClipboardIcon, CheckIcon, DocumentTextIcon, UserIcon } from 'icons'
import { PencilSquareIcon } from 'icons'
import { copyTextToClipboard } from '../../utils'
import { useData } from '../../context/DataContext'
import axiosInstance from '../../axiosConfig'
import { useAuth } from '../../context/AuthContext'


const ReferralEssay = () => {
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
            <div className="te-card overflow-hidden">
                {/* Header */}
                <div className="bg-[var(--te-surface-alt)] px-6 py-4 border-b border-[var(--te-border)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface)]">
                                <DocumentTextIcon className="h-5 w-5 text-[var(--te-text)]" />
                            </div>
                            <div>
                                <h3 className="font-display text-lg font-bold text-[var(--te-text)]">Cover Letter</h3>
                                <p className="text-xs text-[var(--te-text-dim)]">First person - for job applications</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {!updateCoverLetter && userInfo?.cover_letter && (
                                <button
                                    onClick={handleCopyCover}
                                    className="te-icon-btn"
                                    title="Copy to clipboard"
                                >
                                    {copiedCover ? (
                                        <CheckIcon className="h-5 w-5 text-[var(--te-text)]" />
                                    ) : (
                                        <ClipboardIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                                    )}
                                </button>
                            )}

                            {!updateCoverLetter ? (
                                <button
                                    onClick={() => setUpdateCoverLetter(true)}
                                    className="te-btn-secondary te-btn-sm gap-2"
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                    Edit
                                </button>
                            ) : (
                                <button
                                    onClick={() => setUpdateCoverLetter(false)}
                                    className="te-btn-secondary te-btn-sm gap-2"
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
                                    <p className="text-[var(--te-text-dim)] leading-relaxed whitespace-pre-wrap">
                                        {userInfo.cover_letter}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                        <DocumentTextIcon className="h-8 w-8 text-[var(--te-text-dim)]" />
                                    </div>
                                    <h4 className="font-display text-sm font-semibold text-[var(--te-text)] mb-1">
                                        No cover letter added
                                    </h4>
                                    <p className="text-xs text-[var(--te-text-dim)] mb-4">
                                        Write in first person (I, me, my)
                                    </p>
                                    <button
                                        onClick={() => setUpdateCoverLetter(true)}
                                        className="te-btn-primary te-btn-sm gap-2"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Add Cover Letter
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                                <p className="text-xs text-[var(--te-text)] font-medium">
                                    💡 Write in <strong>first person</strong>: "I am a software engineer with 5 years of experience..."
                                </p>
                            </div>
                            <textarea
                                rows={10}
                                name="cover_letter"
                                id="cover_letter"
                                className="te-textarea resize-none min-h-60"
                                placeholder="I am writing to express my interest in..."
                                defaultValue={userInfo?.cover_letter || ''}
                                onChange={(e) => setCoverLetterBody(e.target.value)}
                            />

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-[var(--te-text-dim)]">
                                    {coverLetterBody?.length || 0} characters
                                </p>
                                <button
                                    type="button"
                                    className="te-btn-primary"
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
            <div className="te-card overflow-hidden">
                {/* Header */}
                <div className="bg-[var(--te-surface-alt)] px-6 py-4 border-b border-[var(--te-border)]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface)]">
                                <UserIcon className="h-5 w-5 text-[var(--te-text)]" />
                            </div>
                            <div>
                                <h3 className="font-display text-lg font-bold text-[var(--te-text)]">Referral Essay</h3>
                                <p className="text-xs text-[var(--te-text-dim)]">Third person - used for referral requests</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {!updateReferralEssay && userInfo?.essay && (
                                <button
                                    onClick={handleCopyReferral}
                                    className="te-icon-btn"
                                    title="Copy to clipboard"
                                >
                                    {copiedReferral ? (
                                        <CheckIcon className="h-5 w-5 text-[var(--te-text)]" />
                                    ) : (
                                        <ClipboardIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                                    )}
                                </button>
                            )}

                            {!updateReferralEssay ? (
                                <button
                                    onClick={() => setUpdateReferralEssay(true)}
                                    className="te-btn-secondary te-btn-sm gap-2"
                                >
                                    <PencilSquareIcon className="h-4 w-4" />
                                    Edit
                                </button>
                            ) : (
                                <button
                                    onClick={() => setUpdateReferralEssay(false)}
                                    className="te-btn-secondary te-btn-sm gap-2"
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
                                    <p className="text-[var(--te-text-dim)] leading-relaxed whitespace-pre-wrap">
                                        {userInfo.essay}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                        <UserIcon className="h-8 w-8 text-[var(--te-text-dim)]" />
                                    </div>
                                    <h4 className="font-display text-sm font-semibold text-[var(--te-text)] mb-1">
                                        No referral essay added
                                    </h4>
                                    <p className="text-xs text-[var(--te-text-dim)] mb-4">
                                        Write in third person (he/she, him/her)
                                    </p>
                                    <button
                                        onClick={() => setUpdateReferralEssay(true)}
                                        className="te-btn-primary te-btn-sm gap-2"
                                    >
                                        <PencilSquareIcon className="h-4 w-4" />
                                        Add Referral Essay
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                                <p className="text-xs text-[var(--te-text)] font-medium">
                                    💡 Write in <strong>third person</strong>: "[Name] is a software engineer with 5 years of experience..." This will be used when requesting referrals.
                                </p>
                            </div>
                            <textarea
                                rows={10}
                                name="referral_essay"
                                id="referral_essay"
                                className="te-textarea resize-none min-h-60"
                                placeholder="[Your name] is a passionate software engineer with expertise in..."
                                defaultValue={userInfo?.essay || ''}
                                onChange={(e) => setReferralEssayBody(e.target.value)}
                            />

                            <div className="flex items-center justify-between">
                                <p className="text-xs text-[var(--te-text-dim)]">
                                    {referralEssayBody?.length || 0} characters
                                </p>
                                <button
                                    type="button"
                                    className="te-btn-primary"
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
export default ReferralEssay;
