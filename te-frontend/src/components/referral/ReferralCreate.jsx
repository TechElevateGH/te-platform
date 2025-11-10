import { useState } from "react";
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


const ReferralCreate = ({ company, setReferralCompanyId }) => {
    const { accessToken } = useAuth();
    const { userInfo, resumes: contextResumes, setFetchReferralCompanies } = useData();

    // Check if user has REAL uploaded resumes from backend (contextResumes from DataContext)
    // DataContext initializes resumes as empty array, so if it has items, they're real
    const hasResume = contextResumes && contextResumes.length > 0;
    const availableResumes = hasResume ? contextResumes : [];

    // Check user's available materials
    const hasReferralEssay = userInfo?.essay && userInfo.essay.trim() !== '';
    const hasContact = userInfo?.contact && userInfo.contact.trim() !== '';

    // Company requirements
    const requirements = company.referral_materials || {};

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
        company_id: company.id,
        job_title: "",
        job_id: "",
        role: "New grad",
        request_note: "",
        resume: hasResume ? availableResumes[0].link || "" : "",
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const createReferralRequest = async () => {
        setIsSubmitting(true);
        setSubmitError("");

        try {
            const response = await axiosInstance.post(`/referrals`, referralData, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });

            if (response.data) {
                // Trigger refetch of referrals
                setFetchReferralCompanies(true);
                // Close modal
                setReferralCompanyId(null);
            }
        } catch (error) {
            console.error("Error creating referral:", error);
            setSubmitError(error.response?.data?.detail || "Failed to submit referral request. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
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
            submitButtonText="Request Referral"
            children={
                !hasResume ? (
                    <div className="px-6 py-8">
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ExclamationTriangleIcon className="h-8 w-8 text-rose-600" />
                            </div>
                            <h3 className="text-lg font-bold text-rose-900 mb-2">
                                Resume Required
                            </h3>
                            <p className="text-sm text-rose-700 font-medium">
                                Please upload your resume before requesting a referral.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="px-6 py-6 space-y-6">
                        {/* Company Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company</h3>
                            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                <img
                                    src={company.image}
                                    alt={company.name}
                                    className="h-12 w-12 rounded-lg object-cover border border-blue-200 shadow-sm"
                                />
                                <div>
                                    <p className="text-lg font-bold text-blue-900">{company.name}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                                        <span className="text-xs font-semibold text-emerald-700">Eligible for referral</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Requirements Section */}
                        {(requirements.resume || requirements.referralEssay || requirements.contact) && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <DocumentTextIcon className="h-4 w-4" />
                                    Requirements
                                </h3>
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        {requirements.resume && (
                                            <div className="flex items-center gap-3">
                                                {hasResume ? (
                                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                                ) : (
                                                    <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                )}
                                                <span className={`text-sm font-semibold ${hasResume ? 'text-emerald-900' : 'text-red-900'}`}>
                                                    Resume
                                                </span>
                                            </div>
                                        )}
                                        {requirements.referralEssay && (
                                            <div className="flex items-center gap-3">
                                                {hasReferralEssay ? (
                                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                                ) : (
                                                    <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                )}
                                                <span className={`text-sm font-semibold ${hasReferralEssay ? 'text-emerald-900' : 'text-red-900'}`}>
                                                    Referral Essay
                                                </span>
                                            </div>
                                        )}
                                        {requirements.contact && (
                                            <div className="flex items-center gap-3">
                                                {hasContact ? (
                                                    <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                                ) : (
                                                    <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                )}
                                                <span className={`text-sm font-semibold ${hasContact ? 'text-emerald-900' : 'text-red-900'}`}>
                                                    Contact
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Personal Information - Auto-populated (Read-only display) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Information</h3>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                                    <CheckCircleIcon className="h-3 w-3" />
                                    From Profile
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Name</p>
                                    <p className="text-sm font-bold text-gray-900">{userInfo?.first_name} {userInfo?.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Email</p>
                                    <p className="text-sm font-bold text-gray-900">{userInfo?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Job Information */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Position Details</h3>

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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Job ID <span className="text-gray-400 text-xs">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={referralData.job_id}
                                    onChange={(e) => handleInputChange({ field: 'job_id', value: e.target.value })}
                                    placeholder="e.g., R-123456 or Job Posting Number"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                />
                                <p className="mt-1.5 text-xs text-gray-500">
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
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Resume</h3>
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
                                                ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                                : 'bg-white border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                                    <DocumentTextIcon
                                                        className={`h-5 w-5 ${isSelected ? 'text-emerald-600' : 'text-gray-600'}`}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-900' : 'text-gray-900'
                                                            }`}>
                                                            {resume.name}
                                                        </p>
                                                        {isSelected && (
                                                            <CheckCircleIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <BriefcaseIcon className="h-3.5 w-3.5 text-gray-400" />
                                                        <p className="text-xs font-semibold text-blue-600">
                                                            {resume.role}
                                                        </p>
                                                    </div>
                                                    {resume.notes && (
                                                        <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">
                                                            {resume.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 font-medium">
                                Select the resume that best matches this role
                            </p>
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Additional Information</h3>
                            <FormTextArea
                                label="Notes"
                                field="request_note"
                                handleInputChange={handleInputChange}
                                required={false}
                            />
                            <p className="text-xs text-gray-500 font-medium">
                                Add any additional information or context for your referral request
                            </p>
                        </div>

                        {/* Error Message */}
                        {submitError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <p className="text-sm font-semibold text-red-900">{submitError}</p>
                            </div>
                        )}
                    </div>
                )
            }
        />
    )
}

export default ReferralCreate;
