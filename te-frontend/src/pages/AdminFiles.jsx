import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { Loading } from '../components/_custom/Loading';
import {
    DocumentIcon,
    ArrowDownTrayIcon,
    EyeIcon,
    UserGroupIcon,
    MagnifyingGlassIcon,
    FolderIcon,
    XMarkIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

const AdminFiles = () => {
    const { accessToken } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState('');
    const [memberFilter, setMemberFilter] = useState('');
    const [sortBy, setSortBy] = useState('name_asc');
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    // Column visibility state - default visible columns
    const [visibleColumns, setVisibleColumns] = useState({
        member: true,
        email: true,
        resumes: true,
        essays: true,
        totalFiles: true,
        actions: true
    });

    const columnConfig = [
        { key: 'member', label: 'Member Name', default: true },
        { key: 'email', label: 'Email', default: true },
        { key: 'resumes', label: 'Resumes', default: true },
        { key: 'essays', label: 'Essays', default: true },
        { key: 'totalFiles', label: 'Total Files', default: true },
        { key: 'actions', label: 'Actions', default: true }
    ];

    const toggleColumn = (columnKey) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const resetColumns = () => {
        const defaultColumns = {};
        columnConfig.forEach(col => {
            defaultColumns[col.key] = col.default;
        });
        setVisibleColumns(defaultColumns);
    };

    const showAllColumns = () => {
        const allColumns = {};
        columnConfig.forEach(col => {
            allColumns[col.key] = true;
        });
        setVisibleColumns(allColumns);
    };

    const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length;

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

        const matchesMember = !memberFilter ||
            user.full_name?.toLowerCase().includes(memberFilter.toLowerCase()) ||
            user.email?.toLowerCase().includes(memberFilter.toLowerCase());

        const hasFiles = fileTypeFilter === 'resume'
            ? (user.resumes && user.resumes.length > 0)
            : fileTypeFilter === 'essay'
                ? (user.essays && user.essays.length > 0)
                : (user.resumes?.length > 0 || user.essays?.length > 0);

        return matchesSearch && matchesMember && hasFiles;
    });

    // Sort users
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        switch (sortBy) {
            case 'name_asc':
                return (a.full_name || '').localeCompare(b.full_name || '');
            case 'name_desc':
                return (b.full_name || '').localeCompare(a.full_name || '');
            case 'email_asc':
                return (a.email || '').localeCompare(b.email || '');
            case 'email_desc':
                return (b.email || '').localeCompare(a.email || '');
            case 'files_desc':
                const aTotal = (a.resumes?.length || 0) + (a.essays?.length || 0);
                const bTotal = (b.resumes?.length || 0) + (b.essays?.length || 0);
                return bTotal - aTotal;
            case 'files_asc':
                const aTotalAsc = (a.resumes?.length || 0) + (a.essays?.length || 0);
                const bTotalAsc = (b.resumes?.length || 0) + (b.essays?.length || 0);
                return aTotalAsc - bTotalAsc;
            default:
                return 0;
        }
    });

    // Clear all filters
    const clearAllFilters = () => {
        setSearchQuery('');
        setMemberFilter('');
        setFileTypeFilter('');
    };

    const hasActiveFilters = searchQuery || memberFilter || fileTypeFilter;

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Member Name', 'Email', 'Resumes', 'Essays', 'Total Files'];
        const csvData = sortedUsers.map(user => [
            user.full_name || '',
            user.email || '',
            user.resumes?.length || 0,
            user.essays?.length || 0,
            (user.resumes?.length || 0) + (user.essays?.length || 0)
        ]);

        const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `member_files_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Statistics
    const stats = {
        totalUsers: users.filter(u => u.resumes?.length > 0 || u.essays?.length > 0).length,
        totalResumes: users.reduce((sum, u) => sum + (u.resumes?.length || 0), 0),
        totalEssays: users.reduce((sum, u) => sum + (u.essays?.length || 0), 0),
        totalFiles: users.reduce((sum, u) => sum + (u.resumes?.length || 0) + (u.essays?.length || 0), 0)
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
            {/* Header with Stats and Actions */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FolderIcon className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                                Member Files Dashboard
                            </h1>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                                View and manage all member resumes and referral essays
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Column Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    <EyeIcon className="h-4 w-4" />
                                    Columns ({visibleColumnCount}/{columnConfig.length})
                                </button>

                                {showColumnSelector && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowColumnSelector(false)}
                                        />

                                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                                            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                                        Manage Columns
                                                    </h3>
                                                    <button
                                                        onClick={() => setShowColumnSelector(false)}
                                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={showAllColumns}
                                                        className="flex-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                    >
                                                        Show All
                                                    </button>
                                                    <button
                                                        onClick={resetColumns}
                                                        className="flex-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-2 max-h-80 overflow-y-auto">
                                                {columnConfig.map(column => (
                                                    <label
                                                        key={column.key}
                                                        className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={visibleColumns[column.key]}
                                                            onChange={() => toggleColumn(column.key)}
                                                            className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                                            {column.label}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={exportToCSV}
                                disabled={sortedUsers.length === 0}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-6 flex-wrap text-xs">
                            <div className="flex items-center gap-2">
                                <UserGroupIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="font-medium text-gray-600 dark:text-gray-400">Members:</span>
                                <span className="font-bold text-gray-900 dark:text-white">{stats.totalUsers}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DocumentIcon className="h-4 w-4 text-blue-500" />
                                <span className="font-medium text-blue-600 dark:text-blue-400">Resumes:</span>
                                <span className="font-bold text-blue-700 dark:text-blue-400">{stats.totalResumes}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DocumentIcon className="h-4 w-4 text-purple-500" />
                                <span className="font-medium text-purple-600 dark:text-purple-400">Essays:</span>
                                <span className="font-bold text-purple-700 dark:text-purple-400">{stats.totalEssays}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ChartBarIcon className="h-4 w-4 text-green-500" />
                                <span className="font-medium text-green-600 dark:text-green-400">Total Files:</span>
                                <span className="font-bold text-green-700 dark:text-green-400">{stats.totalFiles}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-3">

                {/* Filters Bar */}
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3 mb-3 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        {/* Global Search */}
                        <div className="md:col-span-5">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                Search
                            </label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search members (name, email)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Member Filter */}
                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                Member
                            </label>
                            <input
                                type="text"
                                placeholder="Filter by member..."
                                value={memberFilter}
                                onChange={(e) => setMemberFilter(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* File Type Filter */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                File Type
                            </label>
                            <select
                                value={fileTypeFilter}
                                onChange={(e) => setFileTypeFilter(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="">All Types</option>
                                <option value="resume">Resumes Only</option>
                                <option value="essay">Essays Only</option>
                            </select>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                Sort by
                            </label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                                <option value="name_asc">Name (A-Z)</option>
                                <option value="name_desc">Name (Z-A)</option>
                                <option value="email_asc">Email (A-Z)</option>
                                <option value="email_desc">Email (Z-A)</option>
                                <option value="files_desc">Most Files</option>
                                <option value="files_asc">Least Files</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filters & Clear */}
                    {hasActiveFilters && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                                {memberFilter && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                        Member: {memberFilter}
                                    </span>
                                )}
                                {fileTypeFilter && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                        Type: {fileTypeFilter === 'resume' ? 'Resumes' : 'Essays'}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={clearAllFilters}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                                <XMarkIcon className="h-3.5 w-3.5" />
                                Clear All
                            </button>
                        </div>
                    )}

                    {/* Results Count */}
                    <div className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
                        Showing {sortedUsers.length} of {users.filter(u => u.resumes?.length > 0 || u.essays?.length > 0).length} members with files
                    </div>
                </div>

                {/* Files Table */}
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                    {visibleColumns.member && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Member
                                        </th>
                                    )}
                                    {visibleColumns.email && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Email
                                        </th>
                                    )}
                                    {visibleColumns.resumes && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Resumes
                                        </th>
                                    )}
                                    {visibleColumns.essays && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Essays
                                        </th>
                                    )}
                                    {visibleColumns.totalFiles && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Total
                                        </th>
                                    )}
                                    {visibleColumns.actions && (
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {sortedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={visibleColumnCount} className="px-3 py-6 text-center">
                                            <FolderIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">No files found</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {users.length === 0
                                                    ? 'No members have uploaded files yet'
                                                    : 'Try adjusting your filters'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-cyan-50/30 dark:hover:from-blue-900/20 dark:hover:to-cyan-900/20 transition-all"
                                        >
                                            {visibleColumns.member && (
                                                <td className="px-3 py-2">
                                                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                                        {user.full_name}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.email && (
                                                <td className="px-3 py-2">
                                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                                        {user.email}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.resumes && (
                                                <td className="px-3 py-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                                        {user.resumes?.length || 0}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.essays && (
                                                <td className="px-3 py-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
                                                        {user.essays?.length || 0}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.totalFiles && (
                                                <td className="px-3 py-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                                                        {(user.resumes?.length || 0) + (user.essays?.length || 0)}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleColumns.actions && (
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {user.resumes && user.resumes.length > 0 && (
                                                            <a
                                                                href={user.resumes[0].url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                            >
                                                                <EyeIcon className="h-3.5 w-3.5" />
                                                                View
                                                            </a>
                                                        )}
                                                        {((user.resumes?.length || 0) + (user.essays?.length || 0)) > 0 && (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {(user.resumes?.length || 0) + (user.essays?.length || 0)} file{((user.resumes?.length || 0) + (user.essays?.length || 0)) !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminFiles;
