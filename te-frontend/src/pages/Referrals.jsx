import { useEffect, useState } from 'react'
// import { useAuth } from '../context/AuthContext' // Will add auth checks later
import { useData } from '../context/DataContext'
import ReferralCreate from '../components/referral/ReferralCreate'
import {
    CheckCircleIcon,
    XCircleIcon,
    BuildingOfficeIcon,
    DocumentTextIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    SparklesIcon
} from '@heroicons/react/20/solid'
import {
    CheckBadgeIcon,
    ClockIcon
} from '@heroicons/react/24/outline'
import { Loading } from '../components/_custom/Loading'

// Mock data for demo purposes
const mockReferralCompanies = [
    {
        id: 1,
        name: 'Microsoft',
        image: 'https://logo.clearbit.com/microsoft.com',
        referral_materials: {
            resume: true,
            essay: true,
            contact: true
        }
    },
    {
        id: 2,
        name: 'Amazon',
        image: 'https://logo.clearbit.com/amazon.com',
        referral_materials: {
            resume: true,
            essay: false,
            contact: true
        }
    },
    {
        id: 3,
        name: 'Google',
        image: 'https://logo.clearbit.com/google.com',
        referral_materials: {
            resume: true,
            essay: true,
            contact: false
        }
    },
    {
        id: 4,
        name: 'Apple',
        image: 'https://logo.clearbit.com/apple.com',
        referral_materials: {
            resume: true,
            essay: false,
            contact: false
        }
    },
    {
        id: 5,
        name: 'Netflix',
        image: 'https://logo.clearbit.com/netflix.com',
        referral_materials: {
            resume: false,
            essay: false,
            contact: false
        }
    }
];


const Referrals = () => {
    // const { accessToken } = useAuth(); // Commented out - will add auth checks later
    const {
        fetchReferralCompanies,
        setFetchReferralCompanies,
        referralCompanies,
        setReferralCompanies,
        resumes,
        userInfo
    } = useData();

    // Mock data for demonstration if none available
    const mockResumes = [
        {
            id: 1,
            name: 'Software_Engineer_Resume.pdf',
            role: 'Software Engineer'
        }
    ];

    const displayResumes = resumes.length > 0 ? resumes : mockResumes;
    const contact = ['contact@email.com']; // Has contact

    const [referralCompanyId, setReferralCompanyId] = useState(null);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        // Use mock data for now - set immediately
        if (referralCompanies.length === 0) {
            setReferralCompanies(mockReferralCompanies);
        }
        setFetchReferralCompanies(false);
    }, [referralCompanies.length, setFetchReferralCompanies, setReferralCompanies]);

    // Helper function to check if all requirements are met
    const checkRequirementsMet = (company) => {
        const requirements = [];
        if (company.referral_materials.resume) requirements.push(displayResumes.length !== 0);
        if (company.referral_materials.essay) requirements.push(userInfo?.essay?.length !== 0);
        if (company.referral_materials.contact) requirements.push(contact?.length !== 0);

        if (requirements.length === 0) return 'No Requirements';
        const allMet = requirements.every(req => req);
        const someMet = requirements.some(req => req);

        if (allMet) return 'Ready';
        if (someMet) return 'Incomplete';
        return 'Pending';
    };

    // Filter referral companies
    const filteredCompanies = referralCompanies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase());
        const status = checkRequirementsMet(company);
        const matchesStatus = statusFilter === 'All' || status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Get status badge styling
    const getStatusBadge = (company) => {
        const status = checkRequirementsMet(company);
        const styles = {
            'Ready': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Incomplete': 'bg-amber-100 text-amber-700 border-amber-200',
            'Pending': 'bg-gray-100 text-gray-700 border-gray-200',
            'No Requirements': 'bg-blue-100 text-blue-700 border-blue-200'
        };
        return { style: styles[status] || styles['Pending'], label: status };
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
            {/* Premium Header */}
            <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Referrals
                            </h1>
                            <p className="text-sm text-gray-600">
                                Browse companies and request employee referrals
                            </p>
                        </div>
                        {!fetchReferralCompanies && referralCompanies.length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                                <SparklesIcon className="h-5 w-5 text-emerald-600" />
                                <div>
                                    <p className="text-xs font-bold text-emerald-600 uppercase">Available</p>
                                    <p className="text-2xl font-bold text-emerald-900">{referralCompanies.length}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Statistics Cards */}
                    {!fetchReferralCompanies && referralCompanies.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-emerald-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 rounded-lg">
                                        <CheckBadgeIcon className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-emerald-600 mb-0.5">Ready</p>
                                        <p className="text-2xl font-bold text-emerald-900">
                                            {referralCompanies.filter(c => checkRequirementsMet(c) === 'Ready').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-amber-100 hover:border-amber-200 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-50 rounded-lg">
                                        <ClockIcon className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-amber-600 mb-0.5">Incomplete</p>
                                        <p className="text-2xl font-bold text-amber-900">
                                            {referralCompanies.filter(c => checkRequirementsMet(c) === 'Incomplete').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gray-50 rounded-lg">
                                        <ArrowPathIcon className="h-5 w-5 text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-0.5">Pending</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {referralCompanies.filter(c => checkRequirementsMet(c) === 'Pending').length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-blue-100 hover:border-blue-200 hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-50 rounded-lg">
                                        <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-blue-600 mb-0.5">Total</p>
                                        <p className="text-2xl font-bold text-blue-900">{referralCompanies.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {fetchReferralCompanies && (
                <div className="flex justify-center items-center h-64">
                    <Loading />
                </div>
            )}

            {/* Main Content */}
            {(!fetchReferralCompanies) && (
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Search and Filter Bar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search companies..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
                                />
                            </div>
                            <div className="flex gap-3">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-semibold"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Ready">Ready</option>
                                    <option value="Incomplete">Incomplete</option>
                                    <option value="Pending">Pending</option>
                                    <option value="No Requirements">No Requirements</option>
                                </select>
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        setStatusFilter('All');
                                    }}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold hover:bg-gray-100 transition-all text-sm"
                                >
                                    <FunnelIcon className="h-4 w-4" />
                                    <span className="hidden sm:inline">Clear</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Companies Table */}
                    {filteredCompanies.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-16 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {searchQuery || statusFilter !== 'All' ? 'No companies found' : 'No referral opportunities available'}
                            </h3>
                            <p className="text-gray-500 max-w-sm mx-auto font-medium">
                                {searchQuery || statusFilter !== 'All'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Check back later for new referral opportunities'}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <BuildingOfficeIcon className="h-4 w-4" />
                                                    Company
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <DocumentTextIcon className="h-4 w-4" />
                                                    Requirements
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredCompanies.map((company, index) => {
                                            const statusBadge = getStatusBadge(company);
                                            return (
                                                <tr
                                                    key={company.id}
                                                    className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 transition-all duration-150 group"
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={company.image}
                                                                alt={company.name}
                                                                className="h-10 w-10 rounded-lg object-cover border border-gray-200 group-hover:shadow-md transition-shadow"
                                                            />
                                                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                                {company.name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-2">
                                                            {company.referral_materials.resume && (
                                                                <div className="flex items-center gap-2">
                                                                    {displayResumes.length !== 0 ? (
                                                                        <CheckCircleIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                                    ) : (
                                                                        <XCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0" />
                                                                    )}
                                                                    <span className="text-sm font-medium text-gray-700">Resume</span>
                                                                </div>
                                                            )}
                                                            {company.referral_materials.essay && (
                                                                <div className="flex items-center gap-2">
                                                                    {userInfo?.essay?.length !== 0 ? (
                                                                        <CheckCircleIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                                    ) : (
                                                                        <XCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0" />
                                                                    )}
                                                                    <span className="text-sm font-medium text-gray-700">Essay</span>
                                                                </div>
                                                            )}
                                                            {company.referral_materials.contact && (
                                                                <div className="flex items-center gap-2">
                                                                    {contact?.length !== 0 ? (
                                                                        <CheckCircleIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                                                    ) : (
                                                                        <XCircleIcon className="h-4 w-4 text-rose-600 flex-shrink-0" />
                                                                    )}
                                                                    <span className="text-sm font-medium text-gray-700">Contact</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${statusBadge.style}`}>
                                                            {statusBadge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCompany(company);
                                                                setReferralCompanyId(company.id);
                                                            }}
                                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 active:scale-95 transition-all duration-200"
                                                        >
                                                            Request Referral
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Referral Create Modal */}
            {referralCompanyId && selectedCompany && (
                <ReferralCreate
                    company={selectedCompany}
                    setReferralCompanyId={setReferralCompanyId}
                />
            )}
        </div>
    )
}


export default Referrals;