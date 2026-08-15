import { Fragment, useCallback, useState } from 'react'
import { PencilIcon, TrashIcon, ArchiveBoxIcon } from 'icons'
import { useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import axiosInstance from '../../axiosConfig';

import { useAuth } from '../../context/AuthContext'
import { FormInput } from '../_custom/FormInputs'
import SelectCombobox from '../_custom/SelectCombobox'
import { setNestedPropertyValue, getCompanyLogoUrl, handleCompanyLogoError } from '../../utils'
import { countries } from '../../data/jobData'

export const jobStatuses = {
    "Offer": 'te-chip-green',
    "HR": 'te-chip-gold',
    "Phone interview": 'te-chip-gold',
    "Final interview": 'te-chip-gold',
    "OA": 'te-chip-gold',
    "Submitted": 'te-chip-gold',
    "Rejected": 'te-chip-red',
}

const classNames = (...classes) => {
    return classes.filter(Boolean).join(' ')
}

const ApplicationInfo = ({ applicationId, setApplicationId, application, setApplication,
    archiveUserApplicationRequest, deleteUserApplicationRequest, refreshApplications }) => {
    const { accessToken, userRole, userId } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [updateData, setUpdateData] = useState({});

    // Confirmation modal state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        confirmText: 'Confirm',
        confirmStyle: 'danger'
    });

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
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Application',
            message: 'Are you sure you want to delete this application? This action cannot be undone.',
            onConfirm: () => {
                deleteUserApplicationRequest([application.id]);
                closeModal();
                setConfirmDialog({ ...confirmDialog, isOpen: false });
            },
            confirmText: 'Delete',
            confirmStyle: 'danger'
        });
    };

    const handleArchive = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Archive Application',
            message: 'Are you sure you want to archive this application?',
            onConfirm: () => {
                archiveUserApplicationRequest([application.id]);
                closeModal();
                setConfirmDialog({ ...confirmDialog, isOpen: false });
            },
            confirmText: 'Archive',
            confirmStyle: 'primary'
        });
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
                    <div className="fixed inset-0 bg-black/60 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="te-card relative transform overflow-hidden text-left transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                                {application && (
                                    <>
                                        {/* Header */}
                                        <div className="flex items-center justify-between gap-4 border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-5 py-4">
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                <div className="relative h-10 w-10 flex-shrink-0">
                                                    <img
                                                        src={getCompanyLogoUrl(application.company)}
                                                        alt={application.company}
                                                        className="h-10 w-10 rounded-lg border border-[var(--te-border)] bg-[var(--te-surface)] object-cover"
                                                        onError={handleCompanyLogoError}
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="te-eyebrow text-[10px]">Application detail</span>
                                                    <h3 className="mt-1 truncate font-display text-lg font-semibold text-[var(--te-text)]">
                                                        {application.company}
                                                    </h3>
                                                    <p className="truncate text-sm text-[var(--te-text-dim)]">
                                                        {application.title}, {application.role}
                                                    </p>
                                                </div>
                                            </div>
                                            {canEdit && (
                                                <button
                                                    type="button"
                                                    className="te-icon-btn flex-shrink-0"
                                                    onClick={isEditing ? handleCancel : handleEdit}
                                                >
                                                    <PencilIcon className="h-4 w-4" aria-hidden="true" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="max-h-[calc(100vh-16rem)] space-y-4 overflow-y-auto px-5 py-5 te-scroll">
                                            {!isEditing ? (
                                                // View Mode
                                                <>
                                                    <div className="grid grid-cols-1 gap-px overflow-hidden border border-[var(--te-border)] bg-[var(--te-border)] sm:grid-cols-2">
                                                        <div className="bg-[var(--te-surface)] p-4">
                                                            <label className="te-eyebrow text-[10px]">Location</label>
                                                            <p className="mt-1 text-sm text-[var(--te-text)]">
                                                                {application.location?.city}, {application.location?.country}
                                                            </p>
                                                        </div>
                                                        <div className="bg-[var(--te-surface)] p-4">
                                                            <label className="te-eyebrow text-[10px]">Status</label>
                                                            <span className={classNames(
                                                                jobStatuses[application.status],
                                                                'mt-2 inline-flex px-2.5 py-1 text-xs font-semibold font-mono uppercase tracking-wide'
                                                            )}>
                                                                {application.status}
                                                            </span>
                                                        </div>
                                                        <div className="bg-[var(--te-surface)] p-4">
                                                            <label className="te-eyebrow text-[10px]">Referred</label>
                                                            <p className="mt-1 text-sm text-[var(--te-text)]">
                                                                {application.referred === true ? <span className="te-badge-green">Yes</span> : <span className="text-[var(--te-text-dim)]">No</span>}
                                                            </p>
                                                        </div>
                                                        <div className="bg-[var(--te-surface)] p-4">
                                                            <label className="te-eyebrow text-[10px]">Added on</label>
                                                            <p className="mt-1 text-sm text-[var(--te-text)]">{application.date}</p>
                                                        </div>
                                                    </div>

                                                    <div className="te-panel p-4">
                                                        <h4 className="te-eyebrow">Recruiter information</h4>
                                                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                            <div>
                                                                <label className="block font-mono text-[10px] uppercase tracking-wide text-[var(--te-text-dim)]">Name</label>
                                                                <p className="mt-0.5 text-sm text-[var(--te-text)] break-words">
                                                                    {application.recruiter_name || 'Not provided'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <label className="block font-mono text-[10px] uppercase tracking-wide text-[var(--te-text-dim)]">Email</label>
                                                                <p className="mt-0.5 text-sm text-[var(--te-text)] break-all">
                                                                    {application.recruiter_email || 'Not provided'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="te-panel p-4">
                                                        <h4 className="te-eyebrow">Notes</h4>
                                                        <p className="mt-1.5 text-sm text-[var(--te-text-dim)]">
                                                            {application.notes || 'No notes added'}
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                // Edit Mode
                                                <>
                                                    {/* Location Section */}
                                                    <div className="te-panel p-4">
                                                        <h4 className="te-eyebrow mb-3">Location</h4>
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
                                                    <div className="te-panel p-4">
                                                        <h4 className="te-eyebrow mb-3">Status</h4>
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
                                                    <div className="te-panel p-4">
                                                        <h4 className="te-eyebrow mb-3">Recruiter information</h4>
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
                                                    <div className="te-panel p-4">
                                                        <h4 className="te-eyebrow mb-3">Notes</h4>
                                                        <textarea
                                                            rows={4}
                                                            className="te-textarea w-full"
                                                            value={updateData.notes || ''}
                                                            onChange={(e) => handleInputChange({ field: 'notes', value: e.target.value })}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="flex flex-col-reverse justify-between gap-2 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)] px-5 py-4 sm:flex-row">
                                            {isEditing ? (
                                                <>
                                                    <div></div>
                                                    <div className="flex flex-col-reverse sm:flex-row gap-2">
                                                        <button
                                                            type="button"
                                                            className="te-btn-secondary"
                                                            onClick={handleCancel}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="te-btn-primary"
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
                                                                className="te-btn-secondary te-btn-sm flex items-center justify-center gap-1.5"
                                                                onClick={handleArchive}
                                                            >
                                                                <ArchiveBoxIcon className="h-4 w-4 text-te-red" />
                                                                Archive
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="te-btn-danger te-btn-sm flex items-center justify-center gap-1.5"
                                                                onClick={handleDelete}
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="te-btn-secondary"
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

                {/* Confirmation Dialog */}
                {confirmDialog.isOpen && (
                    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                        <div className="te-card max-w-md w-full overflow-hidden">
                            <div className={`border-b border-[var(--te-border)] px-6 py-4 ${confirmDialog.confirmStyle === 'danger' ? 'bg-[var(--te-red-soft)]' : 'bg-[var(--te-surface-alt)]'}`}>
                                <h3 className={`font-display text-lg font-semibold ${confirmDialog.confirmStyle === 'danger' ? 'text-te-red' : 'text-[var(--te-text)]'}`}>
                                    {confirmDialog.title}
                                </h3>
                            </div>
                            <div className="px-6 py-5">
                                <p className="text-[var(--te-text)] leading-relaxed">
                                    {confirmDialog.message}
                                </p>
                            </div>
                            <div className="px-6 py-4 bg-[var(--te-surface-alt)] flex items-center justify-end gap-3 border-t border-[var(--te-border)]">
                                <button
                                    onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                                    className="te-btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDialog.onConfirm}
                                    className={`${confirmDialog.confirmStyle === 'danger'
                                            ? 'te-btn-danger'
                                            : 'te-btn-primary'
                                        }`}
                                >
                                    {confirmDialog.confirmText}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Dialog>
        </Transition.Root>
    )
}

export default ApplicationInfo;
