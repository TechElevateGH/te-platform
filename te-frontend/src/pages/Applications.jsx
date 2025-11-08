import { useCallback, useEffect, useState } from 'react'
import { HttpStatusCode } from 'axios'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

import { Loading } from '../components/_custom/Loading'
import {
    PlusIcon,
    ArchiveBoxIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    BriefcaseIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon as XCircleIconSolid
} from '@heroicons/react/20/solid'

import axiosInstance from '../axiosConfig'
import ApplicationItem from '../components/application/ApplicationItem'
import ApplicationCreate from '../components/application/ApplicationCreate'
import ApplicationInfo from '../components/application/ApplicationInfo'
import ApplicationUpdate from '../components/application/ApplicationUpdate'

const Applications = () => {
    const { userId, accessToken, logout } = useAuth();
    const { fetchApplications, setFetchApplications, applications, setApplications } = useData();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [applicationId, setApplicationId] = useState(null);
    const [application, setApplication] = useState(null);

    const [addApplication, setAddApplication] = useState(false);
    const [updateApplication, setUpdateApplication] = useState(false);

    const [allowSelection, setAllowSelection] = useState(false);
    const [selectedApplications, setSelectedApplications] = useState({})

    const addSelectedItem = (app) => {
        setSelectedApplications(
            { ...selectedApplications, [app.id]: app.id in selectedApplications ? !selectedApplications[app.id] : true }
        )
        app.selected = !app.selected;
    }

    const selectAllApplications = () => {
        let selected_apps = applications.reduce((app, { id }) => ({ ...app, [id]: true }), {});
        setSelectedApplications(selected_apps);

        for (let app of applications) {
            app.selected = true;
        }
    }

    const getUserApplicationsRequest = useCallback(async () => {
        await axiosInstance.get(`/users.${userId}.applications.list`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }).then((response) => {
            setApplications(response.data.applications.map((application) => ({ ...application, selected: false })));
        }).catch((error) => {
            if (error.response?.status === HttpStatusCode.Unauthorized && userId) {
                logout();
            }
            console.error('Error fetching applications:', error);
        })
    }, [userId, accessToken, setApplications, logout]);

    const archiveUserApplicationRequest = useCallback((applicationIds) => {
        axiosInstance.put(`/users.${userId}.applications.archive`, applicationIds, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then(() => {
                setFetchApplications(true);
                setApplicationId(null);
            })
            .catch(error => {
                if (error.response?.status === HttpStatusCode.Unauthorized && userId) {
                    logout();
                }
                console.error('Error archiving applications:', error);
            });
    }, [userId, accessToken, setFetchApplications, logout]);

    const deleteUserApplicationRequest = useCallback((applicationIds) => {
        axiosInstance.put(`/users.${userId}.applications.delete`, applicationIds, {
            headers: { Authorization: `Bearer ${accessToken}` },
        })
            .then(() => {
                setFetchApplications(true);
                setApplicationId(null);
            })
            .catch(error => {
                if (error.response?.status === HttpStatusCode.Unauthorized && userId) {
                    logout();
                }
                console.error('Error deleting applications:', error);
            });
    }, [userId, accessToken, setFetchApplications, logout]);


    const handleUserApplicationsArchive = () => {
        const applicationsToArchive = Object.entries(selectedApplications)
            .filter(([_, isSelected]) => isSelected)
            .map(([id, _]) => id);

        if (applicationsToArchive.length > 0) {
            archiveUserApplicationRequest(applicationsToArchive)
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            if (fetchApplications && accessToken) {
                await getUserApplicationsRequest();
                setTimeout(() => setFetchApplications(false), 700);
            }
        };

        if (fetchApplications) {
            fetchData();
        }
    }, [accessToken, getUserApplicationsRequest, fetchApplications, setFetchApplications]);

    // Calculate statistics
    const stats = applications.reduce((acc, app) => {
        acc.total++;
        if (app.status === 'Offer') acc.offers++;
        else if (app.status === 'Rejected') acc.rejected++;
        else if (['HR', 'Phone interview', 'Final interview', 'OA'].includes(app.status)) acc.interviewing++;
        else acc.pending++;
        return acc;
    }, { total: 0, offers: 0, interviewing: 0, rejected: 0, pending: 0 });

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Job Applications
                            </h1>
                            <p className="text-blue-100">
                                Track and manage your job search journey
                            </p>
                        </div>
                        {accessToken && !fetchApplications && (
                            <button
                                onClick={() => setAddApplication(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                            >
                                <PlusIcon className="h-5 w-5" />
                                <span>Add Application</span>
                            </button>
                        )}
                    </div>

                    {/* Statistics Cards */}
                    {accessToken && !fetchApplications && applications.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg">
                                        <BriefcaseIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-blue-100 text-sm">Total</p>
                                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <CheckCircleIcon className="h-6 w-6 text-green-300" />
                                    </div>
                                    <div>
                                        <p className="text-blue-100 text-sm">Offers</p>
                                        <p className="text-2xl font-bold text-white">{stats.offers}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <ClockIcon className="h-6 w-6 text-blue-300" />
                                    </div>
                                    <div>
                                        <p className="text-blue-100 text-sm">Interviewing</p>
                                        <p className="text-2xl font-bold text-white">{stats.interviewing}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                                        <ClockIcon className="h-6 w-6 text-yellow-300" />
                                    </div>
                                    <div>
                                        <p className="text-blue-100 text-sm">Pending</p>
                                        <p className="text-2xl font-bold text-white">{stats.pending}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <XCircleIconSolid className="h-6 w-6 text-red-300" />
                                    </div>
                                    <div>
                                        <p className="text-blue-100 text-sm">Rejected</p>
                                        <p className="text-2xl font-bold text-white">{stats.rejected}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {fetchApplications && (
                <div className="flex justify-center items-center h-64">
                    <Loading />
                </div>
            )}

            {/* Not Logged In State */}
            {!fetchApplications && !accessToken && (
                <div className="max-w-2xl mx-auto px-6 py-20 text-center">
                    <div className="bg-white rounded-3xl shadow-xl p-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BriefcaseIcon className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Welcome to Application Tracker
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Sign in to start tracking your job applications and stay organized throughout your job search.
                        </p>
                        <a
                            href="/login"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                        >
                            <span>Sign In to Continue</span>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </a>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {!fetchApplications && accessToken && (
                <div className="max-w-7xl mx-auto px-6 py-8">
                    {/* Search and Filter Bar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by company, role, or position..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="HR">HR</option>
                                    <option value="Phone interview">Phone Interview</option>
                                    <option value="OA">Online Assessment</option>
                                    <option value="Final interview">Final Interview</option>
                                    <option value="Offer">Offer</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                                <button
                                    onClick={() => setAllowSelection(!allowSelection)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${allowSelection
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <FunnelIcon className="h-5 w-5" />
                                    <span>{allowSelection ? 'Cancel' : 'Select'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {allowSelection && (
                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={selectAllApplications}
                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={handleUserApplicationsArchive}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                                >
                                    <ArchiveBoxIcon className="h-5 w-5" />
                                    Archive Selected
                                </button>
                                <button
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                    Delete Selected
                                </button>
                                <span className="ml-auto text-sm text-gray-600">
                                    {Object.values(selectedApplications).filter(Boolean).length} selected
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Applications List or Empty State */}
                    {filteredApplications.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BriefcaseIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {searchQuery || statusFilter !== 'All' ? 'No applications found' : 'No applications yet'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery || statusFilter !== 'All'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Start tracking your job applications by adding your first one'}
                            </p>
                            {!searchQuery && statusFilter === 'All' && (
                                <button
                                    onClick={() => setAddApplication(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                    Add Your First Application
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                            {filteredApplications.map((application) => (
                                <div
                                    key={application.id}
                                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <ApplicationItem
                                        application={application}
                                        setApplicationId={setApplicationId}
                                        allowSelection={allowSelection}
                                        addSelectedItem={addSelectedItem}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {addApplication && (
                <ApplicationCreate setAddApplication={setAddApplication} />
            )}

            {applicationId && !updateApplication && (
                <ApplicationInfo
                    applicationId={applicationId}
                    setApplicationId={setApplicationId}
                    application={application}
                    setApplication={setApplication}
                    setUpdateApplication={setUpdateApplication}
                    archiveUserApplicationRequest={archiveUserApplicationRequest}
                    deleteUserApplicationRequest={deleteUserApplicationRequest}
                />
            )}

            {updateApplication && (
                <ApplicationUpdate
                    application={application}
                    setApplication={setApplication}
                    setUpdateApplication={setUpdateApplication}
                />
            )}
        </div>
    )
}



export default Applications