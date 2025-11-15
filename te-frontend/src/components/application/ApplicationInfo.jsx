import { Fragment, useCallback, useState } from 'react'
import { PencilIcon, TrashIcon, ArchiveBoxIcon } from '@heroicons/react/20/solid'
import { useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import axiosInstance from '../../axiosConfig';

import { useAuth } from '../../context/AuthContext'
import { FormInput } from '../_custom/FormInputs'
import SelectCombobox from '../_custom/SelectCombobox'
import { setNestedPropertyValue, getCompanyLogoUrl, handleCompanyLogoError } from '../../utils'
import { countries } from '../../data/jobData'

export const jobStatuses = {
    "Offer": 'text-emerald-700 bg-emerald-50 ring-emerald-600/20 border border-emerald-200',
    "HR": 'text-blue-700 bg-blue-50 ring-blue-600/20 border border-blue-200',
    "Phone interview": 'text-blue-700 bg-blue-50 ring-blue-600/20 border border-blue-200',
    "Final interview": 'text-blue-700 bg-blue-50 ring-blue-600/20 border border-blue-200',
    "OA": 'text-blue-700 bg-blue-50 ring-blue-600/20 border border-blue-200',
    "Submitted": 'text-amber-700 bg-amber-50 ring-amber-600/20 border border-amber-200',
    "Rejected": 'text-gray-700 bg-gray-50 ring-gray-600/20 border border-gray-200',
}

const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ')
}

const ApplicationInfo = ({ applicationId, setApplicationId, application, setApplication,
    archiveUserApplicationRequest, deleteUserApplicationRequest, refreshApplications }) => {
    const { accessToken, userRole, userId } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [updateData, setUpdateData] = useState({});

    // Check user role - Member (1), Lead (4), and Admin (5) can edit
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const canEdit = userRoleInt === 1 || userRoleInt === 4 || userRoleInt === 5;

    const getUserApplicationRequest = useCallback(async () => {
        axiosInstance.get(`/applications/${applicationId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((response) => {
                setApplication(response.data.application)
            })
            .catch((error) => {
                console.error('Error fetching application:', error);
            });
    }, [accessToken, applicationId, setApplication]);


    useEffect(() => {
        const fetchData = async () => {
            if (application === null) {
                await getUserApplicationRequest();
            }
        }
        fetchData();

    }, [application, applicationId, getUserApplicationRequest])

    useEffect(() => {
        if (application) {
            setUpdateData({
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
            });
        }
    }, [application]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        if (application) {
            setUpdateData({
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
            });
        }
        setIsEditing(false);
    };

    const handleSave = () => {
        const dataToSend = {
            ...updateData,
            referred: updateData.referred === "Yes" || updateData.referred === true
        };

        axiosInstance.patch(`/users/${userId}/applications/${application.id}`,
            dataToSend,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
            .then((response) => {
                // Fetch the updated application to get the latest data
                getUserApplicationRequest();
                setIsEditing(false);
                // Trigger refresh of applications list
                if (refreshApplications) {
                    refreshApplications();
                }
            })
            .catch((error) => {
                console.error('Error updating application:', error);
            });
    };

    const handleInputChange = ({ field, value }) => {
        setUpdateData(setNestedPropertyValue({ ...updateData }, field, value));
    };

    const closeModal = () => {
        setApplicationId(null);
        setApplication(null);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
            deleteUserApplicationRequest([application.id]);
            closeModal();
        }
    };

    const handleArchive = () => {
        if (window.confirm('Are you sure you want to archive this application?')) {
            archiveUserApplicationRequest([application.id]);
            closeModal();
        }
    };

    return (
        <Transition.Root show={application !== null} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={closeModal}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-3 sm:px-4 pb-4 pt-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-5">
                                {application && (
                                    <>
                                        {/* Header */}
                                        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                                                    <img
                                                        src={getCompanyLogoUrl(application.company)}
                                                        alt={application.company}
                                                        className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700"
                                                        onError={handleCompanyLogoError}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                                                        {application.company}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                        {application.title}, {application.role}
                                                    </p>
                                                </div>
                                            </div>
                                            {canEdit && (
                                                <button
                                                    type="button"
                                                    className="rounded-full bg-white dark:bg-gray-700 p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                                                    onClick={isEditing ? handleCancel : handleEdit}
                                                >
                                                    <PencilIcon className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                                            {!isEditing ? (
                                                // View Mode
                                                <>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Location</label>
                                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                                {application.location?.city}, {application.location?.country}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
                                                            <span className={classNames(
                                                                jobStatuses[application.status],
                                                                'mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset'
                                                            )}>
                                                                {application.status}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Referred</label>
                                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                                {application.referred === true ? "Yes" : "No"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Added on</label>
                                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">{application.date}</p>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                                        <h4 className="text-xs font-medium text-gray-900 dark:text-white">Recruiter Information</h4>
                                                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400">Name</label>
                                                                <p className="mt-0.5 text-sm text-gray-900 dark:text-white break-words">
                                                                    {application.recruiter_name || 'Not provided'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-500 dark:text-gray-400">Email</label>
                                                                <p className="mt-0.5 text-sm text-gray-900 dark:text-white break-all">
                                                                    {application.recruiter_email || 'Not provided'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                                        <h4 className="text-xs font-medium text-gray-900 dark:text-white">Notes</h4>
                                                        <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                            {application.notes || 'No notes added'}
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                // Edit Mode
                                                <>
                                                    {/* Location Section */}
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Location</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                            <SelectCombobox
                                                                label="Country"
                                                                options={countries}
                                                                value={updateData.location?.country || ''}
                                                                onChange={(country) => handleInputChange({ field: 'location.country', value: country })}
                                                                placeholder="Select country..."
                                                            />
                                                            <FormInput
                                                                field="location.city"
                                                                label="City"
                                                                value={updateData.location?.city || ''}
                                                                handleInputChange={handleInputChange}
                                                                required
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Status Section */}
                                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Status</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                            <SelectCombobox
                                                                label="Application Status"
                                                                options={["Submitted", "OA", "Phone interview", "Final interview", "HR", "Offer", "Rejected"]}
                                                                value={updateData.status || ''}
                                                                onChange={(status) => handleInputChange({ field: 'status', value: status })}
                                                                placeholder="Select status..."
                                                            />
                                                            <SelectCombobox
                                                                label="Referred"
                                                                options={["Yes", "No"]}
                                                                value={updateData.referred === true || updateData.referred === "Yes" ? "Yes" : "No"}
                                                                onChange={(referred) => handleInputChange({ field: 'referred', value: referred })}
                                                                placeholder="Select..."
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Recruiter Section */}
                                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recruiter Information</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                            <FormInput
                                                                field="recruiter_name"
                                                                label="Recruiter Name"
                                                                value={updateData.recruiter_name || ''}
                                                                handleInputChange={handleInputChange}
                                                            />
                                                            <FormInput
                                                                field="recruiter_email"
                                                                label="Recruiter Email"
                                                                type="email"
                                                                value={updateData.recruiter_email || ''}
                                                                handleInputChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Notes Section */}
                                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4">
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Notes</h4>
                                                        <textarea
                                                            rows={4}
                                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                            value={updateData.notes || ''}
                                                            onChange={(e) => handleInputChange({ field: 'notes', value: e.target.value })}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-3 sm:mt-4 flex flex-col-reverse sm:flex-row justify-between gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                                            {isEditing ? (
                                                <>
                                                    <div></div>
                                                    <div className="flex flex-col-reverse sm:flex-row gap-2">
                                                        <button
                                                            type="button"
                                                            className="rounded-md bg-white dark:bg-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                            onClick={handleCancel}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="rounded-md bg-blue-600 dark:bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 dark:hover:bg-blue-600"
                                                            onClick={handleSave}
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {canEdit && (
                                                        <div className="flex flex-col sm:flex-row gap-2">
                                                            <button
                                                                type="button"
                                                                className="flex items-center justify-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
                                                                onClick={handleArchive}
                                                            >
                                                                <ArchiveBoxIcon className="h-3.5 w-3.5" />
                                                                Archive
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="flex items-center justify-center gap-1.5 rounded-md bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all"
                                                                onClick={handleDelete}
                                                            >
                                                                <TrashIcon className="h-3.5 w-3.5" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="rounded-md bg-white dark:bg-gray-700 px-3 py-1.5 text-sm font-semibold text-gray-900 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                                                        onClick={closeModal}
                                                    >
                                                        Close
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default ApplicationInfo;

