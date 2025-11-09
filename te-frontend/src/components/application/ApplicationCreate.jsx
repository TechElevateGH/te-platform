import { useState } from 'react'
import axiosInstance from '../../axiosConfig';
import { jobStatuses } from './ApplicationInfo'

import SlideOverForm from '../_custom/SlideOver/SlideOverCreate'
import { setNestedPropertyValue } from '../../utils'
import { countries, jobLevels, jobTitles } from '../../data/data'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import SuccessFeedback from '../_custom/Alert/SuccessFeedback'
import { FormSelect, FormInput, FormTextArea } from '../_custom/FormInputs'
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

    const [appData, setAppData] = useState({
        company: "",
        title: "",
        role: "",
        deadline: "",
        notes: "",
        status: "",
        referred: false,
        recruiter_name: "",
        recruiter_email: "",
        location: {
            country: "",
            city: "",
        }
    })

    const createUserApplicationRequest = () => {
        axiosInstance.post(`/users/${userId}/applications`,
            appData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((_) => {
                setFetchApplications(true);
                setShowSuccessFeedback(true);
            })
            .catch((error) => {
                console.log(error);
            });

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

                    {/* Company Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company Information</h3>
                        <CompanyCombobox
                            companies={companies}
                            value={appData.company}
                            onChange={(company) => handleInputChange({ field: 'company', value: company })}
                            required={true}
                        />
                    </div>

                    {/* Position Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Position Details</h3>
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
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Application Status</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormSelect
                                label="Status"
                                field="status"
                                data={Object.keys(jobStatuses)}
                                handleInputChange={handleInputChange}
                                required={true}
                            />
                            <FormSelect
                                label="Referred?"
                                field="referred"
                                data={["No", "Yes"]}
                                value={appData.referred ? "Yes" : "No"}
                                handleInputChange={({ field, value }) => {
                                    handleInputChange({ field, value: value === "Yes" });
                                }}
                                required={false}
                            />
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</h3>
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
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recruiter Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormInput
                                label="Recruiter Name"
                                field="recruiter_name"
                                handleInputChange={handleInputChange}
                                required={false}
                            />
                            <FormInput
                                label="Recruiter Email"
                                type="email"
                                field="recruiter_email"
                                handleInputChange={handleInputChange}
                                required={false}
                            />
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Additional Notes</h3>
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

