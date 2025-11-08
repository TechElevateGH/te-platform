import { useState } from 'react'
import axiosInstance from '../../axiosConfig';
import { jobStatuses } from './ApplicationInfo'

import SlideOverForm from '../_custom/SlideOver/SlideOverCreate'
import { setNestedPropertyValue } from '../../utils'
import { countries, jobRoles, jobTitles } from '../../data/data'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import SuccessFeedback from '../_custom/Alert/SuccessFeedback'
import { FormSelect, FormInput, FormTextArea } from '../_custom/FormInputs'
import CompanyCombobox from '../_custom/CompanyCombobox'


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
        company_other: "",
        title: "",
        role: "",
        deadline: "",
        notes: "",
        status: "",
        recruiter_name: "",
        recruiter_email: "",
        location: {
            country: "",
            city: "",
        }
    })

    const createUserApplicationRequest = () => {
        axiosInstance.post(`/users.${userId}.applications.create`,
            {
                ...appData,
                company: appData.company_other ? appData.company_other : appData.company,
                title: appData.title_other ? appData.title_other : appData.title,
                role: appData.role_other ? appData.role_other : appData.role
            },
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
                            <FormSelect
                                label="Title"
                                field="title"
                                data={jobTitles}
                                handleInputChange={handleInputChange}
                                required={true}
                            />
                            <FormSelect
                                label="Role"
                                field="role"
                                data={jobRoles}
                                handleInputChange={handleInputChange}
                                required={true}
                            />
                        </div>

                        {(appData.title === "Other....." || appData.role === "Other.....") && (
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                {appData.title === "Other....." && (
                                    <FormInput
                                        label="Custom Title"
                                        placeholder="Specify title"
                                        field="title_other"
                                        handleInputChange={handleInputChange}
                                        required={true}
                                    />
                                )}
                                {appData.role === "Other....." && (
                                    <FormInput
                                        label="Custom Role"
                                        placeholder="Specify role"
                                        field="role_other"
                                        handleInputChange={handleInputChange}
                                        required={true}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Application Status</h3>
                        <FormSelect
                            label="Status"
                            field="status"
                            data={Object.keys(jobStatuses)}
                            handleInputChange={handleInputChange}
                            required={true}
                        />
                    </div>

                    {/* Location Section */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <FormSelect
                                label="Country"
                                field="location.country"
                                data={countries}
                                handleInputChange={handleInputChange}
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

