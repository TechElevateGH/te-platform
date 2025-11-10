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
            app.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.user_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesMember = !memberFilter ||
            app.user_name?.toLowerCase().includes(memberFilter.toLowerCase()) ||
            app.user_email?.toLowerCase().includes(memberFilter.toLowerCase());

        const matchesCompany = !companyFilter ||
            app.company?.name?.toLowerCase().includes(companyFilter.toLowerCase());

        const matchesStatus = !statusFilter || app.status === statusFilter;

        return matchesSearch && matchesMember && matchesCompany && matchesStatus;
    });

    // Statistics
    const stats = {
        total: applications.length,
        applied: applications.filter(a => a.status === 'Applied').length,
        interviewing: applications.filter(a => a.status === 'Interview').length,
        offered: applications.filter(a => a.status === 'Offer').length,
        rejected: applications.filter(a => a.status === 'Rejected').length,
    };

    const getStatusColor = (status) => {
        const colors = {
            Applied: 'bg-blue-100 text-blue-700 border-blue-200',
            Interview: 'bg-purple-100 text-purple-700 border-purple-200',
            Offer: 'bg-green-100 text-green-700 border-green-200',
            Rejected: 'bg-red-100 text-red-700 border-red-200',
            Accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            Withdrawn: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loading />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <ChartBarIcon className="h-8 w-8 text-blue-600" />
                                Member Applications Dashboard
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Monitor and manage all member job applications
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Total Applications</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                            </div>
                            <UserGroupIcon className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-blue-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-blue-600">Applied</p>
                                <p className="text-2xl font-bold text-blue-700 mt-1">{stats.applied}</p>
                            </div>
                            <ClockIcon className="h-8 w-8 text-blue-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-purple-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-purple-600">Interviewing</p>
                                <p className="text-2xl font-bold text-purple-700 mt-1">{stats.interviewing}</p>
                            </div>
                            <UserGroupIcon className="h-8 w-8 text-purple-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-green-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-green-600">Offers</p>
                                <p className="text-2xl font-bold text-green-700 mt-1">{stats.offered}</p>
                            </div>
                            <CheckCircleIcon className="h-8 w-8 text-green-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-red-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-red-600">Rejected</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">{stats.rejected}</p>
                            </div>
                            <XCircleIcon className="h-8 w-8 text-red-400" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FunnelIcon className="h-5 w-5 text-gray-600" />
                        <h3 className="text-sm font-bold text-gray-900">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Search</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Member Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Member</label>
                            <input
                                type="text"
                                placeholder="Filter by member..."
                                value={memberFilter}
                                onChange={(e) => setMemberFilter(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Company Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Company</label>
                            <input
                                type="text"
                                placeholder="Filter by company..."
                                value={companyFilter}
                                onChange={(e) => setCompanyFilter(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="Applied">Applied</option>
                                <option value="Interview">Interview</option>
                                <option value="Offer">Offer</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Withdrawn">Withdrawn</option>
                            </select>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {(searchQuery || memberFilter || companyFilter || statusFilter) && (
                        <div className="mt-4">
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setMemberFilter('');
                                    setCompanyFilter('');
                                    setStatusFilter('');
                                }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Applications Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Member
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Company
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Position
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Level
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Applied Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-900">No applications found</p>
                                            <p className="text-xs text-gray-500 mt-1">
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
                                            className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 transition-all"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm">{app.user_name}</div>
                                                    <div className="text-xs text-gray-500">{app.user_email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {app.company?.image && (
                                                        <div className="h-8 w-8 rounded-lg border border-gray-200 bg-white p-1 flex items-center justify-center flex-shrink-0">
                                                            <img
                                                                src={app.company.image}
                                                                alt={app.company.name}
                                                                className="h-full w-full object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                    <span className="font-semibold text-gray-900 text-sm">{app.company?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{app.position}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{app.level}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(app.status)}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{app.date}</span>
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
                    <div className="mt-4 text-center text-sm text-gray-600">
                        Showing {filteredApplications.length} of {applications.length} applications
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminApplications;
