import { useState, useEffect } from 'react';
import {
    UserGroupIcon,
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    PencilIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import EditPrivilegedAccount from '../components/user/EditPrivilegedAccount';
import CreateLeadAdmin from '../components/user/CreateLeadAdmin';

const UserAccountManagement = () => {
    const { userRole } = useAuth();
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
            5: 'bg-purple-100 text-purple-700 border-purple-300',
            4: 'bg-blue-100 text-blue-700 border-blue-300',
            3: 'bg-green-100 text-green-700 border-green-300',
            2: 'bg-cyan-100 text-cyan-700 border-cyan-300',
            1: 'bg-gray-100 text-gray-700 border-gray-300',
        };
        return colors[role] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    // Fetch privileged users
    const fetchPrivilegedUsers = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/users/privileged');
            setPrivilegedUsers(response.data || []);
        } catch (error) {
            console.error('Error fetching privileged users:', error);
            setPrivilegedUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch member users
    const fetchMemberUsers = async () => {
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
    };

    useEffect(() => {
        if (activeTab === 'privileged') {
            fetchPrivilegedUsers();
        } else {
            fetchMemberUsers();
        }
    }, [activeTab]);

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
            alert('Failed to update user status');
        }
    };

    // Edit privileged account
    const handleEditPrivileged = (user) => {
        // Leads cannot edit other Lead accounts (role 4) or Admin accounts (role 5)
        if (isLead && user.role >= 4) {
            alert('You do not have permission to edit this account');
            return;
        }

        setSelectedAccount({
            id: user._id || user.id,
            username: user.username,
            role: user.role,
            is_active: user.is_active,
        });
        setShowEditPrivileged(true);
    };

    // View member details
    const handleViewMember = (user) => {
        setSelectedMember(user);
        setShowMemberModal(true);
    };

    // Filter users based on search
    const filteredPrivilegedUsers = privilegedUsers.filter((user) =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter privileged users based on role
    // Leads can only see Volunteers (role 3) and below
    // Admins can see all
    const visiblePrivilegedUsers = isAdmin
        ? filteredPrivilegedUsers
        : filteredPrivilegedUsers.filter(user => user.role <= 3);

    const filteredMemberUsers = memberUsers.filter(
        (user) =>
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                                User Account Management
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                Manage all user accounts - privileged and member accounts
                            </p>
                        </div>
                        {/* Create Management Account Button */}
                        {(isAdmin || isLead) && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-xs sm:text-sm w-full sm:w-auto"
                            >
                                <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span>Create Management Account</span>
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('privileged')}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'privileged'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-xs sm:text-base">Privileged Accounts</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'members'
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="text-xs sm:text-base">Member Accounts</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder={
                                activeTab === 'privileged'
                                    ? 'Search by username...'
                                    : 'Search by name or email...'
                            }
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="mt-4 sm:mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 dark:border-purple-400 border-t-transparent"></div>
                        </div>
                    ) : activeTab === 'privileged' ? (
                        /* Privileged Users Table */
                        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Desktop Table - Hidden on mobile */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full min-w-[640px]">
                                    <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                                Username
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                                Role
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                                Status
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {visiblePrivilegedUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-3 sm:px-6 py-8 sm:py-12 text-center text-sm sm:text-base text-gray-500 dark:text-gray-400">
                                                    No privileged accounts found
                                                </td>
                                            </tr>
                                        ) : (
                                            visiblePrivilegedUsers.map((user) => {
                                                const canEdit = isAdmin || (isLead && user.role < 4);
                                                return (
                                                    <tr
                                                        key={user._id || user.id}
                                                        onClick={() => canEdit && handleEditPrivileged(user)}
                                                        className={`${canEdit ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer' : 'opacity-60'} transition-colors`}
                                                    >
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div className="flex items-center gap-2 sm:gap-3">
                                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                                                                    <ShieldCheckIcon className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                                                                </div>
                                                                <span className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                                                                    {user.username}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div className="flex justify-start">
                                                                <span
                                                                    className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border whitespace-nowrap ${getRoleBadgeColor(
                                                                        user.role
                                                                    )}`}
                                                                >
                                                                    {getRoleName(user.role)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            {user.is_active ? (
                                                                <span className="flex items-center gap-1 sm:gap-2 text-green-600 dark:text-green-400">
                                                                    <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                                                    <span className="text-xs sm:text-sm font-medium">Active</span>
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1 sm:gap-2 text-red-600 dark:text-red-400">
                                                                    <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                                                    <span className="text-xs sm:text-sm font-medium">Inactive</span>
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-start gap-1 sm:gap-2">
                                                                <button
                                                                    onClick={() => handleEditPrivileged(user)}
                                                                    disabled={!canEdit}
                                                                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm whitespace-nowrap ${canEdit
                                                                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
                                                                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
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
                                                                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                                        : user.is_active
                                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
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
                                    <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No privileged accounts found
                                    </div>
                                ) : (
                                    visiblePrivilegedUsers.map((user) => {
                                        const canEdit = isAdmin || (isLead && user.role < 4);
                                        return (
                                            <div
                                                key={user._id || user.id}
                                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                {/* Card Header */}
                                                <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
                                                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                                                        <ShieldCheckIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
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
                                                    <div className="mb-2.5 py-2 border-b border-gray-100 dark:border-gray-700">
                                                        {user.is_active ? (
                                                            <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                                                <CheckCircleIcon className="h-4 w-4" />
                                                                <span className="text-xs font-medium">Active</span>
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                                                                <XCircleIcon className="h-4 w-4" />
                                                                <span className="text-xs font-medium">Inactive</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEditPrivileged(user)}
                                                            disabled={!canEdit}
                                                            className={`flex-1 px-4 py-1.5 rounded-md font-medium transition-all text-xs flex items-center justify-center gap-1.5 ${canEdit
                                                                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
                                                                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            <PencilIcon className="h-3.5 w-3.5" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => toggleUserStatus(user._id || user.id, user.is_active, true)}
                                                            disabled={!canEdit}
                                                            className={`flex-1 px-4 py-1.5 rounded-md font-medium transition-all text-xs ${!canEdit
                                                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                                : user.is_active
                                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
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
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {/* Desktop Table - Hidden on mobile */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full min-w-[640px]">
                                    <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                                Member
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                                Email
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                                University
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                                Status
                                            </th>
                                            <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredMemberUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-3 sm:px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                                                    No member accounts found
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMemberUsers.map((user) => (
                                                <tr
                                                    key={user._id || user.id}
                                                    onClick={() => handleViewMember(user)}
                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                                >
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                                                <UserCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white text-xs sm:text-sm">
                                                                    {user.full_name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                        {user.university || 'N/A'}
                                                    </td>
                                                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                        {user.is_active ? (
                                                            <span className="flex items-center gap-1.5 sm:gap-2 text-green-600 dark:text-green-400">
                                                                <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">Active</span>
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 sm:gap-2 text-red-600 dark:text-red-400">
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
                                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                                                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
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
                                    <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                                        No member accounts found
                                    </div>
                                ) : (
                                    filteredMemberUsers.map((user) => (
                                        <div
                                            key={user._id || user.id}
                                            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            {/* Card Header */}
                                            <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-gray-200 dark:border-gray-700">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                                                    <UserCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                        {user.full_name}
                                                    </h3>
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="px-3 py-2.5">
                                                {/* Info */}
                                                <div className="space-y-1 mb-2.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">University</span>
                                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate ml-2">
                                                            {user.university || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">Status</span>
                                                        {user.is_active ? (
                                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                                <CheckCircleIcon className="h-4 w-4" />
                                                                <span className="text-xs font-medium">Active</span>
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                                                <XCircleIcon className="h-4 w-4" />
                                                                <span className="text-xs font-medium">Inactive</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                    <button
                                                        onClick={() => handleViewMember(user)}
                                                        className="group relative flex-1 px-6 py-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-300 ease-out flex items-center justify-center gap-2 overflow-hidden"
                                                    >
                                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                                                        <span className="relative z-10">View</span>
                                                    </button>
                                                    <button
                                                        onClick={() => toggleUserStatus(user._id || user.id, user.is_active, false)}
                                                        className={`px-4 py-1.5 rounded-md font-medium transition-all text-xs ${user.is_active
                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
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
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowMemberModal(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                            <UserCircleIcon className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{selectedMember.full_name}</h2>
                                            <p className="text-sm text-blue-100">Member Details</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowMemberModal(false)}
                                        className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
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
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Email</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{selectedMember.email}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedMember.phone || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Education */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                        </svg>
                                        Education
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">University</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedMember.university || 'Not provided'}</p>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Graduation Year</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedMember.year || 'Not provided'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Status */}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Account Status
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                                            {selectedMember.is_active ? (
                                                <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                                                    <CheckCircleIcon className="h-5 w-5" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                                                    <XCircleIcon className="h-5 w-5" />
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleUserStatus(selectedMember._id || selectedMember.id, selectedMember.is_active, false);
                                            setShowMemberModal(false);
                                        }}
                                        className={`w-full px-6 py-3 rounded-lg font-semibold transition-all ${selectedMember.is_active
                                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                            }`}
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
