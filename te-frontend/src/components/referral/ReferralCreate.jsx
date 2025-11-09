import { useState } from "react";
import {
    ExclamationTriangleIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    BriefcaseIcon,
    CheckCircleIcon,
    DocumentTextIcon
} from '@heroicons/react/20/solid'
import axiosInstance from "../../axiosConfig";
import SlideOverForm from "../_custom/SlideOver/SlideOverCreate";
import { useData } from "../../context/DataContext";
import { FormTextArea } from "../_custom/FormInputs";
import { setNestedPropertyValue } from "../../utils";
import { useAuth } from "../../context/AuthContext";


const ReferralCreate = ({ company, setReferralCompanyId }) => {
    const { accessToken } = useAuth();
    const { userInfo, resumes: contextResumes } = useData();

    // Mock user data for demo
    const mockUserInfo = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '+1 (555) 123-4567'
    };

    // Mock resumes if none available
    const mockResumes = [
        {
            id: 1,
            name: 'Software_Engineer_Resume.pdf',
            role: 'Software Engineer',
            notes: 'Tailored for FAANG companies'
        },
        {
            id: 2,
            name: 'Data_Science_Resume.pdf',
            role: 'Data Scientist',
            notes: 'Highlights ML projects'
        }
    ];

    const currentUser = userInfo || mockUserInfo;
    const availableResumes = contextResumes.length > 0 ? contextResumes : mockResumes;

    // Check if resume requirement is met
    const hasResume = availableResumes && availableResumes.length > 0;

    const [selectedResumeId, setSelectedResumeId] = useState(
        hasResume ? availableResumes[0].id : null
    );

    const [referralData, setReferralData] = useState({
        company_id: company.id,
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        phone_number: currentUser.phone_number || '',
        resume_id: hasResume ? availableResumes[0].id : null,
        job_id: "",
        job_role: "",
        request_note: ""
    });

    const createReferralRequest = async () => {
        await axiosInstance.post(`/referrals`, referralData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            }
        ).then((_) => {
            setReferralCompanyId(null);
        })
            .catch((error) => {
                console.log(error);
            });
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

                        {/* Personal Information - Auto-populated */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={referralData.first_name}
                                            onChange={(e) => handleInputChange({ field: 'first_name', value: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={referralData.last_name}
                                            onChange={(e) => handleInputChange({ field: 'last_name', value: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={referralData.email}
                                        onChange={(e) => handleInputChange({ field: 'email', value: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={referralData.phone_number}
                                        onChange={(e) => handleInputChange({ field: 'phone_number', value: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Job Information */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Position Details</h3>

                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Job ID <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                                </label>
                                <div className="relative">
                                    <BriefcaseIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={referralData.job_id}
                                        onChange={(e) => handleInputChange({ field: 'job_id', value: e.target.value })}
                                        placeholder="e.g., R-12345, JOB-2024-001"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-gray-500 font-medium">
                                    Enter the specific job posting ID if available
                                </p>
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Job Role/Title <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <BriefcaseIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={referralData.job_role}
                                        onChange={(e) => handleInputChange({ field: 'job_role', value: e.target.value })}
                                        placeholder="e.g., Software Engineer, Data Scientist"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                        required
                                    />
                                </div>
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
                                                handleInputChange({ field: 'resume_id', value: resume.id });
                                            }}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${isSelected
                                                    ? 'bg-emerald-50 border-emerald-500 shadow-md'
                                                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
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
                    </div>
                )
            }
        />
    )
}

export default ReferralCreate;