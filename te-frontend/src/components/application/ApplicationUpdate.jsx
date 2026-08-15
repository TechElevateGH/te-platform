import { Fragment, useCallback, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from 'icons'
import { useEffect } from 'react'
import axiosInstance from '../../axiosConfig';

import { useAuth } from '../../context/AuthContext'
import { FormSelect, FormInput } from '../_custom/FormInputs'
import { setNestedPropertyValue, getCompanyLogoUrl, handleCompanyLogoError } from '../../utils'
import { jobStatuses } from './ApplicationInfo'
import { customInputMap } from './ApplicationCreate'
import { countries } from '../../data/data'

const ApplicationUpdate = ({ application, setApplication, setUpdateApplication }) => {
    const { accessToken } = useAuth();

    const [updateData, setUpdateData] = useState({
        id: application.id,
        status: application.status,
        referred: application.referred,
        notes: application.notes,
        recruiter_name: application.recruiter_name,
        recruiter_email: application.recruiter_email,
        location: {
            country: application.location?.country,
            city: application.location?.city
        }
    })

    const [showCustomInputs, setShowCustomInputs] = useState({
        showCustomCompany: false,
        showCustomJobTitle: false,
        showCustomJobRole: false,
        showCustomStatus: false,
    })

    const updateUserApplicationRequest = useCallback(() => {
        const dataToSend = {
            ...updateData,
            referred: updateData.referred === "Yes" || updateData.referred === true
        };

        axiosInstance.put(`/applications/${application.id}`,
            dataToSend,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((response) => {
                setApplication(response.data.application)
            })
            .catch((error) => {
                console.error('Error updating application:', error);
            });
    }, [updateData, application.id, accessToken, setApplication]);

    useEffect(() => {
        if (application === null) {
            updateUserApplicationRequest();
        }
    }, [application, updateUserApplicationRequest])

    const updateApplication = () => {
        updateUserApplicationRequest();
        setUpdateApplication(false);
    }

    const handleInputChange = ({ field, value, hideCustomInput = true }) => {
        if (value === "Other.......") {
            setShowCustomInputs({ ...showCustomInputs, [customInputMap[field]]: true });
            setUpdateData(setNestedPropertyValue({ ...updateData }, field, ""));
        } else {
            if (hideCustomInput) {
                setShowCustomInputs({ ...showCustomInputs, [customInputMap[field]]: false });
            }
            setUpdateData(setNestedPropertyValue({ ...updateData }, field, value))
        }
    };

    return (
        <>
            {application !== null && (
                <Transition.Root show={true} as={Fragment}>
                    <Dialog as="div" className="relative z-50" onClose={() => setApplication(null)}>
                        {/* Backdrop */}
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/60 transition-all" />
                        </Transition.Child>

                        <div className="fixed inset-0 z-10 overflow-y-auto">
                            <div className="flex min-h-full items-center justify-center p-4">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 scale-95 translate-y-4"
                                    enterTo="opacity-100 scale-100 translate-y-0"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 scale-100 translate-y-0"
                                    leaveTo="opacity-0 scale-95 translate-y-4"
                                >
                                    <Dialog.Panel className="te-card relative w-full max-w-2xl transform overflow-hidden text-left transition-all">
                                        {/* Header */}
                                        <div className="relative border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-6 py-5">
                                            <div className="relative flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        width="32"
                                                        height="32"
                                                        alt={application.company.name}
                                                        className="rounded-lg border border-[var(--te-border)] bg-[var(--te-surface)]"
                                                        src={getCompanyLogoUrl(application.company.name)}
                                                        onError={handleCompanyLogoError}
                                                    />
                                                    <div>
                                                        <span className="te-eyebrow text-[10px]">Update application</span>
                                                        <Dialog.Title className="mt-1 font-display text-xl font-semibold text-[var(--te-text)]">
                                                            {application.company.name}
                                                        </Dialog.Title>
                                                        <p className="text-sm text-[var(--te-text-dim)]">
                                                            {application.title}, {application.role}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="te-icon-btn"
                                                    onClick={() => setApplication(null)}
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="max-h-[calc(100vh-16rem)] space-y-5 overflow-y-auto px-6 py-6 te-scroll">
                                            {/* Location Section */}
                                            <div className="te-panel space-y-4 p-4">
                                                <h3 className="te-eyebrow">Location</h3>
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <FormSelect
                                                        label="Country"
                                                        field="location.country"
                                                        data={countries}
                                                        value={updateData.location.country}
                                                        handleInputChange={handleInputChange}
                                                    />
                                                    <FormInput
                                                        label="City"
                                                        type='text'
                                                        field="location.city"
                                                        value={updateData.location.city}
                                                        handleInputChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            {/* Status Section */}
                                            <div className="te-panel space-y-4 p-4">
                                                <h3 className="te-eyebrow">Application status</h3>
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <FormSelect
                                                        label="Status"
                                                        field="status"
                                                        data={Object.keys(jobStatuses)}
                                                        value={updateData.status}
                                                        handleInputChange={handleInputChange}
                                                    />
                                                    <FormSelect
                                                        label="Referred?"
                                                        field="referred"
                                                        data={["Yes", "No"]}
                                                        value={updateData.referred === true || updateData.referred === "Yes" ? "Yes" : "No"}
                                                        handleInputChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            {/* Recruiter Section */}
                                            <div className="te-panel space-y-4 p-4">
                                                <h3 className="te-eyebrow">Recruiter information</h3>
                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                    <FormInput
                                                        label="Recruiter Name"
                                                        type='text'
                                                        field="recruiter_name"
                                                        value={updateData.recruiter_name}
                                                        handleInputChange={handleInputChange}
                                                    />
                                                    <FormInput
                                                        label="Recruiter Email"
                                                        type="email"
                                                        field="recruiter_email"
                                                        value={updateData.recruiter_email}
                                                        handleInputChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>

                                            {/* Notes Section */}
                                            <div className="te-panel space-y-4 p-4">
                                                <h3 className="te-eyebrow">Notes</h3>
                                                <FormInput
                                                    label="Notes"
                                                    type='text'
                                                    field="notes"
                                                    value={updateData.notes || ''}
                                                    handleInputChange={handleInputChange}
                                                    placeholder="Add notes about this application..."
                                                />
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-end gap-3 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)] px-6 py-4">
                                            <button
                                                type="button"
                                                className="te-btn-secondary"
                                                onClick={() => setApplication(null)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="te-btn-primary"
                                                onClick={updateApplication}
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition.Root>
            )}
        </>
    )
}


export default ApplicationUpdate;
