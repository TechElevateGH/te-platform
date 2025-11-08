import { useCallback, useEffect, useState, Fragment } from 'react'
import { HttpStatusCode } from 'axios'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { Dialog, Transition } from '@headlessui/react'

import { Loading } from '../components/_custom/Loading'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    BriefcaseIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon as XCircleIconSolid,
    XMarkIcon,
    ChevronUpDownIcon,
    MapPinIcon,
    EnvelopeIcon,
    UserIcon,
    CalendarIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/20/solid'
import {
    CheckBadgeIcon
} from '@heroicons/react/24/outline'

import axiosInstance from '../axiosConfig'
import ApplicationCreate from '../components/application/ApplicationCreate'
import ApplicationInfo from '../components/application/ApplicationInfo'
import ApplicationUpdate from '../components/application/ApplicationUpdate'

// Mock data for demo purposes
const mockApplications = [
    {
        id: 1,
        company: { name: 'Google', image: 'https://logo.clearbit.com/google.com' },
        title: 'Software Engineer',
        role: 'Mid-level',
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
        role: 'Senior',
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
        role: 'New Grad',
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
        role: 'Mid-level',
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
        role: 'Senior',
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
        role: 'Associate',
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
        role: 'New Grad',
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
        role: 'Senior',
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
    const { fetchApplications, setFetchApplications, applications: contextApplications } = useData();

    // Use mock data by default, fall back to context applications if available
    const [applications, setApplications] = useState(mockApplications);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [levelFilter, setLevelFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [applicationId, setApplicationId] = useState(null);
    const [application, setApplication] = useState(null);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [addApplication, setAddApplication] = useState(false);
    const [updateApplication, setUpdateApplication] = useState(false);

    // Use context applications if authenticated
    useEffect(() => {
        if (accessToken && contextApplications && contextApplications.length > 0) {
            setApplications(contextApplications);
        }
    }, [accessToken, contextApplications]);

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

    // Get unique levels and locations for filters
    const uniqueLevels = ['All', ...new Set(applications.map(app => app.role))];
    const uniqueLocations = ['All', ...new Set(applications.map(app => `${app.location.city}, ${app.location.country}`))];

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.role.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
        const matchesLevel = levelFilter === 'All' || app.role === levelFilter;
        const matchesLocation = locationFilter === 'All' || `${app.location.city}, ${app.location.country}` === locationFilter;
        return matchesSearch && matchesStatus && matchesLevel && matchesLocation;
    });

    // Sort applications
    const sortedApplications = [...filteredApplications].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'company':
                comparison = a.company.name.localeCompare(b.company.name);
                break;
            case 'title':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            case 'date':
                comparison = new Date(a.date) - new Date(b.date);
                break;
            default:
                comparison = 0;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Pagination
    const totalPages = Math.ceil(sortedApplications.length / itemsPerPage);
    const paginatedApplications = sortedApplications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Handle sort
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    // Open modal with application details
    const openApplicationModal = (app) => {
        setSelectedApplication(app);
        setIsModalOpen(true);
    };

    // Close modal
    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedApplication(null);
    };

    // Status badge styling
    const getStatusBadge = (status) => {
        const styles = {
            'Submitted': 'bg-gray-100 text-gray-700 border-gray-200',
            'HR': 'bg-blue-100 text-blue-700 border-blue-200',
            'Phone interview': 'bg-cyan-100 text-cyan-700 border-cyan-200',
            'OA': 'bg-purple-100 text-purple-700 border-purple-200',
            'Final interview': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'Offer': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Rejected': 'bg-rose-100 text-rose-700 border-rose-200'
        };
        return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
            {/* Premium Header */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                Applications
                            </h1>
                            <p className="text-sm text-gray-600">
                                Manage your job search journey
                            </p>
                        </div>
                        {!fetchApplications && (
                            <button
                                onClick={() => setAddApplication(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg text-sm"
                            >
                                <PlusIcon className="h-4 w-4" />
                                <span>New Application</span>
                            </button>
                        )}
                    </div>

                    {/* Premium Statistics Cards */}
                    {!fetchApplications && applications.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gray-50 rounded-lg">
                                        <BriefcaseIcon className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Total</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-emerald-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 rounded-lg">
                                        <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-emerald-600 mb-0.5">Offers</p>
                                        <p className="text-2xl font-bold text-emerald-900">{stats.offers}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 rounded-lg">
                                        <ClockIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-blue-600 mb-0.5">Interviewing</p>
                                        <p className="text-2xl font-bold text-blue-900">{stats.interviewing}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-amber-200/60 hover:border-amber-300 hover:shadow-sm transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <ClockIcon className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-amber-600 mb-0.5">Pending</p>
                                        <p className="text-2xl font-bold text-amber-900">{stats.pending}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-rose-200/60 hover:border-rose-300 hover:shadow-sm transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-rose-100 rounded-lg">
                                        <XCircleIconSolid className="h-4 w-4 text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-rose-600 mb-0.5">Rejected</p>
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
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 mb-6">
                        <div className="flex flex-col gap-4">
                            {/* Search */}
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search by company, level, or position..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                />
                            </div>

                            {/* Filters Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

                                <select
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-semibold"
                                >
                                    {uniqueLevels.map(level => (
                                        <option key={level} value={level}>{level === 'All' ? 'All Levels' : level}</option>
                                    ))}
                                </select>

                                <select
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-semibold"
                                >
                                    {uniqueLocations.map(location => (
                                        <option key={location} value={location}>{location === 'All' ? 'All Locations' : location}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('All');
                                        setLevelFilter('All');
                                        setLocationFilter('All');
                                    }}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-100 transition-all text-sm"
                                >
                                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                    <span>Clear Filters</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Premium Table */}
                    {sortedApplications.length === 0 ? (
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
                                    className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                    Add Your First Application
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                                            <th
                                                onClick={() => handleSort('company')}
                                                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <BuildingOfficeIcon className="h-4 w-4" />
                                                    Company
                                                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('title')}
                                                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <BriefcaseIcon className="h-4 w-4" />
                                                    Position
                                                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Level
                                            </th>
                                            <th
                                                onClick={() => handleSort('status')}
                                                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    Status
                                                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <MapPinIcon className="h-4 w-4" />
                                                    Location
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleSort('date')}
                                                className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    Date
                                                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                                                </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedApplications.map((app, idx) => (
                                            <tr
                                                key={app.id}
                                                onClick={() => openApplicationModal(app)}
                                                className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 cursor-pointer transition-all duration-150 group"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={app.company.image}
                                                            alt={app.company.name}
                                                            className="h-10 w-10 rounded-lg object-cover border border-gray-200 group-hover:shadow-md transition-shadow"
                                                        />
                                                        <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                            {app.company.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-semibold text-gray-900">{app.title}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-700">
                                                        {app.role}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusBadge(app.status)}`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600 font-medium">
                                                        {app.location.city}, {app.location.country}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600 font-medium">
                                                        {new Date(app.date).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-gray-600 font-medium">
                                        Showing <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                                        <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, sortedApplications.length)}</span> of{' '}
                                        <span className="font-bold text-gray-900">{sortedApplications.length}</span> applications
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeftIcon className="h-5 w-5" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-all ${currentPage === i + 1
                                                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRightIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
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

            {/* Application Detail Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
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
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
                                    {selectedApplication && (
                                        <>
                                            {/* Modal Header */}
                                            <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 px-8 py-6">
                                                <button
                                                    onClick={closeModal}
                                                    className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
                                                >
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={selectedApplication.company.image}
                                                        alt={selectedApplication.company.name}
                                                        className="h-16 w-16 rounded-xl object-cover border-2 border-white shadow-lg"
                                                    />
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-white mb-1">
                                                            {selectedApplication.title}
                                                        </h2>
                                                        <p className="text-blue-100 font-semibold text-lg">
                                                            {selectedApplication.company.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Modal Content */}
                                            <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">
                                                {/* Status and Level */}
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Status</p>
                                                        <span className={`inline-block px-4 py-2 text-sm font-bold rounded-full border ${getStatusBadge(selectedApplication.status)}`}>
                                                            {selectedApplication.status}
                                                        </span>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                                                        <p className="text-xs font-bold text-purple-600 uppercase mb-2">Level</p>
                                                        <p className="text-lg font-bold text-purple-900">{selectedApplication.role}</p>
                                                    </div>
                                                </div>

                                                {/* Details Grid */}
                                                <div className="space-y-4">
                                                    {/* Location */}
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                        <div className="p-2 bg-blue-100 rounded-lg">
                                                            <MapPinIcon className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Location</p>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {selectedApplication.location.city}, {selectedApplication.location.country}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Application Date */}
                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                                            <CalendarIcon className="h-5 w-5 text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Application Date</p>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                {new Date(selectedApplication.date).toLocaleDateString('en-US', {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Referral */}
                                                    {selectedApplication.referred && (
                                                        <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                                                            <div className="p-2 bg-emerald-100 rounded-lg">
                                                                <CheckBadgeIcon className="h-5 w-5 text-emerald-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Referred Application</p>
                                                                <p className="text-sm font-semibold text-emerald-900">
                                                                    This application was submitted through a referral
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Recruiter Info */}
                                                    {selectedApplication.recruiter_name && (
                                                        <div className="space-y-3">
                                                            <p className="text-sm font-bold text-gray-700 uppercase">Recruiter Information</p>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                                    <div className="p-2 bg-cyan-100 rounded-lg">
                                                                        <UserIcon className="h-5 w-5 text-cyan-600" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Name</p>
                                                                        <p className="text-sm font-semibold text-gray-900">
                                                                            {selectedApplication.recruiter_name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {selectedApplication.recruiter_email && (
                                                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                                                        <div className="p-2 bg-purple-100 rounded-lg">
                                                                            <EnvelopeIcon className="h-5 w-5 text-purple-600" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Email</p>
                                                                            <a
                                                                                href={`mailto:${selectedApplication.recruiter_email}`}
                                                                                className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                                                            >
                                                                                {selectedApplication.recruiter_email}
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Notes */}
                                                    {selectedApplication.notes && (
                                                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                                            <div className="p-2 bg-amber-100 rounded-lg">
                                                                <DocumentTextIcon className="h-5 w-5 text-amber-600" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-xs font-bold text-amber-700 uppercase mb-2">Notes</p>
                                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                                    {selectedApplication.notes}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Modal Footer */}
                                            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                                                <button
                                                    onClick={closeModal}
                                                    className="px-6 py-2.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-all"
                                                >
                                                    Close
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setApplication(selectedApplication);
                                                        setApplicationId(selectedApplication.id);
                                                        setUpdateApplication(true);
                                                        closeModal();
                                                    }}
                                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                                                >
                                                    Edit Application
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    )
}



export default Applications