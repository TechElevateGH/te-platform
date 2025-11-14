import { useState } from 'react'
import axiosInstance from '../../axiosConfig';
import { jobStatuses } from './ApplicationInfo'

import SlideOverForm from '../_custom/SlideOver/SlideOverCreate'
import { setNestedPropertyValue } from '../../utils'
import { countries, jobLevels, jobTitles } from '../../data/jobData'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import SuccessFeedback from '../_custom/Alert/SuccessFeedback'
import { FormInput, FormTextArea } from '../_custom/FormInputs'
import CompanyCombobox from '../_custom/CompanyCombobox'
import SelectCombobox from '../_custom/SelectCombobox'
import { BriefcaseIcon, AcademicCapIcon, GlobeAltIcon } from '@heroicons/react/20/solid'


export const customInputMap = {
    "title": "showCustomJobTitle",
    "role": "showCustomJobRole",
    "company": "showCustomCompany"
}

const ApplicationCreate = ({ setAddApplication }) => {
    const { userId, accessToken } = useAuth();
    const { setFetchApplications, companies } = useData();

    const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const [appData, setAppData] = useState({
        company: "",
        title: "",
        role: "",
        deadline: "",
        notes: "",
        status: "Submitted",
        referred: false,
        recruiter_name: "",
        recruiter_email: "",
        location: {
            country: "",
            city: "",
        }
    })

    const createUserApplicationRequest = async () => {
        setSubmitError("");
        setShowSuccessFeedback(false);
        setIsSubmitting(true);

        try {
            await axiosInstance.post(`/users/${userId}/applications`,
                appData,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

            setShowSuccessFeedback(true);
            setTimeout(() => {
                setFetchApplications(true);
                setAddApplication(null);
            }, 1500);

            return true;
        } catch (error) {
            console.error('Error creating application:', error);
            setSubmitError(error.response?.data?.detail || 'Failed to create application. Please try again.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleInputChange = ({ field, value }) => {
        setAppData((prevAppData) =>
            setNestedPropertyValue({ ...prevAppData }, field, value)
        );
    };



    return (
        <SlideOverForm
            title={"New Application"}
            setHandler={setAddApplication}
            requestHandler={createUserApplicationRequest}
            isSubmitting={isSubmitting}
            children={
                <div className="px-6 py-6 space-y-6">
                    {showSuccessFeedback && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <SuccessFeedback
                                message={"Application successfully added."}
                                setShowSuccessFeedback={setShowSuccessFeedback}
                            />
                        </div>
                    )}

                    {submitError && (
                        <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm font-semibold text-red-900 dark:text-red-200">
                            {submitError}
                        </div>
                    )}

                    {/* Company Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                            Company Information
                        </h3>
                        <CompanyCombobox
                            companies={companies.map(c => c.name)}
                            value={appData.company}
                            onChange={(company) => handleInputChange({ field: 'company', value: company })}
                            required={true}
                        />
                    </div>

                    {/* Position Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                            Position Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <SelectCombobox
                                label="Title"
                                options={jobTitles}
                                value={appData.title}
                                onChange={(title) => handleInputChange({ field: 'title', value: title })}
                                placeholder="Type or select a title..."
                                icon={BriefcaseIcon}
                                required={true}
                            />
                            <SelectCombobox
                                label="Level"
                                options={jobLevels}
                                value={appData.role}
                                onChange={(level) => handleInputChange({ field: 'role', value: level })}
                                placeholder="Type or select a level..."
                                icon={AcademicCapIcon}
                                required={true}
                            />
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                            Application Status
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <SelectCombobox
                                label="Status"
                                options={Object.keys(jobStatuses)}
                                value={appData.status}
                                onChange={(status) => handleInputChange({ field: 'status', value: status })}
                                placeholder="Select status..."
                                required={false}
                            />
                            <SelectCombobox
                                label="Referred?"
                                options={["No", "Yes"]}
                                value={appData.referred ? "Yes" : "No"}
                                onChange={(value) => handleInputChange({ field: 'referred', value: value === "Yes" })}
                                placeholder="Select..."
                                required={false}
                            />
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                            Location
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <SelectCombobox
                                label="Country"
                                options={countries}
                                value={appData.location.country}
                                onChange={(country) => handleInputChange({ field: 'location.country', value: country })}
                                placeholder="Type or select a country..."
                                icon={GlobeAltIcon}
                                required={false}
                            />
                            <FormInput
                                label="City"
                                field="location.city"
                                handleInputChange={handleInputChange}
                                required={false}
                            />
                        </div>
                    </div>

                    {/* Recruiter Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                            Recruiter Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                label="Recruiter Name"
                                field="recruiter_name"
                                handleInputChange={handleInputChange}
                                required={false}
                            />
                            <FormInput
                                type="email"
                                label="Recruiter Email"
                                field="recruiter_email"
                                handleInputChange={handleInputChange}
                                required={false}
                            />
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-2">
                            Additional Notes
                        </h3>
                        <FormTextArea
                            label="Notes"
                            field="notes"
                            handleInputChange={handleInputChange}
                            required={false}
                        />
                    </div>
                </div>
            }
        />
    )
}


export default ApplicationCreate;

