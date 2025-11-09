import { useState } from 'react'
import axiosInstance from '../../axiosConfig';

import { countries } from '../../data/data';
import { FormCheckBox, FormInput, FormSelect } from '../_custom/FormInputs';
import SlideOverForm from '../_custom/SlideOver/SlideOverCreate';
import SuccessFeedback from '../_custom/Alert/SuccessFeedback';
import { setNestedPropertyValue } from '../../utils';


const CompanyCreate = ({ setCreateCompany }) => {

    const [companyData, setCompanyData] = useState({});

    const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);


    const handleInputChange = ({ field, value }) => {
        setCompanyData((prevAppData) =>
            setNestedPropertyValue({ ...prevAppData }, field, value)
        );
    };

    return (
        <SlideOverForm
            title={"New Application"}
            setHandler={setCreateCompany}
            requestHandler={() => { }}
            children={<div className="flex flex-1 flex-col justify-between">
                <div className=" space-y-6  px-4 sm:px-6">
                    {showSuccessFeedback &&
                        <SuccessFeedback
                            message={"Application successfully added."}
                            setShowSuccessFeedback={setShowSuccessFeedback}
                        />
                    }

                    <FormInput
                        label={"Name"}
                        field="name"
                        handleInputChange={handleInputChange}
                        required={true}
                    />

                    <FormInput
                        label={"Domain (eg: microsoft.com, c3.ai)"}
                        field="domain"
                        handleInputChange={handleInputChange}
                        required={true}
                    />


                    <div className="flex justify-between space-x-1">
                        <FormSelect label="Country" field="location.country" data={countries} handleInputChange={handleInputChange} required={false} />
                        <FormInput label="City" field="location.city" data={[]} handleInputChange={handleInputChange} required={false} />
                    </div>

                    <div className="border-t pt-2">
                        <FormSelect label="Can refer?" field="status" data={["Yes", "No"]} handleInputChange={handleInputChange} required={true} />
                        <div className="flex space-x-6 mt-3">
                            <span className='italic text-sky-700 font-semibold'>Need: </span>
                            <FormCheckBox label={"Resume"} field={"resume"} handleInputChange={handleInputChange} />
                            <FormCheckBox label={"Essay"} field={"essay"} handleInputChange={handleInputChange} />
                            <FormCheckBox label={"Contact"} field={"contact"} handleInputChange={handleInputChange} />
                        </div>
                    </div>
                </div >
            </div >}
        />
    )
}

export default CompanyCreate;