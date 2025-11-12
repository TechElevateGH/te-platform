import { useState } from 'react'

import axiosInstance from '../../axiosConfig';
import { countries } from '../../data/data';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { FormCheckBox, FormInput, FormSelect } from '../_custom/FormInputs';
import SlideOverForm from '../_custom/SlideOver/SlideOverCreate';
import SuccessFeedback from '../_custom/Alert/SuccessFeedback';
import { setNestedPropertyValue } from '../../utils';

const initialCompanyState = {
    name: "",
    domain: "",
    location: {
        country: "",
        city: "",
    },
    can_refer: true,
    referral_materials: {
        resume: false,
        essay: false,
        contact: false,
    },
};

const CompanyCreate = ({ setCreateCompany }) => {
    const { accessToken } = useAuth();
    const { setFetchCompanies } = useData();

    const [companyData, setCompanyData] = useState({ ...initialCompanyState });
    const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");

    const handleInputChange = ({ field, value }) => {
        if (field === 'can_refer') {
            value = value === true || value === 'Yes';
        }

        setCompanyData((prevData) =>
            setNestedPropertyValue({ ...prevData }, field, value)
        );
    };

    const createCompanyRequest = async () => {
        setSubmitError("");
        setShowSuccessFeedback(false);
        setIsSubmitting(true);

        if (!accessToken) {
            setSubmitError('You must be signed in to add a company.');
            setIsSubmitting(false);
            return false;
        }

        const payload = {
            name: companyData.name.trim(),
            domain: companyData.domain.trim(),
            location: {
                country: companyData.location.country,
                city: companyData.location.city,
            },
            can_refer: companyData.can_refer,
            referral_materials: {
                resume: companyData.referral_materials.resume,
                essay: companyData.referral_materials.essay,
                contact: companyData.referral_materials.contact,
            },
        };

        if (!payload.name || !payload.domain) {
            setSubmitError('Please provide both a company name and domain.');
            setIsSubmitting(false);
            return false;
        }

        try {
            await axiosInstance.post('/companies', payload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            setShowSuccessFeedback(true);
            setFetchCompanies(true);
            setCompanyData({ ...initialCompanyState });

            setTimeout(() => {
                setCreateCompany(null);
            }, 1500);

            return true;
        } catch (error) {
            console.error('Error creating company:', error);
            setSubmitError(error.response?.data?.detail || 'Failed to create company. Please try again.');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SlideOverForm
            title={"New Company"}
            setHandler={setCreateCompany}
            requestHandler={createCompanyRequest}
            isSubmitting={isSubmitting}
            children={<div className="flex flex-1 flex-col justify-between">
                <div className="space-y-6 px-4 sm:px-6">
                    {showSuccessFeedback &&
                        <SuccessFeedback
                            message={"Company successfully added."}
                            setShowSuccessFeedback={setShowSuccessFeedback}
                        />
                    }

                    {submitError && (
                        <div className="rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm font-semibold text-red-900 dark:text-red-200">
                            {submitError}
                        </div>
                    )}

                    <FormInput
                        label={"Name"}
                        field="name"
                        value={companyData.name}
                        handleInputChange={handleInputChange}
                        required={true}
                    />

                    <FormInput
                        label={"Domain (eg: microsoft.com, c3.ai)"}
                        field="domain"
                        value={companyData.domain}
                        handleInputChange={handleInputChange}
                        required={true}
                    />

                    <div className="flex justify-between space-x-1">
                        <FormSelect
                            label="Country"
                            field="location.country"
                            data={countries}
                            value={companyData.location.country}
                            handleInputChange={handleInputChange}
                            required={false}
                        />
                        <FormInput
                            label="City"
                            field="location.city"
                            value={companyData.location.city}
                            handleInputChange={handleInputChange}
                            required={false}
                        />
                    </div>

                    <div className="border-t pt-2">
                        <FormSelect
                            label="Can refer?"
                            field="can_refer"
                            data={["Yes", "No"]}
                            value={companyData.can_refer ? "Yes" : "No"}
                            handleInputChange={handleInputChange}
                            required={true}
                        />
                        <div className="flex space-x-6 mt-3">
                            <span className='italic text-sky-700 font-semibold'>Need: </span>
                            <FormCheckBox
                                label={"Resume"}
                                field={"referral_materials.resume"}
                                checked={companyData.referral_materials.resume}
                                handleInputChange={handleInputChange}
                            />
                            <FormCheckBox
                                label={"Referral Essay"}
                                field={"referral_materials.essay"}
                                checked={companyData.referral_materials.essay}
                                handleInputChange={handleInputChange}
                            />
                            <FormCheckBox
                                label={"Contact"}
                                field={"referral_materials.contact"}
                                checked={companyData.referral_materials.contact}
                                handleInputChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div >
            </div >}
        />
    )
}

export default CompanyCreate;