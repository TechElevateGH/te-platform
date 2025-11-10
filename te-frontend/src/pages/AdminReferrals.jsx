import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import ReferralManagement from '../components/referral/ReferralManagement';
import {
    PlusIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    PaperAirplaneIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';

const AdminReferrals = () => {
    const { accessToken } = useAuth();
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddCompany, setShowAddCompany] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [memberFilter, setMemberFilter] = useState('');
    const [companyFilter, setCompanyFilter] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [selectedReferral, setSelectedReferral] = useState(null);
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

    // Add Company Form
    const [companyForm, setCompanyForm] = useState({
        name: '',
        image: '',
        description: '',
        website: '',
        industry: '',
        size: '',
        headquarters: '',
    });

    // Fetch all referrals
    const fetchAllReferrals = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/referrals/all', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setReferrals(response.data.referrals || []);
        } catch (error) {
            console.error('Error fetching referrals:', error);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchAllReferrals();
        }
    }, [accessToken, fetchAllReferrals]);

    // Add new company
    const handleAddCompany = async (e) => {
        e.preventDefault();
        try {
            await axiosInstance.post('/companies', companyForm, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setCompanyForm({
                name: '',
                image: '',
                description: '',
                website: '',
                industry: '',
                size: '',
                headquarters: '',
            });
            setShowAddCompany(false);
            alert('Company added successfully!');
        } catch (error) {
            console.error('Error adding company:', error);
            alert('Failed to add company. Please try again.');
        }
    };


    // Handle referral update from modal
    const handleReferralUpdate = (updatedReferral) => {
        setReferrals(prevReferrals =>
            prevReferrals.map(ref =>
                ref.id === updatedReferral.id ? updatedReferral : ref
            )
        );
    };

    // Filter referrals
    const filteredReferrals = referrals.filter(ref => {
        const matchesSearch = !searchQuery ||
            ref.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ref.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ref.job_title?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = !statusFilter || ref.status === statusFilter;

        const matchesMember = !memberFilter ||
            ref.user_name?.toLowerCase().includes(memberFilter.toLowerCase()) ||
            ref.user_email?.toLowerCase().includes(memberFilter.toLowerCase());

        const matchesCompany = !companyFilter ||
            ref.company?.name?.toLowerCase().includes(companyFilter.toLowerCase());

        return matchesSearch && matchesStatus && matchesMember && matchesCompany;
    });

    // Statistics
    const stats = {
        total: referrals.length,
        pending: referrals.filter(r => r.status === 'Pending').length,
        approved: referrals.filter(r => r.status === 'Approved').length,
        declined: referrals.filter(r => r.status === 'Declined').length,
        completed: referrals.filter(r => r.status === 'Completed').length,
    };

    const getStatusColor = (status) => {
        const colors = {
            Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            Approved: 'bg-green-100 text-green-700 border-green-200',
            Declined: 'bg-red-100 text-red-700 border-red-200',
            Completed: 'bg-blue-100 text-blue-700 border-blue-200',
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
                                <PaperAirplaneIcon className="h-8 w-8 text-blue-600" />
                                Referral Management
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Process member referral requests and manage referral companies
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddCompany(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add Company
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Total Requests</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                            </div>
                            <UserGroupIcon className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-yellow-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-yellow-600">Pending</p>
                                <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
                            </div>
                            <ClockIcon className="h-8 w-8 text-yellow-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-green-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-green-600">Approved</p>
                                <p className="text-2xl font-bold text-green-700 mt-1">{stats.approved}</p>
                            </div>
                            <CheckCircleIcon className="h-8 w-8 text-green-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-red-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-red-600">Declined</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">{stats.declined}</p>
                            </div>
                            <XCircleIcon className="h-8 w-8 text-red-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-blue-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-blue-600">Completed</p>
                                <p className="text-2xl font-bold text-blue-700 mt-1">{stats.completed}</p>
                            </div>
                            <CheckCircleIcon className="h-8 w-8 text-blue-400" />
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

                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Declined">Declined</option>
                                <option value="Completed">Completed</option>
                            </select>
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
                    </div>

                    {/* Clear Filters */}
                    {(searchQuery || statusFilter || memberFilter || companyFilter) && (
                        <div className="mt-4">
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('');
                                    setMemberFilter('');
                                    setCompanyFilter('');
                                }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Referrals Table */}
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
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Request Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredReferrals.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center">
                                            <PaperAirplaneIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-900">No referral requests found</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {referrals.length === 0
                                                    ? 'No member referral requests yet'
                                                    : 'Try adjusting your filters'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReferrals.map((ref) => (
                                        <tr
                                            key={ref.id}
                                            className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 transition-all"
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-sm">{ref.user_name}</div>
                                                    <div className="text-xs text-gray-500">{ref.user_email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {ref.company?.image && (
                                                        <div className="h-8 w-8 rounded-lg border border-gray-200 bg-white p-1 flex items-center justify-center flex-shrink-0">
                                                            <img
                                                                src={ref.company.image}
                                                                alt={ref.company.name}
                                                                className="h-full w-full object-contain"
                                                            />
                                                        </div>
                                                    )}
                                                    <span className="font-semibold text-gray-900 text-sm">{ref.company?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{ref.job_title}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(ref.status)}`}>
                                                    {ref.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">{ref.date}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedReferral(ref);
                                                            setIsManagementModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                                                    >
                                                        <EyeIcon className="h-3.5 w-3.5" />
                                                        View Details
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Results Count */}
                {filteredReferrals.length > 0 && (
                    <div className="mt-4 text-center text-sm text-gray-600">
                        Showing {filteredReferrals.length} of {referrals.length} referral requests
                    </div>
                )}
            </div>

            {/* Add Company Modal */}
            {showAddCompany && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-t-2xl">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <BuildingOfficeIcon className="h-6 w-6" />
                                Add New Referral Company
                            </h2>
                        </div>

                        <form onSubmit={handleAddCompany} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={companyForm.name}
                                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Google, Microsoft"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Logo URL
                                </label>
                                <input
                                    type="url"
                                    value={companyForm.image}
                                    onChange={(e) => setCompanyForm({ ...companyForm, image: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={companyForm.description}
                                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Brief description of the company..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Website
                                    </label>
                                    <input
                                        type="url"
                                        value={companyForm.website}
                                        onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="https://..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Industry
                                    </label>
                                    <input
                                        type="text"
                                        value={companyForm.industry}
                                        onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Technology"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Company Size
                                    </label>
                                    <input
                                        type="text"
                                        value={companyForm.size}
                                        onChange={(e) => setCompanyForm({ ...companyForm, size: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., 1000-5000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Headquarters
                                    </label>
                                    <input
                                        type="text"
                                        value={companyForm.headquarters}
                                        onChange={(e) => setCompanyForm({ ...companyForm, headquarters: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., San Francisco, CA"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
                                >
                                    Add Company
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddCompany(false)}
                                    className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Referral Management Modal */}
            {selectedReferral && isManagementModalOpen && (
                <ReferralManagement
                    referral={selectedReferral}
                    isOpen={isManagementModalOpen}
                    setIsOpen={setIsManagementModalOpen}
                    onUpdate={handleReferralUpdate}
                />
            )}
        </div>
    );
};

export default AdminReferrals;
