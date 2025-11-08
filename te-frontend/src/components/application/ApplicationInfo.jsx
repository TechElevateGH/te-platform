import { Fragment, useCallback, useState } from 'react'
import { LinkIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/20/solid'
import { useEffect } from 'react'
import axiosInstance from '../../axiosConfig';

import SlideOverInfo from '../_custom/SlideOver/SlideOverInfo'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'

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

const ApplicationInfo = ({ applicationId, setApplicationId, application, setApplication, setUpdateApplication,
    archiveUserApplicationRequest, deleteUserApplicationRequest }) => {
    const { userId, accessToken } = useAuth();
    const { setFetchApplications } = useData();

    const getUserApplicationRequest = useCallback(async () => {
        console.log(userId);
        axiosInstance.get(`/applications.${applicationId}.info`,
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
    }, [accessToken, applicationId, setApplication, userId]);


    useEffect(() => {
        const fetchData = async () => {
            if (application === null) {
                await getUserApplicationRequest();
            }
        }
        fetchData();

    }, [application, applicationId, getUserApplicationRequest])

    return (
        <>
            {
                application !== null &&
                <SlideOverInfo
                    entityId={applicationId}
                    setHandler={(val) => { setApplicationId(val); setApplication(null) }}
                    archiveRequest={archiveUserApplicationRequest}
                    deleteRequest={deleteUserApplicationRequest}
                    fetchContent={setFetchApplications}
                    title={
                        <div className="flex rounded-full p-1">
                            <img
                                width="30"
                                height="30"
                                alt=""
                                style={{ marginRight: '5px', marginLeft: '5px', marginTop: '-4px' }}
                                className="company-logo"
                                src={application.company.image}>
                            </img>
                            <h3 className='ml-3'>{application.company.name}</h3>
                        </div>
                    }
                    children={

                        <div className="space-y-6 pb-16 px-3">
                            <div className="mt-4 flex items-start justify-between">
                                <div>
                                    <h3 className="text-base font-semibold leading-6 text-gray-900">
                                        {application.title}, {application.role}
                                    </h3>
                                    <span className='text-slate-500'>{application.location.city}, {application.location.country}</span>
                                </div>
                                <button
                                    type="button"
                                    className=" h-5 w-5 flex items-center justify-center rounded-full bg-white text-blue-400 hover:bg-blue-100 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    onClick={() => setUpdateApplication(true)}
                                >
                                    <PencilIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </div>

                            <div>
                                <dl className="mt-3 divide-y divide-gray-200 border-b border-t border-gray-200">
                                    <div className="flex justify-between py-3 font-medium">
                                        <dt className="text-sky-800">Status</dt>
                                        <dd className={classNames(
                                            jobStatuses[application.status],
                                            'rounded-full flex-none py-1 px-2 text-sm font-medium ring-1 ring-inset'
                                        )}> {application.status}</dd>

                                    </div>
                                    <div className="flex justify-between py-3 font-medium">
                                        <dt className="text-sky-800">Referred</dt>
                                        <dd className="text-gray-900"> {application.referred === true ? "Yes" : "No"}</dd>
                                    </div>
                                    <div className="flex justify-between py-3 font-medium">
                                        <dt className="text-sky-800">Added on</dt>
                                        <dd className="text-gray-900">{application.date} </dd>
                                    </div>
                                    <div className="flex justify-between py-3 font-medium">
                                        <dt className="text-sky-800">Recruiter Name</dt>
                                        <dd className="text-gray-900">{application.recruiter_name}</dd>
                                    </div>
                                    <div className="flex justify-between py-3 font-medium">
                                        <dt className="text-sky-800">Recruiter Email</dt>
                                        <dd className="text-gray-900">{application.recruiter_email}</dd>
                                    </div>
                                </dl>
                            </div>
                            <div>
                                <h3 className="font-medium text-sky-800">Notes</h3>
                                <div className="mt-2 flex items-center justify-between border-b">
                                    <p className="italic text-black">{application.notes} None at the moment</p>
                                </div>
                            </div>
                        </div>
                    }
                />
            }

        </>

    )

}


export default ApplicationInfo;

