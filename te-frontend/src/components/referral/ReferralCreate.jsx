import { useCallback, useMemo, useState } from "react";
import { ExclamationTriangleIcon, BriefcaseIcon, CheckCircleIcon, DocumentTextIcon, XCircleIcon } from 'icons';
import axiosInstance from "../../axiosConfig";
import SlideOverForm from "../_custom/SlideOver/SlideOverCreate";
import { useData } from "../../context/DataContext";
import { FormTextArea } from "../_custom/FormInputs";
import { setNestedPropertyValue, getCompanyLogoUrl, handleCompanyLogoError } from "../../utils";
import { countries } from '../../data/jobData';
import { useAuth } from "../../context/AuthContext";
import SelectCombobox from "../_custom/SelectCombobox";
import { trackEvent } from "../../analytics/events";
const ReferralCreate = ({
  company,
  setReferralCompanyId
}) => {
  const {
    accessToken
  } = useAuth();
  const {
    userInfo,
    setFetchReferralCompanies
  } = useData();

  // Resumes come from userInfo.resumes (part of user model)
  const availableResumes = (userInfo?.resumes || []).filter(resume => !resume.archived);
  const hasResume = availableResumes.length > 0;

  // Referral data matching backend schema
  const [referralData, setReferralData] = useState({
    company_id: company.name,
    // Send company name instead of ID
    job_title: "",
    job_id: "",
    role: "New grad",
    request_note: "",
    resume: hasResume ? availableResumes[0].link || "" : "",
    phone_number: userInfo?.phone_number || "",
    email: userInfo?.email || "",
    essay: userInfo?.referral_essay || "",
    country: "United States",
    date: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-')
  });

  // Check user's available materials
  const hasReferralEssay = userInfo?.referral_essay && userInfo.referral_essay.trim() !== '';
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
  const formatRequirementList = items => {
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
  };
  const requirementWarningMessage = missingRequirements.length > 0 ? `Please add your ${formatRequirementList(missingRequirements)} before requesting a referral.` : '';
  const hasAllRequiredMaterials = missingRequirements.length === 0;
  const [selectedResumeId, setSelectedResumeId] = useState(hasResume ? availableResumes[0].id : null);

  // Role/Level options
  const roleLevels = ["Intern", "New grad", "Entry-level", "Mid-level", "Senior", "Staff", "Principal", "Distinguished"];

  // Common job titles for suggestions
  const jobTitleSuggestions = ["Software Engineer", "Software Development Engineer", "Frontend Engineer", "Backend Engineer", "Full Stack Engineer", "Data Scientist", "Data Engineer", "Machine Learning Engineer", "DevOps Engineer", "Product Manager", "Product Designer", "UX Designer", "Technical Program Manager", "Engineering Manager", "Site Reliability Engineer", "Security Engineer", "Mobile Engineer", "iOS Engineer", "Android Engineer", "QA Engineer", "Solutions Architect"];
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
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (response.data) {
        // Track successful referral request
        trackEvent.referralRequested({
          company: company.name,
          job_title: referralData.job_title,
          level: referralData.role,
          has_job_id: !!referralData.job_id,
          has_note: !!referralData.request_note
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
  };
  const handleInputChange = ({
    field,
    value
  }) => {
    setReferralData(prevData => setNestedPropertyValue({
      ...prevData
    }, field, value));
  };
  return <SlideOverForm title={"Request Referral"} setHandler={setReferralCompanyId} requestHandler={createReferralRequest} isSubmitting={isSubmitting} isSubmitDisabled={!hasAllRequiredMaterials} submitButtonText={hasAllRequiredMaterials ? "Request Referral" : "Complete Requirements"} children={!hasResume ? <div className="px-6 py-8">
                        <div className="border border-[var(--te-red)] bg-[var(--te-red-soft)] p-6 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-[var(--te-red)] bg-[var(--te-red-soft)]">
                                <ExclamationTriangleIcon className="h-8 w-8 text-te-red" />
                            </div>
                            <h3 className="font-display text-lg font-bold text-te-red mb-2">
                                Resume Required
                            </h3>
                            <p className="text-sm text-te-red font-medium">
                                Please upload your resume before requesting a referral.
                            </p>
                        </div>
                    </div> : <div className="px-6 py-6 space-y-6">
                        {/* Company Section */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">Company</h3>
                            <div className="flex items-center gap-3 border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-4">
                                <img src={getCompanyLogoUrl(company.name)} alt={company.name} className="h-12 w-12 border border-[var(--te-border)] object-cover" onError={handleCompanyLogoError} />

                                <div>
                                    <p className="font-display text-lg font-bold text-[var(--te-text)]">{company.name}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <CheckCircleIcon className="h-4 w-4 text-te-green" />
                                        <span className="text-xs font-semibold text-te-green">Eligible for referral</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Requirements Section */}
                        {(requirements.resume || requirements.essay || requirements.phone_number) && <div className="space-y-3">
                                <h3 className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em] flex items-center gap-2">
                                    <DocumentTextIcon className="h-4 w-4" />
                                    Requirements
                                </h3>
                                <div className="te-card p-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        {requirements.resume && <div className="flex items-center gap-3">
                                                {hasResume ? <CheckCircleIcon className="h-5 w-5 text-te-green flex-shrink-0" /> : <XCircleIcon className="h-5 w-5 text-te-red flex-shrink-0" />}

                                                <span className={`text-sm font-semibold ${hasResume ? "text-te-green" : 'text-te-red'}`}>
                                                    Resume
                                                </span>
                                            </div>}

                                        {requirements.essay && <div className="flex items-center gap-3">
                                                {hasReferralEssay ? <CheckCircleIcon className="h-5 w-5 text-te-green flex-shrink-0" /> : <XCircleIcon className="h-5 w-5 text-te-red flex-shrink-0" />}

                                                <span className={`text-sm font-semibold ${hasReferralEssay ? "text-te-green" : 'text-te-red'}`}>
                                                    Referral Essay
                                                </span>
                                            </div>}

                                        {requirements.phone_number && <div className="flex items-center gap-3">
                                                {hasPhoneNumber ? <CheckCircleIcon className="h-5 w-5 text-te-green flex-shrink-0" /> : <XCircleIcon className="h-5 w-5 text-te-red flex-shrink-0" />}

                                                <span className={`text-sm font-semibold ${hasPhoneNumber ? "text-te-green" : 'text-te-red'}`}>
                                                    Phone Number
                                                </span>
                                            </div>}

                                    </div>
                                </div>
                                {!hasAllRequiredMaterials && requirementWarningMessage && <div className="flex items-start gap-2 rounded-md border border-[var(--te-gold)] bg-[var(--te-gold-soft)] px-3 py-2 text-te-gold">
                                        <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                                        <p className="text-xs font-semibold leading-snug">
                                            {requirementWarningMessage}
                                        </p>
                                    </div>}

                            </div>}


                        {/* Personal Information - Auto-populated but editable */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">Your Information</h3>
                                <span className="te-chip">
                                    <CheckCircleIcon className="h-3 w-3" />
                                    From Profile
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-4">
                                    <p className="text-xs font-semibold text-[var(--te-text-dim)] mb-1">Name</p>
                                    <p className="text-sm font-bold text-[var(--te-text)]">{userInfo?.first_name} {userInfo?.last_name}</p>
                                </div>
                                <div>
                                    <label className="block mb-2 block text-sm font-semibold text-[var(--te-text)]">
                                        Email Address
                                    </label>
                                    <input type="email" value={referralData.email} onChange={e => handleInputChange({
            field: 'email',
            value: e.target.value
          })} className="te-input" placeholder="your.email@example.com" />

                                    <p className="mt-1 text-xs text-[var(--te-text-dim)]">
                                        This email will be shared with the referrer
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Job Information */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">Position Details</h3>

                            <div className="relative">
                                <SelectCombobox label="Country/Location" options={countries} value={referralData.country} onChange={country => handleInputChange({
          field: 'country',
          value: country
        })} placeholder="Type or select a country..." required />

                            </div>

                            <div className="relative">
                                <SelectCombobox label="Job Title" options={jobTitleSuggestions} value={referralData.job_title} onChange={value => handleInputChange({
          field: 'job_title',
          value
        })} placeholder="e.g., Software Engineer, Data Scientist" icon={BriefcaseIcon} required={true} />

                            </div>

                            <div className="relative">
                                <label className="block mb-2 block text-sm font-semibold text-[var(--te-text)]">
                                    Job ID <span className="text-[var(--te-text-dim)] text-xs">(Optional)</span>
                                </label>
                                <input type="text" value={referralData.job_id} onChange={e => handleInputChange({
          field: 'job_id',
          value: e.target.value
        })} placeholder="e.g., R-123456 or Job Posting Number" className="te-input" />

                                <p className="mt-1.5 text-xs text-[var(--te-text-dim)]">
                                    If available, include the job posting ID or requisition number. You can separate multiple IDs with commas, spaces, or semicolons.
                                </p>
                            </div>

                            <div className="relative">
                                <SelectCombobox label="Level" options={roleLevels} value={referralData.role} onChange={value => handleInputChange({
          field: 'role',
          value
        })} required={true} />

                            </div>
                        </div>

                        {/* Resume Selection */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">Select Resume</h3>
                            <div className="space-y-3">
                                {availableResumes.map(resume => {
          const isSelected = selectedResumeId === resume.id;
          return <div key={resume.id} onClick={() => {
            setSelectedResumeId(resume.id);
            handleInputChange({
              field: 'resume',
              value: resume.link || ''
            });
          }} className={`cursor-pointer border p-4 transition-colors hover:bg-[var(--te-hover)] ${isSelected ? "bg-[var(--te-surface-alt)] border-[var(--te-border)]" : "bg-[var(--te-surface-alt)] border-[var(--te-border)] hover:border-[var(--te-border-strong)]"}`}>


                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-md ${isSelected ? "bg-[var(--te-surface-alt)]" : "bg-[var(--te-surface-alt)]"}`}>
                                                    <DocumentTextIcon className={`h-5 w-5 ${isSelected ? "text-[var(--te-text)]" : "text-[var(--te-text-dim)]"}`} />

                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={`text-sm font-bold truncate ${isSelected ? "text-[var(--te-text)]" : "text-[var(--te-text)]"}`}>

                                                            {resume.name}
                                                        </p>
                                                        {isSelected && <CheckCircleIcon className="h-5 w-5 text-[var(--te-text)] flex-shrink-0" />}

                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <BriefcaseIcon className="h-3.5 w-3.5 text-[var(--te-text-dim)]" />
                                                        <p className="text-xs font-semibold text-[var(--te-text)]">
                                                            {resume.role}
                                                        </p>
                                                    </div>
                                                    {resume.notes && <p className="text-xs text-[var(--te-text-dim)] mt-1.5 line-clamp-2">
                                                            {resume.notes}
                                                        </p>}

                                                </div>
                                            </div>
                                        </div>;
        })}
                            </div>
                            <p className="text-xs text-[var(--te-text-dim)] font-medium">
                                Select the resume that best matches this role
                            </p>
                        </div>

                        {/* Additional Notes */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-mono font-semibold text-[var(--te-text-dim)] uppercase tracking-[0.16em]">Additional Information</h3>
                            <FormTextArea label="Notes" field="request_note" handleInputChange={handleInputChange} required={false} />

                            <p className="text-xs text-[var(--te-text-dim)] font-medium">
                                Add any additional information or context for your referral request
                            </p>
                        </div>

                        {/* Error Message */}
                        {submitError && <div className="border border-[var(--te-red)] bg-[var(--te-red-soft)] p-4">
                                <p className="text-sm font-semibold text-te-red">{submitError}</p>
                            </div>}

                    </div>} />;
};
export default ReferralCreate;
