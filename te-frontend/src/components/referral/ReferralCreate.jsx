import { useCallback, useMemo, useState } from "react";
import {
    ExclamationTriangleIcon,
    BriefcaseIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    XCircleIcon
} from '@heroicons/react/20/solid'
import axiosInstance from "../../axiosConfig";
import SlideOverForm from "../_custom/SlideOver/SlideOverCreate";
import { useData } from "../../context/DataContext";
import { FormTextArea } from "../_custom/FormInputs";
import { setNestedPropertyValue } from "../../utils";
import { useAuth } from "../../context/AuthContext";
import SelectCombobox from "../_custom/SelectCombobox";
import { trackEvent } from "../../analytics/events";


const ReferralCreate = ({ company, setReferralCompanyId }) => {
    const { accessToken } = useAuth();
    const { userInfo, resumes: contextResumes, setFetchReferralCompanies } = useData();

    const availableResumes = (contextResumes || []).filter((resume) => !resume.archived);
    const hasResume = availableResumes.length > 0;

    // Check user's available materials
    const hasReferralEssay = userInfo?.essay && userInfo.essay.trim() !== '';
    const hasPhoneNumber = userInfo?.phone_number && userInfo.phone_number.trim() !== '';

    // Company requirements
    const requirements = useMemo(() => company.referral_materials || {}, [company.referral_materials]);

    const getMissingRequirements = useCallback(() => {
        const missing = [];
        if (requirements.resume && !hasResume) missing.push('resume');
        if (requirements.essay && !hasReferralEssay) missing.push('referral essay');
        if (requirements.phone_number && !hasPhoneNumber) missing.push('phone number');
        return missing;
    }, [requirements, hasResume, hasReferralEssay, hasPhoneNumber]);

    const missingRequirements = useMemo(() => getMissingRequirements(), [getMissingRequirements]);

    const formatRequirementList = (items) => {
        if (items.length === 1) return items[0];
        if (items.length === 2) return `${items[0]} and ${items[1]}`;
        return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
    };

    const requirementWarningMessage = missingRequirements.length > 0
        ? `Please add your ${formatRequirementList(missingRequirements)} before requesting a referral.`
        : '';

    const hasAllRequiredMaterials = missingRequirements.length === 0;

    const [selectedResumeId, setSelectedResumeId] = useState(
        hasResume ? availableResumes[0].id : null
    );

    // Role/Level options
    const roleLevels = ["Intern", "New grad", "Entry-level", "Mid-level", "Senior", "Staff", "Principal", "Distinguished"];

    // Common job titles for suggestions
    const jobTitleSuggestions = [
        "Software Engineer",
        "Software Development Engineer",
        "Frontend Engineer",
        "Backend Engineer",
        "Full Stack Engineer",
        "Data Scientist",
        "Data Engineer",
        "Machine Learning Engineer",
        "DevOps Engineer",
        "Product Manager",
        "Product Designer",
        "UX Designer",
        "Technical Program Manager",
        "Engineering Manager",
        "Site Reliability Engineer",
        "Security Engineer",
        "Mobile Engineer",
        "iOS Engineer",
        "Android Engineer",
        "QA Engineer",
        "Solutions Architect"
    ];

    // Referral data matching backend schema
    const [referralData, setReferralData] = useState({
        company_id: company.name,  // Send company name instead of ID
        job_title: "",
        job_id: "",
        role: "New grad",
        request_note: "",
        resume: hasResume ? availableResumes[0].link || "" : "",
        phone_number: userInfo?.phone_number || "",
        essay: userInfo?.essay || "",
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const createReferralRequest = async () => {
        setSubmitError("");

        const latestMissingRequirements = getMissingRequirements();
        if (latestMissingRequirements.length > 0) {
            setSubmitError(`Please add your ${formatRequirementList(latestMissingRequirements)} before requesting a referral.`);
            return false;
        }

        setIsSubmitting(true);

        try {
            const response = await axiosInstance.post(`/referrals`, referralData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });

            if (response.data) {
                // Track successful referral request
                trackEvent.referralRequested({
                    company: company.name,
                    job_title: referralData.job_title,
                    level: referralData.role,
                    has_job_id: !!referralData.job_id,
                    has_note: !!referralData.request_note,
                });

                // Trigger refetch of referrals
                setFetchReferralCompanies(true);
                // Close modal
                setReferralCompanyId(null);

                return true;
            }
        } catch (error) {
            console.error("Error creating referral:", error);
            setSubmitError(error.response?.data?.detail || "Failed to submit referral request. Please try again.");
            return false;
        } finally {
            setIsSubmitting(false);
        }
        return false;
    }

    const handleInputChange = ({ field, value }) => {
        setReferralData((prevData) =>
            setNestedPropertyValue({ ...prevData }, field, value)
        );
    };


    return (
        <SlideOverForm
            title={"Request Referral"}
            setHandler={setReferralCompanyId}
            requestHandler={createReferralRequest}
            isSubmitting={isSubmitting}
            isSubmitDisabled={!hasAllRequiredMaterials}
            submitButtonText={hasAllRequiredMaterials ? "Request Referral" : "Complete Requirements"}
            children={
                !hasResume ? (
                    <div className="px-6 py-8">
                        <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl p-6 text-center">
                            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ExclamationTriangleIcon className="h-8 w-8 text-rose-600 dark:text-rose-400" />
                            </div>
                            <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200 mb-2">
                                Resume Required
                            </h3>
                            <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">
                                Please upload your resume before requesting a referral.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="px-6 py-6 space-y-6">
                        {/* Company Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</h3>
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border border-blue-200 dark:border-blue-700">
                                <img
                                    src={company.image}
                                    alt={company.name}
                                    className="h-12 w-12 rounded-lg object-cover border border-blue-200 dark:border-blue-700 shadow-sm"
                                />
                                <div>
                                    <p className="text-lg font-bold text-blue-900 dark:text-blue-200">{company.name}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Eligible for referral</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Requirements Section */}
                        {(requirements.resume || requirements.essay || requirements.phone_number) && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <DocumentTextIcon className="h-4 w-4" />
                                    Requirements
                                </h3>
                                <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        {requirements.resume && (
                                            <div className="flex items-center gap-3">
                                                {hasResume ? (
                                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                ) : (
                                                    <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                                                )}
                                                <span className={`text-sm font-semibold ${hasResume ? 'text-emerald-900 dark:text-emerald-200' : 'text-red-900 dark:text-red-200'}`}>
                                                    Resume
                                                </span>
                                            </div>
                                        )}
                                        {requirements.essay && (
                                            <div className="flex items-center gap-3">
                                                {hasReferralEssay ? (
                                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                ) : (
                                                    <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                                                )}
                                                <span className={`text-sm font-semibold ${hasReferralEssay ? 'text-emerald-900 dark:text-emerald-200' : 'text-red-900 dark:text-red-200'}`}>
                                                    Referral Essay
                                                </span>
                                            </div>
                                        )}
                                        {requirements.phone_number && (
                                            <div className="flex items-center gap-3">
                                                {hasPhoneNumber ? (
                                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                ) : (
                                                    <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                                                )}
                                                <span className={`text-sm font-semibold ${hasPhoneNumber ? 'text-emerald-900 dark:text-emerald-200' : 'text-red-900 dark:text-red-200'}`}>
                                                    Phone Number
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {!hasAllRequiredMaterials && requirementWarningMessage && (
                                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-100">
                                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                                        <p className="text-xs font-semibold leading-snug">
                                            {requirementWarningMessage}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Personal Information - Auto-populated (Read-only display) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Information</h3>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-200 dark:border-blue-700">
                                    <CheckCircleIcon className="h-3 w-3" />
                                    From Profile
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Name</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{userInfo?.first_name} {userInfo?.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Email</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{userInfo?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Job Information */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position Details</h3>

                            <div className="relative">
                                <SelectCombobox
                                    label="Job Title"
                                    options={jobTitleSuggestions}
                                    value={referralData.job_title}
                                    onChange={(value) => handleInputChange({ field: 'job_title', value })}
                                    placeholder="e.g., Software Engineer, Data Scientist"
                                    icon={BriefcaseIcon}
                                    required={true}
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    Job ID <span className="text-gray-400 dark:text-gray-500 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={referralData.job_id}
                                    onChange={(e) => handleInputChange({ field: 'job_id', value: e.target.value })}
                                    placeholder="e.g., R-123456 or Job Posting Number"
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all text-sm font-medium"
                                />
                                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                    If available, include the job posting ID or requisition number
                                </p>
                            </div>

                            <div className="relative">
                                <SelectCombobox
                                    label="Level"
                                    options={roleLevels}
                                    value={referralData.role}
                                    onChange={(value) => handleInputChange({ field: 'role', value })}
                                    required={true}
                                />
                            </div>
                        </div>

                        {/* Resume Selection */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select Resume</h3>
                            <div className="space-y-3">
                                {availableResumes.map((resume) => {
                                    const isSelected = selectedResumeId === resume.id;
                                    return (
                                        <div
                                            key={resume.id}
                                            onClick={() => {
                                                setSelectedResumeId(resume.id);
                                                handleInputChange({ field: 'resume', value: resume.link || '' });
                                            }}
                                            className={`cursor-pointer p-4 rounded-xl border-2 transition-all hover:shadow-md ${isSelected
                                                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-600 shadow-sm'
                                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-gray-100 dark:bg-gray-600'}`}>
                                                    <DocumentTextIcon
                                                        className={`h-5 w-5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-900 dark:text-emerald-200' : 'text-gray-900 dark:text-white'
                                                            }`}>
                                                            {resume.name}
                                                        </p>
                                                        {isSelected && (
                                                            <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <BriefcaseIcon className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                            {resume.role}
                                                        </p>
                                                    </div>
                                                    {resume.notes && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 line-clamp-2">
                                                            {resume.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Select the resume that best matches this role
                            </p>
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Additional Information</h3>
                            <FormTextArea
                                label="Notes"
                                field="request_note"
                                handleInputChange={handleInputChange}
                                required={false}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Add any additional information or context for your referral request
                            </p>
                        </div>

                        {/* Error Message */}
                        {submitError && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4">
                                <p className="text-sm font-semibold text-red-900 dark:text-red-200">{submitError}</p>
                            </div>
                        )}
                    </div>
                )
            }
        />
    )
}

export default ReferralCreate;
