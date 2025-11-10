import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    UserGroupIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    ClockIcon,
    XCircleIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

const AdminApplications = () => {
    const { accessToken } = useAuth();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [memberFilter, setMemberFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Fetch all member applications
    const fetchAllApplications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/applications/all', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchAllApplications();
        }
    }, [accessToken, fetchAllApplications]);

    // Filter applications
    const filteredApplications = applications.filter(app => {
        const matchesSearch = !searchQuery ||
            app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.user_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMember = !memberFilter ||
            app.user_name?.toLowerCase().includes(memberFilter.toLowerCase()) ||
            app.user_email?.toLowerCase().includes(memberFilter.toLowerCase());

        const matchesCompany = !companyFilter ||
            app.company?.toLowerCase().includes(companyFilter.toLowerCase());

        const matchesStatus = !statusFilter || app.status === statusFilter;

        return matchesSearch && matchesMember && matchesCompany && matchesStatus;
    });

    // Statistics
    const stats = {
        total: applications.length,
        submitted: applications.filter(a => a.status === 'Submitted').length,
        interviewing: applications.filter(a => ['HR', 'Phone interview', 'Final interview', 'OA'].includes(a.status)).length,
        offered: applications.filter(a => a.status === 'Offer').length,
        rejected: applications.filter(a => a.status === 'Rejected').length,
    };

    const getStatusColor = (status) => {
        const colors = {
            'Submitted': 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
            'HR': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
            'Phone interview': 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
            'OA': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
            'Final interview': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
            'Offer': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700',
            'Rejected': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loading />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                                Member Applications Dashboard
                            </h1>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                Monitor and manage all member job applications
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-4">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Total Applications</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{stats.total}</p>
                            </div>
                            <UserGroupIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 p-3 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Submitted</p>
                                <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-0.5">{stats.submitted}</p>
                            </div>
                            <ClockIcon className="h-6 w-6 text-blue-400 dark:text-blue-500" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800 p-3 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Interviewing</p>
                                <p className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-0.5">{stats.interviewing}</p>
                            </div>
                            <UserGroupIcon className="h-6 w-6 text-purple-400 dark:text-purple-500" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800 p-3 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-green-600 dark:text-green-400">Offers</p>
                                <p className="text-xl font-bold text-green-700 dark:text-green-400 mt-0.5">{stats.offered}</p>
                            </div>
                            <CheckCircleIcon className="h-6 w-6 text-green-400 dark:text-green-500" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-3 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-red-600 dark:text-red-400">Rejected</p>
                                <p className="text-xl font-bold text-red-700 dark:text-red-400 mt-0.5">{stats.rejected}</p>
                            </div>
                            <XCircleIcon className="h-6 w-6 text-red-400 dark:text-red-500" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                        <FunnelIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <h3 className="text-xs font-bold text-gray-900 dark:text-white">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Search */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Member Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Member</label>
                            <input
                                type="text"
                                placeholder="Filter by member..."
                                value={memberFilter}
                                onChange={(e) => setMemberFilter(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Company Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company</label>
                            <input
                                type="text"
                                placeholder="Filter by company..."
                                value={companyFilter}
                                onChange={(e) => setCompanyFilter(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="">All Statuses</option>
                                <option value="Submitted">Submitted</option>
                                <option value="OA">OA</option>
                                <option value="Phone interview">Phone interview</option>
                                <option value="Final interview">Final interview</option>
                                <option value="HR">HR</option>
                                <option value="Recruiter call">Recruiter call</option>
                                <option value="Offer">Offer</option>
                                <option value="Not now">Not now</option>
                            </select>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {(searchQuery || memberFilter || companyFilter || statusFilter) && (
                        <div className="mt-3">
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setMemberFilter('');
                                    setCompanyFilter('');
                                    setStatusFilter('');
                                }}
                                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Applications Table */}
                {/* Applications Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Member
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Level
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Applied Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center">
                                            <BuildingOfficeIcon className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">No applications found</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {applications.length === 0
                                                    ? 'No member applications yet'
                                                    : 'Try adjusting your filters'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApplications.map((app) => (
                                        <tr
                                            key={app.id}
                                            className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all"
                                        >
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{app.user_name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{app.user_email}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="relative h-6 w-6 flex-shrink-0">
                                                        <img
                                                            src={`https://logo.clearbit.com/${(app.company || '').toLowerCase().replace(/\s+/g, '')}.com`}
                                                            alt={app.company}
                                                            className="h-6 w-6 rounded object-cover border border-gray-200 dark:border-gray-700 bg-white"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="hidden h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-cyan-600 items-center justify-center">
                                                            <BuildingOfficeIcon className="h-3 w-3 text-white" />
                                                        </div>
                                                    </div>
                                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">{app.company}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{app.title}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{app.role}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(app.status)}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">{app.date}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Results Count */}
                {filteredApplications.length > 0 && (
                    <div className="mt-3 text-center text-xs text-gray-600 dark:text-gray-400">
                        Showing {filteredApplications.length} of {applications.length} applications
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminApplications;
