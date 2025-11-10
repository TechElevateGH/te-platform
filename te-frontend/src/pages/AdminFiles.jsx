import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import {
    DocumentIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    UserGroupIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    FolderIcon,
} from '@heroicons/react/24/outline';

const AdminFiles = () => {
    const { accessToken } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState(''); // 'resume' or 'essay'

    // Fetch all users with their files
    const fetchAllUsersFiles = useCallback(async () => {
        setLoading(true);
        try {
            // This endpoint should return all users with their files
            const response = await axiosInstance.get('/users/all-files', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users files:', error);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (accessToken) {
            fetchAllUsersFiles();
        }
    }, [accessToken, fetchAllUsersFiles]);

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = !searchQuery ||
            user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const hasFiles = fileTypeFilter === 'resume'
            ? (user.resumes && user.resumes.length > 0)
            : fileTypeFilter === 'essay'
                ? (user.essays && user.essays.length > 0)
                : (user.resumes?.length > 0 || user.essays?.length > 0);

        return matchesSearch && hasFiles;
    });

    // Statistics
    const stats = {
        totalUsers: users.filter(u => u.resumes?.length > 0 || u.essays?.length > 0).length,
        totalResumes: users.reduce((sum, u) => sum + (u.resumes?.length || 0), 0),
        totalEssays: users.reduce((sum, u) => sum + (u.essays?.length || 0), 0),
    };

    const getFileIcon = (fileName) => {
        const ext = fileName?.split('.').pop()?.toLowerCase();
        if (ext === 'pdf') return '📄';
        if (['doc', 'docx'].includes(ext)) return '📝';
        return '📎';
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
                                <FolderIcon className="h-8 w-8 text-blue-600" />
                                Member Files Dashboard
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                View and manage all member resumes and referral essays
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-600">Members with Files</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
                            </div>
                            <UserGroupIcon className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-blue-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-blue-600">Total Resumes</p>
                                <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalResumes}</p>
                            </div>
                            <DocumentIcon className="h-8 w-8 text-blue-400" />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-purple-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-purple-600">Total Essays</p>
                                <p className="text-2xl font-bold text-purple-700 mt-1">{stats.totalEssays}</p>
                            </div>
                            <DocumentIcon className="h-8 w-8 text-purple-400" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FunnelIcon className="h-5 w-5 text-gray-600" />
                        <h3 className="text-sm font-bold text-gray-900">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">Search Member</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* File Type Filter */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">File Type</label>
                            <select
                                value={fileTypeFilter}
                                onChange={(e) => setFileTypeFilter(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All Files</option>
                                <option value="resume">Resumes Only</option>
                                <option value="essay">Essays Only</option>
                            </select>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {(searchQuery || fileTypeFilter) && (
                        <div className="mt-4">
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setFileTypeFilter('');
                                }}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Members List */}
                <div className="space-y-4">
                    {filteredUsers.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm font-medium text-gray-900">No files found</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {users.length === 0
                                    ? 'No members have uploaded files yet'
                                    : 'Try adjusting your filters'}
                            </p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                            >
                                {/* User Header */}
                                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{user.full_name}</h3>
                                            <p className="text-sm text-gray-600">{user.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-600">
                                                {user.resumes?.length || 0} Resume{user.resumes?.length !== 1 ? 's' : ''} • {user.essays?.length || 0} Essay{user.essays?.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Files List */}
                                <div className="p-6">
                                    {/* Resumes */}
                                    {user.resumes && user.resumes.length > 0 && (
                                        <div className="mb-6 last:mb-0">
                                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <DocumentIcon className="h-4 w-4 text-blue-600" />
                                                Resumes
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {user.resumes.map((file) => (
                                                    <div
                                                        key={file.id}
                                                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-2xl">{getFileIcon(file.name)}</span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                                    {file.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {file.uploaded_at || 'Unknown date'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-3">
                                                            <a
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                                                            >
                                                                <EyeIcon className="h-3.5 w-3.5" />
                                                                View
                                                            </a>
                                                            <a
                                                                href={file.url}
                                                                download
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                                                            >
                                                                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                                                Download
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Essays */}
                                    {user.essays && user.essays.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                <DocumentIcon className="h-4 w-4 text-purple-600" />
                                                Referral Essays
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {user.essays.map((file) => (
                                                    <div
                                                        key={file.id}
                                                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-2xl">{getFileIcon(file.name)}</span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                                    {file.name}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {file.uploaded_at || 'Unknown date'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-3">
                                                            <a
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                                                            >
                                                                <EyeIcon className="h-3.5 w-3.5" />
                                                                View
                                                            </a>
                                                            <a
                                                                href={file.url}
                                                                download
                                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                                                            >
                                                                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                                                                Download
                                                            </a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* No files for this user */}
                                    {(!user.resumes || user.resumes.length === 0) &&
                                        (!user.essays || user.essays.length === 0) && (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                No files uploaded yet
                                            </p>
                                        )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Results Count */}
                {filteredUsers.length > 0 && (
                    <div className="mt-4 text-center text-sm text-gray-600">
                        Showing {filteredUsers.length} of {users.filter(u => u.resumes?.length > 0 || u.essays?.length > 0).length} members with files
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFiles;
