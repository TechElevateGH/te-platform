import { useState, useEffect, useCallback } from 'react';
import {
    UserGroupIcon,
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserCircleIcon,
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    XMarkIcon
} from 'icons';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import EditPrivilegedAccount from '../components/user/EditPrivilegedAccount';
import CreateLeadAdmin from '../components/user/CreateLeadAdmin';

const UserAccountManagement = () => {
    const { userRole } = useAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('privileged'); // 'privileged' or 'members'
    const [privilegedUsers, setPrivilegedUsers] = useState([]);
    const [memberUsers, setMemberUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showEditPrivileged, setShowEditPrivileged] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [privilegedSortField, setPrivilegedSortField] = useState('username');
    const [privilegedSortDirection, setPrivilegedSortDirection] = useState('asc');
    const [memberSortField, setMemberSortField] = useState('full_name');
    const [memberSortDirection, setMemberSortDirection] = useState('asc');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [companyFilter, setCompanyFilter] = useState('all');
    const [universityFilter, setUniversityFilter] = useState('all');
    const [verificationFilter, setVerificationFilter] = useState('all');
    const [communityFilter, setCommunityFilter] = useState('all');

    // Check permissions - convert userRole to number for comparison
    const roleNumber = parseInt(userRole);
    const isAdmin = roleNumber === 5;
    const isLead = roleNumber === 4;

    // Role mapping
    const getRoleName = (role) => {
        const roles = {
            5: 'Admin',
            4: 'Lead',
            3: 'Volunteer',
            2: 'Referrer',
            1: 'Member',
        };
        return roles[role] || 'Unknown';
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            5: 'te-chip-red',
            4: 'te-chip-green',
            3: 'te-chip-gold',
            2: 'te-chip-gold',
            1: 'te-chip-green',
        };
        return colors[role] || 'te-chip';
    };

    // Fetch privileged users
    const fetchPrivilegedUsers = useCallback(async () => {
        try {
            setLoading(true);
            const endpoint = isAdmin
                ? '/users/privileged?include_inactive=true'
                : '/users/privileged';
            const response = await axiosInstance.get(endpoint);
            setPrivilegedUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching privileged users:', error);
            setPrivilegedUsers([]);
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    // Fetch member users
    const fetchMemberUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/users');
            setMemberUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching member users:', error);
            setMemberUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'privileged') {
            fetchPrivilegedUsers();
        } else {
            fetchMemberUsers();
        }
    }, [activeTab, fetchPrivilegedUsers, fetchMemberUsers]);

    // Toggle user active status
    const toggleUserStatus = async (userId, currentStatus, isPrivileged) => {
        try {
            if (isPrivileged) {
                await axiosInstance.patch(`/users/privileged/${userId}`, {
                    is_active: !currentStatus,
                });
                fetchPrivilegedUsers();
            } else {
                await axiosInstance.patch(`/users/${userId}`, {
                    is_active: !currentStatus,
                });
                fetchMemberUsers();
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            toast.error('Failed to update user status');
        }
    };

    // Edit privileged account
    const handleEditPrivileged = (user) => {
        // Leads cannot edit other Lead accounts (role 4) or Admin accounts (role 5)
        if (isLead && user.role >= 4) {
            toast.warning('You do not have permission to edit this account');
            return;
        }

        setSelectedAccount({
            id: user._id || user.id,
            username: user.username,
            role: user.role,
            is_active: user.is_active,
            lead_token: user.lead_token || '',  // Include current token
        });
        setShowEditPrivileged(true);
    };

    // View member details
    const handleViewMember = (user) => {
        setSelectedMember(user);
        setShowMemberModal(true);
    };

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const accessiblePrivilegedUsers = isAdmin
        ? privilegedUsers
        : privilegedUsers.filter(user => Number(user.role) <= 3);
    const privilegedCompanyOptions = [...new Set(
        accessiblePrivilegedUsers.map(user => user.company_name).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
    const privilegedRoleOptions = [...new Set(
        accessiblePrivilegedUsers.map(user => Number(user.role)).filter(Boolean)
    )].sort((a, b) => b - a);
    const universityOptions = [...new Set(
        memberUsers.map(user => user.university).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    const visiblePrivilegedUsers = accessiblePrivilegedUsers.filter((user) => {
        const searchableText = [
            user.username,
            user.full_name,
            user.email,
            user.company_name
        ].filter(Boolean).join(' ').toLowerCase();
        const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
        const matchesStatus = statusFilter === 'all'
            || (statusFilter === 'active' ? user.is_active !== false : user.is_active === false);
        const matchesRole = roleFilter === 'all' || Number(user.role) === Number(roleFilter);
        const matchesCompany = companyFilter === 'all' || user.company_name === companyFilter;
        return matchesSearch && matchesStatus && matchesRole && matchesCompany;
    }).sort((a, b) => {
        let aValue, bValue;
        switch (privilegedSortField) {
            case 'username':
                aValue = a.username || '';
                bValue = b.username || '';
                break;
            case 'role':
                aValue = Number(a.role) || 0;
                bValue = Number(b.role) || 0;
                break;
            case 'status':
                aValue = a.is_active ? 1 : 0;
                bValue = b.is_active ? 1 : 0;
                break;
            default:
                return 0;
        }
        if (aValue < bValue) return privilegedSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return privilegedSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handlePrivilegedSort = (field) => {
        if (privilegedSortField === field) {
            setPrivilegedSortDirection(privilegedSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setPrivilegedSortField(field);
            setPrivilegedSortDirection('asc');
        }
    };

    const filteredMemberUsers = memberUsers.filter((user) => {
        const searchableText = [
            user.full_name,
            user.email,
            user.university,
            user.phone_number
        ].filter(Boolean).join(' ').toLowerCase();
        const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);
        const matchesStatus = statusFilter === 'all'
            || (statusFilter === 'active' ? user.is_active !== false : user.is_active === false);
        const matchesUniversity = universityFilter === 'all' || user.university === universityFilter;
        const matchesVerification = verificationFilter === 'all'
            || (verificationFilter === 'verified' ? user.email_verified : !user.email_verified);
        const matchesCommunity = communityFilter === 'all'
            || (communityFilter === 'joined' ? user.slack_joined : !user.slack_joined);
        return matchesSearch && matchesStatus && matchesUniversity && matchesVerification && matchesCommunity;
    }).sort((a, b) => {
        let aValue, bValue;
        switch (memberSortField) {
            case 'full_name':
                aValue = a.full_name || '';
                bValue = b.full_name || '';
                break;
            case 'email':
                aValue = a.email || '';
                bValue = b.email || '';
                break;
            case 'status':
                aValue = a.is_active ? 1 : 0;
                bValue = b.is_active ? 1 : 0;
                break;
            default:
                return 0;
        }
        if (aValue < bValue) return memberSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return memberSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const clearAllFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setRoleFilter('all');
        setCompanyFilter('all');
        setUniversityFilter('all');
        setVerificationFilter('all');
        setCommunityFilter('all');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'all'
        || (activeTab === 'privileged' && (roleFilter !== 'all' || companyFilter !== 'all'))
        || (activeTab === 'members' && (
            universityFilter !== 'all'
            || verificationFilter !== 'all'
            || communityFilter !== 'all'
        ));

    const handleMemberSort = (field) => {
        if (memberSortField === field) {
            setMemberSortDirection(memberSortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setMemberSortField(field);
            setMemberSortDirection('asc');
        }
    };

    return (
        <div className="min-h-screen bg-[var(--te-bg)]">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Create Management Account Modal */}
                <CreateLeadAdmin
                    show={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        fetchPrivilegedUsers();
                    }}
                    userRole={roleNumber}
                />

                {/* Header */}
                <div className="mb-8 border-b border-[var(--te-border)] pb-6">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="te-eyebrow mb-3">Accounts</p>
                            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--te-text)] sm:text-4xl">
                                User Account Management
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--te-text-dim)]">
                                Manage all user accounts - privileged and member accounts
                            </p>
                        </div>
                        {/* Create Management Account Button */}
                        {(isAdmin || isLead) && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="te-btn-primary w-full sm:w-auto"
                            >
                                <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span>Create Management Account</span>
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="mb-4 flex gap-2 overflow-x-auto rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-1 sm:w-max">
                        <button
                            onClick={() => setActiveTab('privileged')}
                            className={`whitespace-nowrap ${activeTab === 'privileged' ? 'te-btn-primary' : 'te-btn-ghost'}`}
                        >
                            <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-xs sm:text-base">Privileged Accounts</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`whitespace-nowrap ${activeTab === 'members' ? 'te-btn-primary' : 'te-btn-ghost'}`}
                        >
                            <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-xs sm:text-base">Member Accounts</span>
                        </button>
                    </div>

                    <div className="te-card p-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                            <div className={`sm:col-span-2 ${activeTab === 'privileged' ? 'lg:col-span-4' : 'lg:col-span-3'}`}>
                                <label className="mb-1 block text-xs font-semibold text-[var(--te-text-dim)]">Search</label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--te-text-dim)]" />
                                    <input
                                        type="search"
                                        placeholder={
                                            activeTab === 'privileged'
                                                ? 'Username, name, email, or company...'
                                                : 'Name, email, university, or phone...'
                                        }
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="te-input w-full pl-9"
                                    />
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-[var(--te-text-dim)]">Status</label>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="te-select w-full">
                                    <option value="all">All statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            {activeTab === 'privileged' ? (
                                <>
                                    <div className="lg:col-span-3">
                                        <label className="mb-1 block text-xs font-semibold text-[var(--te-text-dim)]">Role</label>
                                        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="te-select w-full">
                                            <option value="all">All roles</option>
                                            {privilegedRoleOptions.map(role => <option key={role} value={role}>{getRoleName(role)}</option>)}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <label className="mb-1 block text-xs font-semibold text-[var(--te-text-dim)]">Company</label>
                                        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="te-select w-full">
                                            <option value="all">All companies</option>
                                            {privilegedCompanyOptions.map(company => <option key={company} value={company}>{company}</option>)}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="lg:col-span-3">
                                        <label className="mb-1 block text-xs font-semibold text-[var(--te-text-dim)]">University</label>
                                        <select value={universityFilter} onChange={(e) => setUniversityFilter(e.target.value)} className="te-select w-full">
                                            <option value="all">All universities</option>
                                            {universityOptions.map(university => <option key={university} value={university}>{university}</option>)}
                                        </select>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="mb-1 block text-xs font-semibold text-[var(--te-text-dim)]">Email</label>
                                        <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)} className="te-select w-full">
                                            <option value="all">Any verification</option>
                                            <option value="verified">Verified</option>
                                            <option value="unverified">Unverified</option>
                                        </select>
                                    </div>
                                    <div className="lg:col-span-2">
                                        <label className="mb-1 block text-xs font-semibold text-[var(--te-text-dim)]">Community</label>
                                        <select value={communityFilter} onChange={(e) => setCommunityFilter(e.target.value)} className="te-select w-full">
                                            <option value="all">Any membership</option>
                                            <option value="joined">Joined</option>
                                            <option value="not-joined">Not joined</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="mt-4 flex flex-col gap-2 border-t border-[var(--te-border)] pt-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-mono text-xs text-[var(--te-text-dim)]">
                                Showing {activeTab === 'privileged' ? visiblePrivilegedUsers.length : filteredMemberUsers.length} of {activeTab === 'privileged' ? accessiblePrivilegedUsers.length : memberUsers.length} accounts
                            </span>
                            {hasActiveFilters && <button onClick={clearAllFilters} className="te-btn-secondary te-btn-sm justify-center">
                                    <XMarkIcon className="h-4 w-4" />
                                    Clear filters
                                </button>}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="mt-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                <UserGroupIcon className="h-6 w-6 animate-pulse text-te-green" />
                            </div>
                            <p className="mt-4 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Loading accounts...</p>
                        </div>
                    ) : activeTab === 'privileged' ? (
                        /* Privileged Users Table */
                        <div className="te-card overflow-hidden">
                            {/* Desktop Table - Hidden on mobile */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full min-w-[640px]">
                                    <thead className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                        <tr>
                                            <th
                                                onClick={() => handlePrivilegedSort('username')}
                                                className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Username
                                                    {privilegedSortField === 'username' ? (
                                                        privilegedSortDirection === 'asc' ?
                                                            <ChevronUpIcon className="h-4 w-4" /> :
                                                            <ChevronDownIcon className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handlePrivilegedSort('role')}
                                                className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Role
                                                    {privilegedSortField === 'role' ? (
                                                        privilegedSortDirection === 'asc' ?
                                                            <ChevronUpIcon className="h-4 w-4" /> :
                                                            <ChevronDownIcon className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handlePrivilegedSort('status')}
                                                className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Status
                                                    {privilegedSortField === 'status' ? (
                                                        privilegedSortDirection === 'asc' ?
                                                            <ChevronUpIcon className="h-4 w-4" /> :
                                                            <ChevronDownIcon className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">
                                                Company
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--te-border)]">
                                        {visiblePrivilegedUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-3 sm:px-6 py-8 sm:py-12 text-center text-sm sm:text-base text-[var(--te-text-dim)]">
                                                    No privileged accounts match the current filters
                                                </td>
                                            </tr>
                                        ) : (
                                            visiblePrivilegedUsers.map((user) => {
                                                const canEdit = isAdmin || (isLead && user.role < 4);
                                                return (
                                                    <tr
                                                        key={user._id || user.id}
                                                        onClick={() => canEdit && handleEditPrivileged(user)}
                                                        className={`${canEdit ? 'hover:bg-[var(--te-hover)] cursor-pointer' : 'opacity-60'} transition-colors`}
                                                    >
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--te-surface-alt)] flex items-center justify-center flex-shrink-0">
                                                                    <ShieldCheckIcon className="h-4 w-4 sm:h-6 sm:w-6 text-te-green" />
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-[var(--te-text)] text-xs sm:text-sm">{user.username}</span>
                                                                    {(user.full_name || user.email) && <p className="mt-0.5 text-xs text-[var(--te-text-dim)]">{user.full_name || user.email}</p>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div className="flex justify-start">
                                                                <span
                                                                    className={`px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold border whitespace-nowrap ${getRoleBadgeColor(
                                                                        user.role
                                                                    )}`}
                                                                >
                                                                    {getRoleName(user.role)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            {user.is_active ? (
                                                                <span className="flex items-center gap-1 sm:gap-2 text-te-green">
                                                                    <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                                                    <span className="text-xs sm:text-sm font-medium">Active</span>
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 sm:gap-2 text-te-red">
                                                                    <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                                                    <span className="text-xs sm:text-sm font-medium">Inactive</span>
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--te-text-dim)]">
                                                            {user.company_name || '-'}
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-start gap-1 sm:gap-2">
                                                                <button
                                                                    onClick={() => handleEditPrivileged(user)}
                                                                    disabled={!canEdit}
                                                                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm whitespace-nowrap ${canEdit
                                                                        ? 'te-btn-secondary'
                                                                        : 'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] cursor-not-allowed opacity-50'
                                                                        }`}
                                                                >
                                                                    <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                    <span className="hidden sm:inline">Edit</span>
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        toggleUserStatus(
                                                                            user._id || user.id,
                                                                            user.is_active,
                                                                            true
                                                                        )
                                                                    }
                                                                    disabled={!canEdit}
                                                                    className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm whitespace-nowrap ${!canEdit
                                                                        ? 'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] cursor-not-allowed opacity-50'
                                                                        : user.is_active
                                                                            ? 'te-btn-danger'
                                                                            : 'te-btn-primary'
                                                                        }`}
                                                                >
                                                                    {user.is_active ? 'Deactivate' : 'Activate'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View - Hidden on desktop */}
                            <div className="md:hidden space-y-2.5 p-3">
                                {visiblePrivilegedUsers.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-[var(--te-text-dim)]">
                                        No privileged accounts match the current filters
                                    </div>
                                ) : (
                                    visiblePrivilegedUsers.map((user) => {
                                        const canEdit = isAdmin || (isLead && user.role < 4);
                                        return (
                                            <div
                                                key={user._id || user.id}
                                                className="te-card-interactive overflow-hidden"
                                            >
                                                {/* Card Header */}
                                                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                                    <div className="w-9 h-9 rounded-lg bg-[var(--te-surface-alt)] flex items-center justify-center flex-shrink-0">
                                                        <ShieldCheckIcon className="h-5 w-5 text-te-green" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-bold text-[var(--te-text)] truncate">
                                                            {user.username}
                                                        </h3>
                                                    </div>
                                                    <span className={`text-[9px] font-bold rounded-md px-2 py-1 border ${getRoleBadgeColor(user.role)}`}>
                                                        {getRoleName(user.role)}
                                                    </span>
                                                </div>

                                                {/* Card Body */}
                                                <div className="px-3 py-2.5">
                                                    {/* Status */}
                                                    <div className="mb-2.5 py-2 border-b border-[var(--te-border)]">
                                                        {user.is_active ? (
                                                            <span className="flex items-center gap-1.5 text-te-green">
                                                                <CheckCircleIcon className="h-4 w-4" />
                                                                <span className="text-xs font-medium">Active</span>
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-te-red">
                                                                <XCircleIcon className="h-4 w-4" />
                                                                <span className="text-xs font-medium">Inactive</span>
                                                            </span>
                                                        )}
                                                        {user.company_name && <p className="mt-2 text-xs text-[var(--te-text-dim)]">{user.company_name}</p>}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditPrivileged(user)}
                                                            disabled={!canEdit}
                                                            className={`flex-1 px-4 py-1.5 rounded-md font-medium transition-all text-xs flex items-center justify-center gap-1.5 ${canEdit
                                                                ? 'te-btn-secondary'
                                                                : 'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] cursor-not-allowed opacity-50'
                                                                }`}
                                                        >
                                                            <PencilIcon className="h-3.5 w-3.5" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => toggleUserStatus(user._id || user.id, user.is_active, true)}
                                                            disabled={!canEdit}
                                                            className={`flex-1 px-4 py-1.5 rounded-md font-medium transition-all text-xs ${!canEdit
                                                                ? 'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] cursor-not-allowed opacity-50'
                                                                : user.is_active
                                                                    ? 'te-btn-danger'
                                                                    : 'te-btn-primary'
                                                                }`}
                                                        >
                                                            {user.is_active ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Member Users Table */
                        <div className="te-card overflow-hidden">
                            {/* Desktop Table - Hidden on mobile */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full min-w-[640px]">
                                    <thead className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                        <tr>
                                            <th
                                                onClick={() => handleMemberSort('full_name')}
                                                className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Member
                                                    {memberSortField === 'full_name' ? (
                                                        memberSortDirection === 'asc' ?
                                                            <ChevronUpIcon className="h-4 w-4" /> :
                                                            <ChevronDownIcon className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                onClick={() => handleMemberSort('email')}
                                                className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Email
                                                    {memberSortField === 'email' ? (
                                                        memberSortDirection === 'asc' ?
                                                            <ChevronUpIcon className="h-4 w-4" /> :
                                                            <ChevronDownIcon className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">
                                                University
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">
                                                Email
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">
                                                Community
                                            </th>
                                            <th
                                                onClick={() => handleMemberSort('status')}
                                                className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] cursor-pointer hover:bg-[var(--te-hover)] transition-colors"
                                            >
                                                <div className="flex items-center gap-1">
                                                    Status
                                                    {memberSortField === 'status' ? (
                                                        memberSortDirection === 'asc' ?
                                                            <ChevronUpIcon className="h-4 w-4" /> :
                                                            <ChevronDownIcon className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronUpDownIcon className="h-4 w-4 opacity-30" />
                                                    )}
                                                </div>
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--te-border)]">
                                        {filteredMemberUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="px-3 sm:px-6 py-12 text-center text-[var(--te-text-dim)] text-xs sm:text-sm">
                                                    No member accounts match the current filters
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMemberUsers.map((user) => (
                                                <tr
                                                    key={user._id || user.id}
                                                    onClick={() => handleViewMember(user)}
                                                    className="hover:bg-[var(--te-hover)] transition-colors cursor-pointer"
                                                >
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--te-surface-alt)] flex items-center justify-center">
                                                                <UserCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-te-green" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-[var(--te-text)] text-xs sm:text-sm">
                                                                    {user.full_name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--te-text-dim)]">{user.email}</td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--te-text-dim)]">
                                                        {user.university || 'N/A'}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.email_verified ? 'text-te-green' : 'text-[var(--te-text-dim)]'}`}>
                                                            {user.email_verified ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                                                            {user.email_verified ? 'Verified' : 'Unverified'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-[var(--te-text-dim)]">
                                                        {user.slack_joined ? 'Joined' : 'Not joined'}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                        {user.is_active ? (
                                                            <span className="flex items-center gap-1.5 sm:gap-2 text-te-green">
                                                                <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Active</span>
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 sm:gap-2 text-te-red">
                                                                <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Inactive</span>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-start gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    toggleUserStatus(
                                                                        user._id || user.id,
                                                                        user.is_active,
                                                                        false
                                                                    )
                                                                }
                                                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm whitespace-nowrap ${user.is_active
                                                                    ? 'te-btn-danger'
                                                                    : 'te-btn-primary'
                                                                    }`}
                                                            >
                                                                {user.is_active ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View - Hidden on desktop */}
                            <div className="md:hidden space-y-2.5 p-3">
                                {filteredMemberUsers.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-[var(--te-text-dim)]">
                                        No member accounts match the current filters
                                    </div>
                                ) : (
                                    filteredMemberUsers.map((user) => (
                                        <div
                                            key={user._id || user.id}
                                            className="te-card-interactive overflow-hidden"
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]">
                                                <div className="w-9 h-9 rounded-lg bg-[var(--te-surface-alt)] flex items-center justify-center flex-shrink-0">
                                                    <UserCircleIcon className="h-5 w-5 text-te-green" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-[var(--te-text)] truncate">
                                                        {user.full_name}
                                                    </h3>
                                                    <p className="text-[11px] text-[var(--te-text-dim)] truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="px-3 py-2.5">
                                                {/* Info */}
                                                <div className="space-y-1 mb-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-[var(--te-text-dim)] uppercase">University</span>
                                                        <span className="text-xs font-medium text-[var(--te-text)] truncate ml-2">
                                                            {user.university || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-[var(--te-text-dim)] uppercase">Status</span>
                                                        {user.is_active ? (
                                                            <span className="flex items-center gap-1 text-te-green">
                                                                <CheckCircleIcon className="h-4 w-4" />
                                                                <span className="text-xs font-medium">Active</span>
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-te-red">
                                                                <XCircleIcon className="h-4 w-4" />
                                                                <span className="text-xs font-medium">Inactive</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-[var(--te-text-dim)] uppercase">Email</span>
                                                        <span className={`text-xs font-medium ${user.email_verified ? 'text-te-green' : 'text-[var(--te-text-dim)]'}`}>
                                                            {user.email_verified ? 'Verified' : 'Unverified'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-[var(--te-text-dim)] uppercase">Community</span>
                                                        <span className="text-xs font-medium text-[var(--te-text)]">{user.slack_joined ? 'Joined' : 'Not joined'}</span>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 pt-2 border-t border-[var(--te-border)]">
                                                    <button
                                                        onClick={() => handleViewMember(user)}
                                                        className="te-btn-primary te-btn-sm flex-1"
                                                    >
                                                        <span className="relative z-10">View</span>
                                                    </button>
                                                    <button
                                                        onClick={() => toggleUserStatus(user._id || user.id, user.is_active, false)}
                                                        className={`px-4 py-1.5 rounded-md font-medium transition-all text-xs ${user.is_active
                                                            ? 'te-btn-danger'
                                                            : 'te-btn-primary'
                                                            }`}
                                                    >
                                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Privileged Account Modal */}
                {selectedAccount && (
                    <EditPrivilegedAccount
                        show={showEditPrivileged}
                        onClose={() => {
                            setShowEditPrivileged(false);
                            setSelectedAccount(null);
                        }}
                        account={selectedAccount}
                        onUpdate={() => {
                            fetchPrivilegedUsers();
                            setShowEditPrivileged(false);
                            setSelectedAccount(null);
                        }}
                    />
                )}

                {/* Member Details Modal */}
                {selectedMember && showMemberModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowMemberModal(false)}>
                        <div className="te-card max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="sticky top-0 border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg bg-[var(--te-surface)] flex items-center justify-center">
                                            <UserCircleIcon className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{selectedMember.full_name}</h2>
                                            <p className="text-sm text-[var(--te-text-dim)]">Member Details</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowMemberModal(false)}
                                        className="te-icon-btn text-[var(--te-text)] hover:bg-[var(--te-surface)]"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Contact Information */}
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--te-text)] mb-4 flex items-center gap-2">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                            <p className="text-xs font-semibold text-[var(--te-text-dim)] mb-1">Email</p>
                                            <p className="text-sm font-medium text-[var(--te-text)] break-all">{selectedMember.email}</p>
                                        </div>
                                        <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                            <p className="text-xs font-semibold text-[var(--te-text-dim)] mb-1">Phone</p>
                                            <p className="text-sm font-medium text-[var(--te-text)]">{selectedMember.phone_number || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Education */}
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--te-text)] mb-4 flex items-center gap-2">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                        </svg>
                                        Education
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                            <p className="text-xs font-semibold text-[var(--te-text-dim)] mb-1">University</p>
                                            <p className="text-sm font-medium text-[var(--te-text)]">{selectedMember.university || 'Not provided'}</p>
                                        </div>
                                        <div className="bg-[var(--te-surface-alt)] rounded-lg p-4">
                                            <p className="text-xs font-semibold text-[var(--te-text-dim)] mb-1">Program End Date</p>
                                            <p className="text-sm font-medium text-[var(--te-text)]">{selectedMember.end_date || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Status */}
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--te-text)] mb-4 flex items-center gap-2">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Account Status
                                    </h3>
                                    <div className="divide-y divide-[var(--te-border)] bg-[var(--te-surface-alt)] rounded-lg px-4">
                                        <div className="flex items-center justify-between py-4">
                                            <span className="text-sm font-medium text-[var(--te-text)]">Status</span>
                                            {selectedMember.is_active ? (
                                                <span className="flex items-center gap-2 text-te-green font-semibold">
                                                    <CheckCircleIcon className="h-5 w-5" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-te-red font-semibold">
                                                    <XCircleIcon className="h-5 w-5" />
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between py-4">
                                            <span className="text-sm font-medium text-[var(--te-text)]">Email verification</span>
                                            <span className={`text-sm font-semibold ${selectedMember.email_verified ? 'text-te-green' : 'text-[var(--te-text-dim)]'}`}>
                                                {selectedMember.email_verified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-4">
                                            <span className="text-sm font-medium text-[var(--te-text)]">Community</span>
                                            <span className="text-sm font-semibold text-[var(--te-text)]">
                                                {selectedMember.slack_joined ? 'Joined' : 'Not joined'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="pt-4 border-t border-[var(--te-border)]">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleUserStatus(selectedMember._id || selectedMember.id, selectedMember.is_active, false);
                                            setShowMemberModal(false);
                                        }}
                                        className={`w-full ${selectedMember.is_active ? 'te-btn-danger' : 'te-btn-primary'}`}
                                    >
                                        {selectedMember.is_active ? 'Deactivate Account' : 'Activate Account'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserAccountManagement;
