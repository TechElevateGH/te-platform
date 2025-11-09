import { Fragment, useCallback, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import axiosInstance from '../../axiosConfig';

import { useAuth } from '../../context/AuthContext'
import { FormSelect, FormInput } from '../_custom/FormInputs'
import { setNestedPropertyValue } from '../../utils'
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

        axiosInstance.put(`/applications/${application.id}/update`,
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
                console.log(error);
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
        console.log(field, value)
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
                            <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-md transition-all" />
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
                                    <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-2xl">
                                        {/* Header */}
                                        <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 px-6 py-5">
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
                                            <div className="relative flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        width="32"
                                                        height="32"
                                                        alt={application.company.name}
                                                        className="rounded-lg ring-2 ring-white/30"
                                                        src={application.company.image}
                                                    />
                                                    <div>
                                                        <Dialog.Title className="text-xl font-bold text-white">
                                                            {application.company.name}
                                                        </Dialog.Title>
                                                        <p className="text-sm text-white/80">
                                                            {application.title}, {application.role}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                                                    onClick={() => setApplication(null)}
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-6 py-6 space-y-6">
                                            {/* Location Section */}
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location</h3>
                                                <div className="grid grid-cols-2 gap-4">
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
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Application Status</h3>
                                                <div className="grid grid-cols-2 gap-4">
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
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recruiter Information</h3>
                                                <div className="grid grid-cols-2 gap-4">
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
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</h3>
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
                                        <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                                            <button
                                                type="button"
                                                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-200 border border-gray-300"
                                                onClick={() => setApplication(null)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-200"
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

