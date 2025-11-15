import { useCallback, useEffect, useState } from 'react'
import { HttpStatusCode } from 'axios'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { getCompanyLogoUrl, handleCompanyLogoError } from '../utils'

import { Loading } from '../components/_custom/Loading'
import SignInPrompt from '../components/_custom/Alert/SignInPrompt'
import {
    PlusIcon,
    MagnifyingGlassIcon,
    BriefcaseIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon as XCircleIconSolid,
    ChevronUpDownIcon,
    MapPinIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    AdjustmentsHorizontalIcon,
    TrashIcon,
    ArchiveBoxIcon
} from '@heroicons/react/20/solid'


import axiosInstance from '../axiosConfig'
import ApplicationCreate from '../components/application/ApplicationCreate'
import ApplicationInfo from '../components/application/ApplicationInfo'

// Start with empty list; will populate from backend
const initialApplications = [];

const Applications = () => {
    const { userId, accessToken, logout, userRole } = useAuth();
    const { fetchApplications, setFetchApplications, applications: contextApplications } = useData();

    // UserRoles: Guest=0, Member=1, Lead=2, Admin=3
    const isMember = userRole && parseInt(userRole) === 1; // Only Members can track applications

    // Start empty; fetch from backend or context
    const [applications, setApplications] = useState(initialApplications);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [levelFilter, setLevelFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [application, setApplication] = useState(null);
    const [applicationId, setApplicationId] = useState(null);

    const [addApplication, setAddApplication] = useState(false);
    const [showSignInPrompt, setShowSignInPrompt] = useState(false);

    // Check if user is authenticated
    useEffect(() => {
        if (!accessToken) {
            setShowSignInPrompt(true);
        }
    }, [accessToken]);

    // Sync context-provided applications if available
    useEffect(() => {
        if (accessToken && contextApplications && contextApplications.length > 0) {
            setApplications(contextApplications.map(a => ({ ...a, selected: false })));
        }
    }, [accessToken, contextApplications]);

    const getUserApplicationsRequest = useCallback(async () => {
        await axiosInstance.get(`/users/${userId}/applications`, {
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
        axiosInstance.put(`/applications/archive`, applicationIds, {
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
    }, [userId, accessToken, setApplicationId, setFetchApplications, logout]);

    const deleteUserApplicationRequest = useCallback((applicationIds) => {
        axiosInstance.put(`/applications/delete`, applicationIds, {
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
        if (!userId || !accessToken) {
            if (fetchApplications) setFetchApplications(false);
            return;
        }
        if (fetchApplications || applications.length === 0) {
            getUserApplicationsRequest().finally(() => setFetchApplications(false));
        }
    }, [userId, accessToken, fetchApplications, applications.length, getUserApplicationsRequest, setFetchApplications]);

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
    const uniqueLevels = ['All', ...new Set(applications.map(app => app.role).filter(Boolean))];
    const uniqueLocations = ['All', ...new Set(applications.map(app => {
        if (app.location?.city && app.location?.country) {
            return `${app.location.city}, ${app.location.country}`;
        }
        return null;
    }).filter(Boolean))];

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch = (app.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (app.role || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
        const matchesLevel = levelFilter === 'All' || app.role === levelFilter;
        const matchesLocation = locationFilter === 'All' ||
            (app.location?.city ? `${app.location.city}, ${app.location.country}` : app.location?.country) === locationFilter;
        return matchesSearch && matchesStatus && matchesLevel && matchesLocation;
    });

    // Sort applications
    const sortedApplications = [...filteredApplications].sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'company':
                comparison = (a.company || '').localeCompare(b.company || '');
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

    // Open application info modal
    const openApplicationModal = (app) => {
        setApplication(app);
        setApplicationId(app.id);
    };

    // Bulk action handlers
    const handleArchiveAll = () => {
        if (window.confirm('Are you sure you want to archive all applications? This will move them to your archive.')) {
            const allApplicationIds = applications.map(app => app.id);
            archiveUserApplicationRequest(allApplicationIds);
        }
    };

    const handleDeleteAll = () => {
        if (window.confirm('Are you sure you want to delete ALL applications? This action cannot be undone!')) {
            const allApplicationIds = applications.map(app => app.id);
            deleteUserApplicationRequest(allApplicationIds);
        }
    };

    // Status badge styling
    const getStatusBadge = (status) => {
        const styles = {
            'Submitted': 'bg-gray-100 text-gray-700 border-gray-200',
            'HR': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Phone interview': 'bg-green-100 text-green-700 border-green-200',
            'OA': 'bg-purple-100 text-purple-700 border-purple-200',
            'Final interview': 'bg-indigo-100 text-indigo-700 border-indigo-200',
            'Offer': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Rejected': 'bg-rose-100 text-rose-700 border-rose-200'
        };
        return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            {/* Premium Header */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-b-2 border-blue-500 shadow-blue-500/30 dark:border-cyan-500 dark:shadow-cyan-500/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Applications</h1>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Track your applications</p>
                            </div>
                            {!fetchApplications && isMember && (
                                <button
                                    onClick={() => setAddApplication(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-green-700 transition-all shadow-md shadow-emerald-500/30 text-sm active:scale-95"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                    <span>New</span>
                                </button>
                            )}
                        </div>

                        {/* Mobile Statistics Grid */}
                        {!fetchApplications && applications.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <BriefcaseIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{stats.total}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <CheckCircleIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-emerald-600 dark:text-emerald-500">Offers</p>
                                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">{stats.offers}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <ClockIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-emerald-600 dark:text-emerald-500">Interview</p>
                                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400">{stats.interviewing}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-amber-600 dark:text-amber-500">Pending</p>
                                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-400">{stats.pending}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Applications</h1>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Track your job applications</p>
                            </div>

                            {/* Inline Statistics */}
                            {!fetchApplications && applications.length > 0 && (
                                <div className="flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-1.5">
                                        <BriefcaseIcon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Total:</span>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{stats.total}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                                        <span className="text-xs text-emerald-600 dark:text-emerald-500">Offers:</span>
                                        <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-400">{stats.offers}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ClockIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500" />
                                        <span className="text-xs text-emerald-600 dark:text-emerald-500">Interviewing:</span>
                                        <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-400">{stats.interviewing}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <ClockIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                                        <span className="text-xs text-amber-600 dark:text-amber-500">Pending:</span>
                                        <span className="text-xs font-semibold text-amber-900 dark:text-amber-400">{stats.pending}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <XCircleIconSolid className="h-3.5 w-3.5 text-rose-600 dark:text-rose-500" />
                                        <span className="text-xs text-rose-600 dark:text-rose-500">Rejected:</span>
                                        <span className="text-xs font-semibold text-rose-900 dark:text-rose-400">{stats.rejected}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!fetchApplications && isMember && (
                            <button
                                onClick={() => setAddApplication(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-medium hover:from-blue-800 hover:via-cyan-800 hover:to-blue-900 transition-all shadow-md shadow-blue-600 shadow-lg text-sm active:scale-95"
                            >
                                <PlusIcon className="h-5 w-5" />
                                <span>New</span>
                            </button>
                        )}
                    </div>
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    {/* Responsive Search and Filter Bar */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200/80 dark:border-gray-700/80 p-3 sm:p-4 mb-3">
                        {/* Mobile: Stack vertically */}
                        <div className="flex flex-col gap-3 md:hidden">
                            {/* Search */}
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search applications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
                                />
                            </div>

                            {/* Filters Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm font-medium"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="HR">HR</option>
                                    <option value="Phone interview">Phone</option>
                                    <option value="OA">OA</option>
                                    <option value="Final interview">Final</option>
                                    <option value="Offer">Offer</option>
                                    <option value="Rejected">Rejected</option>
                                </select>

                                <select
                                    value={levelFilter}
                                    onChange={(e) => setLevelFilter(e.target.value)}
                                    className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm font-medium"
                                >
                                    {uniqueLevels.map(level => (
                                        <option key={level} value={level}>{level === 'All' ? 'All Levels' : level}</option>
                                    ))}
                                </select>

                                <select
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                    className="px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm font-medium"
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
                                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-all text-sm active:scale-95"
                                >
                                    <AdjustmentsHorizontalIcon className="h-4 w-4" />
                                    <span>Clear</span>
                                </button>
                            </div>
                        </div>

                        {/* Desktop: Horizontal layout */}
                        <div className="hidden md:flex items-center gap-2">
                            {/* Search */}
                            <div className="relative flex-1">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search applications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
                                />
                            </div>

                            {/* Filters */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs font-medium"
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
                                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs font-medium"
                            >
                                {uniqueLevels.map(level => (
                                    <option key={level} value={level}>{level === 'All' ? 'All Levels' : level}</option>
                                ))}
                            </select>

                            <select
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs font-medium"
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
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-all text-xs"
                            >
                                <AdjustmentsHorizontalIcon className="h-3.5 w-3.5" />
                                <span>Clear</span>
                            </button>
                        </div>
                    </div>

                    {/* Bulk Actions Bar */}
                    {applications.length > 0 && (
                        <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <BriefcaseIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Bulk Actions ({applications.length} total)
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={handleArchiveAll}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all text-xs active:scale-95"
                                    >
                                        <ArchiveBoxIcon className="h-3.5 w-3.5" />
                                        <span>Archive All</span>
                                    </button>
                                    <button
                                        onClick={handleDeleteAll}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg font-medium hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-xs active:scale-95"
                                    >
                                        <TrashIcon className="h-3.5 w-3.5" />
                                        <span>Delete All</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}                    {/* Premium Table */}
                    {sortedApplications.length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 p-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-5">
                                <BriefcaseIcon className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {searchQuery || statusFilter !== 'All' ? 'No applications found' : 'No applications yet'}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto font-medium">
                                {searchQuery || statusFilter !== 'All'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Start tracking your job applications by adding your first one'}
                            </p>
                            {!searchQuery && statusFilter === 'All' && isMember && (
                                <button
                                    onClick={() => setAddApplication(true)}
                                    className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-medium rounded-full shadow-lg hover:shadow-md active:scale-95 transition-all duration-200"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Add Your First Application
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Mobile: Card Layout */}
                            <div className="md:hidden space-y-3">
                                {paginatedApplications.map((app) => (
                                    <div
                                        key={app.id}
                                        onClick={() => isMember && openApplicationModal(app)}
                                        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 p-4 ${isMember
                                            ? 'cursor-pointer active:scale-[0.98] transition-transform'
                                            : 'cursor-not-allowed opacity-60'
                                            }`}
                                        title={!isMember ? "Only Members can edit applications" : ""}
                                    >
                                        {/* Header with Company Logo and Name */}
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="relative h-12 w-12 flex-shrink-0">
                                                <img
                                                    src={getCompanyLogoUrl(app.company)}
                                                    alt={app.company}
                                                    className="h-12 w-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700 bg-white"
                                                    onError={handleCompanyLogoError}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                                    {app.company}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                    {app.title}
                                                </p>
                                            </div>
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex-shrink-0 ${getStatusBadge(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <BriefcaseIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                <span className="text-gray-700 dark:text-gray-300 truncate">{app.role}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPinIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                <span className="text-gray-700 dark:text-gray-300 truncate">
                                                    {app.location?.city
                                                        ? `${app.location.city}, ${app.location.country}`
                                                        : app.location?.country || 'Unknown'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                <span className="text-gray-700 dark:text-gray-300">
                                                    {new Date(app.date).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop: Table Layout */}
                            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                                <th
                                                    onClick={() => handleSort('company')}
                                                    className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <BuildingOfficeIcon className="h-4 w-4" />
                                                        Company
                                                        <ChevronUpDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                    </div>
                                                </th>
                                                <th
                                                    onClick={() => handleSort('title')}
                                                    className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <BriefcaseIcon className="h-4 w-4" />
                                                        Position
                                                        <ChevronUpDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Level
                                                </th>
                                                <th
                                                    onClick={() => handleSort('status')}
                                                    className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        Status
                                                        <ChevronUpDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    <div className="flex items-center gap-2">
                                                        <MapPinIcon className="h-4 w-4" />
                                                        Location
                                                    </div>
                                                </th>
                                                <th
                                                    onClick={() => handleSort('date')}
                                                    className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="h-4 w-4" />
                                                        Date
                                                        <ChevronUpDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                    </div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedApplications.map((app, idx) => (
                                                <tr
                                                    key={app.id}
                                                    onClick={() => isMember && openApplicationModal(app)}
                                                    className={`hover:bg-gradient-to-r hover:from-blue-100/50 hover:via-cyan-100/50 hover:to-blue-100/50 dark:hover:from-blue-900/50 dark:hover:via-cyan-900/50 dark:hover:to-blue-900/50 transition-all duration-150 group ${isMember ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                                                    title={!isMember ? "Only Members can edit applications" : ""}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative h-10 w-10 flex-shrink-0">
                                                                <img
                                                                    src={getCompanyLogoUrl(app.company)}
                                                                    alt={app.company}
                                                                    className="h-10 w-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700 group-hover:shadow-md transition-shadow bg-white"
                                                                    onError={handleCompanyLogoError}
                                                                />
                                                            </div>
                                                            <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-xs">
                                                                {app.company}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-medium text-gray-900 dark:text-white">{app.title}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                            {app.role}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex justify-start">
                                                            <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusBadge(app.status)}`}>
                                                                {app.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 font-medium">
                                                            <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                                                            <span>
                                                                {app.location?.city
                                                                    ? `${app.location.city}, ${app.location.country}`
                                                                    : app.location?.country || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
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

                                {/* Desktop Pagination */}
                                {totalPages > 1 && (
                                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                            Showing <span className="font-semibold text-gray-900 dark:text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                                            <span className="font-semibold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, sortedApplications.length)}</span> of{' '}
                                            <span className="font-semibold text-gray-900 dark:text-white">{sortedApplications.length}</span> applications
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronLeftIcon className="h-4 w-4" />
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <button
                                                        key={i + 1}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-all ${currentPage === i + 1
                                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-md'
                                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                            }`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                            >
                                                <ChevronRightIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Pagination */}
                            {totalPages > 1 && (
                                <div className="md:hidden flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/80 dark:border-gray-700/80 p-4">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium text-center sm:text-left">
                                        <span className="font-semibold text-gray-900 dark:text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, sortedApplications.length)}</span> of{' '}
                                        <span className="font-semibold text-gray-900 dark:text-white">{sortedApplications.length}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                        >
                                            <ChevronLeftIcon className="h-5 w-5" />
                                        </button>
                                        <div className="flex items-center gap-1">
                                            {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all active:scale-95 ${currentPage === pageNum
                                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-md'
                                                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                        >
                                            <ChevronRightIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Modals */}
            {addApplication && (
                <ApplicationCreate setAddApplication={setAddApplication} />
            )}

            {applicationId && (
                <ApplicationInfo
                    applicationId={applicationId}
                    setApplicationId={setApplicationId}
                    application={application}
                    setApplication={setApplication}
                    archiveUserApplicationRequest={archiveUserApplicationRequest}
                    deleteUserApplicationRequest={deleteUserApplicationRequest}
                    refreshApplications={() => setFetchApplications(true)}
                />
            )}

            <SignInPrompt
                isOpen={showSignInPrompt}
                onClose={() => setShowSignInPrompt(false)}
            />
        </div>
    )
}

export default Applications
