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

// Mock data for demo purposes
const mockApplications = [
    {
        id: 1,
        company: { name: 'Google', image: 'https://logo.clearbit.com/google.com' },
        title: 'Software Engineer',
        role: 'Backend',
        status: 'Final interview',
        notes: 'Third round completed, waiting for final decision',
        date: '2025-10-15',
        location: { city: 'Mountain View', country: 'USA' },
        referred: true,
        recruiter_name: 'Jane Smith',
        recruiter_email: 'jane@google.com',
        selected: false
    },
    {
        id: 2,
        company: { name: 'Microsoft', image: 'https://logo.clearbit.com/microsoft.com' },
        title: 'Cloud Solutions Architect',
        role: 'Cloud',
        status: 'Offer',
        notes: 'Received offer, negotiating compensation',
        date: '2025-10-20',
        location: { city: 'Seattle', country: 'USA' },
        referred: false,
        recruiter_name: 'John Doe',
        recruiter_email: 'john@microsoft.com',
        selected: false
    },
    {
        id: 3,
        company: { name: 'Amazon', image: 'https://logo.clearbit.com/amazon.com' },
        title: 'Frontend Developer',
        role: 'Frontend',
        status: 'HR',
        notes: 'Initial HR screening scheduled for next week',
        date: '2025-10-25',
        location: { city: 'Austin', country: 'USA' },
        referred: false,
        recruiter_name: 'Sarah Johnson',
        recruiter_email: 'sarah@amazon.com',
        selected: false
    },
    {
        id: 4,
        company: { name: 'Meta', image: 'https://logo.clearbit.com/meta.com' },
        title: 'Full Stack Engineer',
        role: 'Full Stack',
        status: 'Phone interview',
        notes: 'Phone screen went well, moving to technical round',
        date: '2025-11-01',
        location: { city: 'Menlo Park', country: 'USA' },
        referred: true,
        recruiter_name: 'Mike Brown',
        recruiter_email: 'mike@meta.com',
        selected: false
    },
    {
        id: 5,
        company: { name: 'Apple', image: 'https://logo.clearbit.com/apple.com' },
        title: 'iOS Developer',
        role: 'Mobile',
        status: 'OA',
        notes: 'Online assessment completed, awaiting results',
        date: '2025-11-03',
        location: { city: 'Cupertino', country: 'USA' },
        referred: false,
        recruiter_name: 'Emily Davis',
        recruiter_email: 'emily@apple.com',
        selected: false
    },
    {
        id: 6,
        company: { name: 'Netflix', image: 'https://logo.clearbit.com/netflix.com' },
        title: 'Data Engineer',
        role: 'Data',
        status: 'Submitted',
        notes: 'Application submitted, no response yet',
        date: '2025-11-05',
        location: { city: 'Los Gatos', country: 'USA' },
        referred: false,
        recruiter_name: '',
        recruiter_email: '',
        selected: false
    },
    {
        id: 7,
        company: { name: 'Stripe', image: 'https://logo.clearbit.com/stripe.com' },
        title: 'Backend Engineer',
        role: 'Backend',
        status: 'Rejected',
        notes: 'Did not move forward after initial screening',
        date: '2025-10-10',
        location: { city: 'San Francisco', country: 'USA' },
        referred: false,
        recruiter_name: 'Tom Wilson',
        recruiter_email: 'tom@stripe.com',
        selected: false
    },
    {
        id: 8,
        company: { name: 'Airbnb', image: 'https://logo.clearbit.com/airbnb.com' },
        title: 'Product Engineer',
        role: 'Full Stack',
        status: 'Final interview',
        notes: 'Onsite interview scheduled for next Friday',
        date: '2025-10-28',
        location: { city: 'San Francisco', country: 'USA' },
        referred: true,
        recruiter_name: 'Lisa Anderson',
        recruiter_email: 'lisa@airbnb.com',
        selected: false
    }
];

const Applications = () => {
    const { userId, accessToken, logout } = useAuth();
    const { fetchApplications, setFetchApplications, applications: contextApplications, setApplications: setContextApplications } = useData();

    // Use mock data by default, fall back to context applications if available
    const [applications, setApplications] = useState(mockApplications);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const [applicationId, setApplicationId] = useState(null);
    const [application, setApplication] = useState(null);

    const [addApplication, setAddApplication] = useState(false);
    const [updateApplication, setUpdateApplication] = useState(false);

    const [allowSelection, setAllowSelection] = useState(false);
    const [selectedApplications, setSelectedApplications] = useState({})

    // Use context applications if authenticated
    useEffect(() => {
        if (accessToken && contextApplications && contextApplications.length > 0) {
            setApplications(contextApplications);
        }
    }, [accessToken, contextApplications]);

    const addSelectedItem = (app) => {
        setSelectedApplications(
            { ...selectedApplications, [app.id]: app.id in selectedApplications ? !selectedApplications[app.id] : true }
        )
        app.selected = !app.selected;
    }

    const selectAllApplications = () => {
        const allSelected = Object.values(selectedApplications).filter(Boolean).length === applications.length;

        if (allSelected) {
            // Deselect all
            setSelectedApplications({});
            for (let app of applications) {
                app.selected = false;
            }
        } else {
            // Select all
            let selected_apps = applications.reduce((app, { id }) => ({ ...app, [id]: true }), {});
            setSelectedApplications(selected_apps);
            for (let app of applications) {
                app.selected = true;
            }
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
            } else if (fetchApplications && !accessToken) {
                // If not authenticated, just stop the loading state
                setFetchApplications(false);
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
        <div className="min-h-screen bg-[#fafafa]">
            {/* Premium Header */}
            <div className="bg-white border-b border-gray-200/80">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                Applications
                            </h1>
                            <p className="text-sm text-gray-500">
                                Manage your job search journey
                            </p>
                        </div>
                        {!fetchApplications && (
                            <button
                                onClick={() => setAddApplication(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors text-sm"
                            >
                                <PlusIcon className="h-4 w-4" />
                                <span>New Application</span>
                            </button>
                        )}
                    </div>

                    {/* Premium Statistics Cards */}
                    {!fetchApplications && applications.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="bg-white rounded-xl p-4 border border-gray-200/60 hover:border-gray-300 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <BriefcaseIcon className="h-4 w-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Total</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-emerald-200/60 hover:border-emerald-300 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-100 rounded-lg">
                                        <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-emerald-600">Offers</p>
                                        <p className="text-2xl font-bold text-emerald-900">{stats.offers}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-blue-200/60 hover:border-blue-300 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <ClockIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-blue-600">Interviewing</p>
                                        <p className="text-2xl font-bold text-blue-900">{stats.interviewing}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-amber-200/60 hover:border-amber-300 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <ClockIcon className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-amber-600">Pending</p>
                                        <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-rose-200/60 hover:border-rose-300 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-100 rounded-lg">
                                        <XCircleIconSolid className="h-4 w-4 text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-rose-600">Rejected</p>
                                        <p className="text-2xl font-bold text-rose-900">{stats.rejected}</p>
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

            {/* Main Content - Always Show */}
            {!fetchApplications && (
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Premium Search and Filter Bar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 mb-4">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by company, role, or position..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="flex gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-semibold"
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
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm ${allowSelection
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    <FunnelIcon className="h-4 w-4" />
                                    <span>{allowSelection ? 'Cancel' : 'Select'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        {allowSelection && (
                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                <button
                                    onClick={selectAllApplications}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors text-sm"
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={handleUserApplicationsArchive}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm border border-gray-200"
                                >
                                    <ArchiveBoxIcon className="h-4 w-4" />
                                    Archive
                                </button>
                                <button
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition-colors text-sm border border-red-200"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                    Delete
                                </button>
                                <span className="ml-auto text-sm text-gray-500 font-medium">
                                    {Object.values(selectedApplications).filter(Boolean).length} selected
                                </span>
                            </div>
                        )}
                    </div>                    {/* Applications Grid or Empty State */}
                    {filteredApplications.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                <BriefcaseIcon className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {searchQuery || statusFilter !== 'All' ? 'No applications found' : 'No applications yet'}
                            </h3>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto font-medium">
                                {searchQuery || statusFilter !== 'All'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Start tracking your job applications by adding your first one'}
                            </p>
                            {!searchQuery && statusFilter === 'All' && (
                                <button
                                    onClick={() => setAddApplication(true)}
                                    className="inline-flex items-center gap-2.5 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-sm hover:bg-blue-700 active:scale-95 transition-all duration-200"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                    Add Your First Application
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredApplications.map((application) => (
                                <div
                                    key={application.id}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-200/80 hover:shadow-md transition-all duration-200 overflow-hidden"
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