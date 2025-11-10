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
import EditPrivilegedAccount from '../components/user/EditPrivilegedAccount';
import CreateLeadAdmin from '../components/user/CreateLeadAdmin';

const UserAccountManagement = () => {
    const [activeTab, setActiveTab] = useState('privileged'); // 'privileged' or 'members'
    const [privilegedUsers, setPrivilegedUsers] = useState([]);
    const [memberUsers, setMemberUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [showEditPrivileged, setShowEditPrivileged] = useState(false);
    const [showCreateLeadAdmin, setShowCreateLeadAdmin] = useState(false);

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
        setSelectedAccount({
            id: user._id || user.id,
            username: user.username,
            role: user.role,
            is_active: user.is_active,
        });
        setShowEditPrivileged(true);
    };

    // Filter users based on search
    const filteredPrivilegedUsers = privilegedUsers.filter((user) =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMemberUsers = memberUsers.filter(
        (user) =>
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6">
            {/* Create Lead/Admin Modal */}
            <CreateLeadAdmin
                show={showCreateLeadAdmin}
                onClose={() => setShowCreateLeadAdmin(false)}
            />

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            User Account Management
                        </h1>
                        <p className="text-sm text-gray-600">
                            Manage all user accounts - privileged and member accounts
                        </p>
                    </div>
                    {/* Create Privileged Account Button */}
                    <button
                        onClick={() => setShowCreateLeadAdmin(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg text-sm"
                    >
                        <ShieldCheckIcon className="h-5 w-5" />
                        <span>Create Privileged Account</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('privileged')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'privileged'
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <ShieldCheckIcon className="h-5 w-5" />
                        <span>Privileged Accounts</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'members'
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <UserGroupIcon className="h-5 w-5" />
                        <span>Member Accounts</span>
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={
                            activeTab === 'privileged'
                                ? 'Search by username...'
                                : 'Search by name or email...'
                        }
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="mt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
                    </div>
                ) : activeTab === 'privileged' ? (
                    /* Privileged Users Table */
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Username
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPrivilegedUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                                No privileged accounts found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPrivilegedUsers.map((user) => (
                                            <tr key={user._id || user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                            <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                                                        </div>
                                                        <span className="font-medium text-gray-900">
                                                            {user.username}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(
                                                            user.role
                                                        )}`}
                                                    >
                                                        {getRoleName(user.role)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.is_active ? (
                                                        <span className="flex items-center gap-2 text-green-600">
                                                            <CheckCircleIcon className="h-5 w-5" />
                                                            <span className="text-sm font-medium">Active</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2 text-red-600">
                                                            <XCircleIcon className="h-5 w-5" />
                                                            <span className="text-sm font-medium">Inactive</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEditPrivileged(user)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-medium hover:from-amber-700 hover:to-orange-700 transition-all text-sm"
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                toggleUserStatus(
                                                                    user._id || user.id,
                                                                    user.is_active,
                                                                    true
                                                                )
                                                            }
                                                            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${user.is_active
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
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
                    </div>
                ) : (
                    /* Member Users Table */
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Member
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Email
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            University
                                        </th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredMemberUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                No member accounts found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredMemberUsers.map((user) => (
                                            <tr key={user._id || user.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <UserCircleIcon className="h-6 w-6 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {user.full_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {user.university || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.is_active ? (
                                                        <span className="flex items-center gap-2 text-green-600">
                                                            <CheckCircleIcon className="h-5 w-5" />
                                                            <span className="text-sm font-medium">Active</span>
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2 text-red-600">
                                                            <XCircleIcon className="h-5 w-5" />
                                                            <span className="text-sm font-medium">Inactive</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                toggleUserStatus(
                                                                    user._id || user.id,
                                                                    user.is_active,
                                                                    false
                                                                )
                                                            }
                                                            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${user.is_active
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                : 'bg-green-100 text-green-700 hover:bg-green-200'
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
        </div>
    );
};

export default UserAccountManagement;
