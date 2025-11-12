import { useEffect, useState, useMemo } from 'react';
import axios from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import {
    ChartBarIcon,
    XMarkIcon,
    UserIcon,
    AcademicCapIcon,
    MagnifyingGlassIcon,
    AdjustmentsHorizontalIcon,
    UserGroupIcon,
    FireIcon,
    BookmarkIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

export default function LearningAnalytics() {
    const { userRole: authUserRole } = useAuth();
    const userRole = authUserRole ? parseInt(authUserRole) : 0;
    const isLeadOrAdmin = userRole >= 4;
    const { darkMode } = useDarkMode();

    const [adminStatistics, setAdminStatistics] = useState(null);
    const [allMembersProgress, setAllMembersProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('member'); // 'member' or 'topic'
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Topic view filters and sort
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name'); // 'name', 'completed', 'bookmarked'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

    useEffect(() => {
        if (!isLeadOrAdmin) return;

        setLoading(true);
        Promise.all([
            axios.get('/learning/admin/statistics'),
            axios.get('/learning/admin/all-progress')
        ]).then(([statsRes, progressRes]) => {
            setAdminStatistics(statsRes.data);
            setAllMembersProgress(progressRes.data.members || []);
        }).catch(() => {
            setAdminStatistics(null);
            setAllMembersProgress([]);
        }).finally(() => setLoading(false));
    }, [isLeadOrAdmin]);

    // Process topics from all members' progress
    const topicsByCategory = useMemo(() => {
        const topicsMap = new Map();

        allMembersProgress.forEach(member => {
            // Process completed topics
            member.completed_topics?.forEach(topic => {
                if (!topicsMap.has(topic.topic_name)) {
                    topicsMap.set(topic.topic_name, {
                        name: topic.topic_name,
                        category: topic.category || 'Uncategorized',
                        completed: [],
                        bookmarked: [],
                        inProgress: []
                    });
                }

                // Check if this member already exists in completed array
                const completedList = topicsMap.get(topic.topic_name).completed;
                const existingMember = completedList.find(m => m.user_id === member.user_id);

                if (existingMember) {
                    // Update count and date if this completion is more recent
                    existingMember.count = topic.count || 1;
                    existingMember.completed_at = topic.completed_at;
                } else {
                    // Add new member
                    completedList.push({
                        name: member.full_name,
                        email: member.email,
                        user_id: member.user_id,
                        count: topic.count || 1,
                        completed_at: topic.completed_at
                    });
                }
            });

            // Process bookmarked topics
            member.bookmarked_topics?.forEach(topic => {
                if (!topicsMap.has(topic.topic_name)) {
                    topicsMap.set(topic.topic_name, {
                        name: topic.topic_name,
                        category: topic.category || 'Uncategorized',
                        completed: [],
                        bookmarked: [],
                        inProgress: []
                    });
                }
                topicsMap.get(topic.topic_name).bookmarked.push({
                    name: member.full_name,
                    email: member.email,
                    user_id: member.user_id
                });
            });
        });

        // Group by category
        const byCategory = {};
        topicsMap.forEach((topicData, topicName) => {
            const cat = topicData.category;
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(topicData);
        });

        return byCategory;
    }, [allMembersProgress]);

    // Filter members based on search
    const filteredMembers = allMembersProgress.filter(
        (member) =>
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter and sort topics based on search, category filter, and sort options
    const filteredTopics = useMemo(() => {
        let allTopics = [];
        Object.entries(topicsByCategory).forEach(([category, topics]) => {
            topics.forEach(topic => {
                allTopics.push({ ...topic, category });
            });
        });

        // Apply category filter
        if (categoryFilter !== 'all') {
            allTopics = allTopics.filter(topic => topic.category === categoryFilter);
        }

        // Apply search filter
        if (searchQuery) {
            allTopics = allTopics.filter(topic =>
                topic.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply sorting
        allTopics.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'completed':
                    comparison = a.completed.length - b.completed.length;
                    break;
                case 'bookmarked':
                    comparison = a.bookmarked.length - b.bookmarked.length;
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return allTopics;
    }, [topicsByCategory, searchQuery, categoryFilter, sortBy, sortOrder]);

    // Get unique categories for filter dropdown
    const categories = useMemo(() => {
        return ['all', ...new Set(Object.keys(topicsByCategory))];
    }, [topicsByCategory]);

    // Calculate stats
    const stats = useMemo(() => {
        if (!adminStatistics) return { totalMembers: 0, activeMembers: 0, totalCompletions: 0, totalBookmarks: 0 };
        return {
            totalMembers: adminStatistics.total_members || 0,
            activeMembers: adminStatistics.members_with_progress || 0,
            totalCompletions: adminStatistics.total_completions || 0,
            totalBookmarks: adminStatistics.total_bookmarks || 0
        };
    }, [adminStatistics]);

    if (!isLeadOrAdmin) return null;

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Sticky Header */}
            <div className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
                {/* Title Bar */}
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                <ChartBarIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Learning Analytics</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Track member progress and engagement</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className={`px-6 py-3 border-t ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{stats.totalMembers}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FireIcon className="w-4 h-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-400">Active:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{stats.activeMembers}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleSolidIcon className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-600 dark:text-gray-400">Completions:</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.totalCompletions}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BookmarkIcon className="w-4 h-4 text-purple-500" />
                            <span className="text-gray-600 dark:text-gray-400">Bookmarks:</span>
                            <span className="font-semibold text-purple-600 dark:text-purple-400">{stats.totalBookmarks}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600"></div>
                                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-indigo-400 opacity-20"></div>
                            </div>
                            <p className={`mt-6 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading analytics...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Search, Sort, and View Switcher Bar */}
                            <div className={`rounded-lg border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Search */}
                                    <div className="flex-1">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder={viewMode === 'member' ? 'Search members...' : 'Search topics...'}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode
                                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                                    } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                                            />
                                        </div>
                                    </div>

                                    {/* View Switcher */}
                                    <div className={`flex rounded-lg p-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        <button
                                            onClick={() => setViewMode('member')}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'member'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            <UserIcon className="w-4 h-4 inline mr-1.5" />
                                            Members
                                        </button>
                                        <button
                                            onClick={() => setViewMode('topic')}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'topic'
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                                }`}
                                        >
                                            <AcademicCapIcon className="w-4 h-4 inline mr-1.5" />
                                            Topics
                                        </button>
                                    </div>

                                    {/* Sort & Advanced Filters */}
                                    <div className="flex gap-2">
                                        {viewMode === 'topic' && (
                                            <>
                                                <select
                                                    value={categoryFilter}
                                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                                    className={`px-3 py-2 rounded-lg border text-sm ${darkMode
                                                        ? 'bg-gray-700 border-gray-600 text-white'
                                                        : 'bg-white border-gray-300 text-gray-900'
                                                        } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat} value={cat}>
                                                            {cat === 'all' ? 'All Categories' : cat}
                                                        </option>
                                                    ))}
                                                </select>
                                                <select
                                                    value={`${sortBy}-${sortOrder}`}
                                                    onChange={(e) => {
                                                        const [by, order] = e.target.value.split('-');
                                                        setSortBy(by);
                                                        setSortOrder(order);
                                                    }}
                                                    className={`px-3 py-2 rounded-lg border text-sm ${darkMode
                                                        ? 'bg-gray-700 border-gray-600 text-white'
                                                        : 'bg-white border-gray-300 text-gray-900'
                                                        } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                                                >
                                                    <option value="name-asc">Name (A-Z)</option>
                                                    <option value="name-desc">Name (Z-A)</option>
                                                    <option value="completed-desc">Most Completed</option>
                                                    <option value="completed-asc">Least Completed</option>
                                                    <option value="bookmarked-desc">Most Bookmarked</option>
                                                    <option value="bookmarked-asc">Least Bookmarked</option>
                                                </select>
                                            </>
                                        )}
                                        <button
                                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showAdvancedFilters
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : darkMode
                                                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <AdjustmentsHorizontalIcon className="w-4 h-4 inline mr-1.5" />
                                            Filters
                                        </button>
                                    </div>
                                </div>

                                {/* Results Count */}
                                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                    Showing <span className="font-semibold text-gray-900 dark:text-white">
                                        {viewMode === 'member' ? filteredMembers.length : filteredTopics.length}
                                    </span> {viewMode === 'member' ? 'members' : 'topics'}
                                </div>
                            </div>

                            {/* Table */}
                            <div className={`rounded-lg border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="overflow-x-auto">
                                    {viewMode === 'member' ? (
                                        /* Member View Table */
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className={darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}>
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Member</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Completed</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Bookmarked</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Notes</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Last Active</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {filteredMembers.length > 0 ? (
                                                    filteredMembers.map((member, idx) => (
                                                        <tr
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedMember(member);
                                                                setShowModal(true);
                                                            }}
                                                            className={`cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}`}
                                                        >
                                                            <td className="px-4 py-2.5">
                                                                <div>
                                                                    <p className="text-xs font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                                                    <CheckCircleSolidIcon className="w-3 h-3" />
                                                                    {member.completed_count}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
                                                                    <BookmarkSolidIcon className="w-3 h-3" />
                                                                    {member.bookmarked_count}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{member.notes_count}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {member.last_updated ? new Date(member.last_updated).toLocaleDateString() : 'Never'}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="5" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                                            {searchQuery ? 'No members found matching your search' : 'No member progress data available'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        /* Topic View Table */
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className={darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}>
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Topic</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Category</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Completed By</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Bookmarked By</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {filteredTopics.length > 0 ? (
                                                    filteredTopics.map((topic, idx) => (
                                                        <tr
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedTopic(topic);
                                                                setShowModal(true);
                                                            }}
                                                            className={`cursor-pointer transition-colors ${darkMode ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}`}
                                                        >
                                                            <td className="px-4 py-2.5">
                                                                <p className="text-xs font-medium text-gray-900 dark:text-white">{topic.name}</p>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                                                    }`}>
                                                                    {topic.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                                                    <CheckCircleSolidIcon className="w-3 h-3" />
                                                                    {topic.completed.length}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
                                                                    <BookmarkSolidIcon className="w-3 h-3" />
                                                                    {topic.bookmarked.length}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                                            {searchQuery ? 'No topics found matching your search' : 'No topic data available'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Member or Topic Details */}
            {showModal && (selectedMember || selectedTopic) && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => {
                        setShowModal(false);
                        setSelectedMember(null);
                        setSelectedTopic(null);
                    }}
                >
                    <div
                        className={`max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`sticky top-0 px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {selectedMember ? selectedMember.full_name : selectedTopic?.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {selectedMember ? selectedMember.email : selectedTopic?.category}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedMember(null);
                                        setSelectedTopic(null);
                                    }}
                                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="px-6 py-4">
                            {selectedMember ? (
                                /* Member Details */
                                <div className="space-y-4">
                                    {/* Stats Summary */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedMember.completed_count}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed</p>
                                        </div>
                                        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{selectedMember.bookmarked_count}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bookmarked</p>
                                        </div>
                                        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedMember.notes_count}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Notes</p>
                                        </div>
                                    </div>

                                    {/* Completed Topics */}
                                    {selectedMember.completed_topics && selectedMember.completed_topics.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                                <CheckCircleSolidIcon className="w-4 h-4 text-green-600" />
                                                Completed Topics ({selectedMember.completed_topics.length})
                                            </h4>
                                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                                {selectedMember.completed_topics.map((topic, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-center justify-between px-2.5 py-1.5 rounded ${darkMode ? 'bg-gray-700/20 hover:bg-gray-700/30' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                                                    >
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{topic.topic_name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ml-2 flex-shrink-0 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                                            {topic.category || 'Uncategorized'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bookmarked Topics */}
                                    {selectedMember.bookmarked_topics && selectedMember.bookmarked_topics.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                                <BookmarkSolidIcon className="w-4 h-4 text-amber-600" />
                                                Bookmarked Topics ({selectedMember.bookmarked_topics.length})
                                            </h4>
                                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                                {selectedMember.bookmarked_topics.map((topic, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-center justify-between px-2.5 py-1.5 rounded ${darkMode ? 'bg-gray-700/20 hover:bg-gray-700/30' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                                                    >
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{topic.topic_name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ml-2 flex-shrink-0 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                                            {topic.category || 'Uncategorized'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : selectedTopic ? (
                                /* Topic Details */
                                <div className="space-y-4">
                                    {/* Stats Summary */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedTopic.completed.length}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed By</p>
                                        </div>
                                        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{selectedTopic.bookmarked.length}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bookmarked By</p>
                                        </div>
                                    </div>

                                    {/* Members who completed */}
                                    {selectedTopic.completed.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                                <CheckCircleSolidIcon className="w-4 h-4 text-green-600" />
                                                Completed By ({selectedTopic.completed.length} {selectedTopic.completed.length === 1 ? 'member' : 'members'})
                                            </h4>
                                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                                {selectedTopic.completed.map((member, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`px-2.5 py-2 rounded ${darkMode ? 'bg-gray-700/20 hover:bg-gray-700/30' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.name}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {member.count > 1 && (
                                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                        ×{member.count}
                                                                    </span>
                                                                )}
                                                                {member.completed_at && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                                        {new Date(member.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Members who bookmarked */}
                                    {selectedTopic.bookmarked.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                                <BookmarkSolidIcon className="w-4 h-4 text-amber-600" />
                                                Bookmarked By ({selectedTopic.bookmarked.length})
                                            </h4>
                                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                                {selectedTopic.bookmarked.map((member, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`px-2.5 py-2 rounded ${darkMode ? 'bg-gray-700/20 hover:bg-gray-700/30' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                                                    >
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{member.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
