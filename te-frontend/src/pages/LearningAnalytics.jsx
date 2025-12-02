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
    ClockIcon,
    TrophyIcon,
    ArrowTrendingUpIcon
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
        if (!adminStatistics) return {
            totalMembers: 0,
            activeMembers: 0,
            totalCompletions: 0,
            totalBookmarks: 0,
            totalTime: 0,
            totalSessions: 0,
            activeStreaks: 0,
            maxStreak: 0,
            avgStreak: 0
        };
        return {
            totalMembers: adminStatistics.total_members || 0,
            activeMembers: adminStatistics.members_with_progress || 0,
            totalCompletions: adminStatistics.total_completions || 0,
            totalBookmarks: adminStatistics.total_bookmarks || 0,
            totalTime: adminStatistics.total_learning_time_seconds || 0,
            totalTimeFormatted: adminStatistics.total_learning_time_formatted || '0h 0m',
            totalSessions: adminStatistics.total_sessions || 0,
            avgSessionDuration: adminStatistics.avg_session_duration || 0,
            activeStreaks: adminStatistics.active_streaks || 0,
            maxStreak: adminStatistics.max_streak || 0,
            avgStreak: adminStatistics.avg_streak || 0,
            engagementRate: adminStatistics.engagement_rate || 0,
            categoryStats: adminStatistics.category_stats || [],
            weeklyActivity: adminStatistics.weekly_activity || []
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
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                        <div className="flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Total:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{stats.totalMembers}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FireIcon className="w-4 h-4 text-green-500" />
                            <span className="text-gray-600 dark:text-gray-400">Active:</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{stats.activeMembers}</span>
                            <span className="text-xs text-gray-500">({stats.engagementRate}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircleSolidIcon className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-600 dark:text-gray-400">Completions:</span>
                            <span className="font-semibold text-amber-600 dark:text-amber-400">{stats.totalCompletions}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-blue-500" />
                            <span className="text-gray-600 dark:text-gray-400">Time:</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.totalTimeFormatted}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <TrophyIcon className="w-4 h-4 text-orange-500" />
                            <span className="text-gray-600 dark:text-gray-400">Best Streak:</span>
                            <span className="font-semibold text-orange-600 dark:text-orange-400">{stats.maxStreak} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowTrendingUpIcon className="w-4 h-4 text-indigo-500" />
                            <span className="text-gray-600 dark:text-gray-400">Active Streaks:</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{stats.activeStreaks}</span>
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

                            </div>

                            {/* Analytics Cards - Category Breakdown & Weekly Activity */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Category Breakdown */}
                                <div className={`rounded-lg border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <AcademicCapIcon className="w-4 h-4 text-indigo-500" />
                                        Category Breakdown
                                    </h3>
                                    <div className="space-y-3">
                                        {stats.categoryStats.length > 0 ? (
                                            stats.categoryStats.slice(0, 5).map((cat, idx) => {
                                                const maxCompletions = Math.max(...stats.categoryStats.map(c => c.completions));
                                                const percentage = maxCompletions > 0 ? (cat.completions / maxCompletions) * 100 : 0;
                                                const colors = [
                                                    'from-indigo-500 to-blue-500',
                                                    'from-emerald-500 to-teal-500',
                                                    'from-amber-500 to-orange-500',
                                                    'from-pink-500 to-rose-500',
                                                    'from-purple-500 to-violet-500',
                                                ];
                                                return (
                                                    <div key={cat.category}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{cat.category}</span>
                                                            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{cat.completions} completions</span>
                                                        </div>
                                                        <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                                            <div
                                                                className={`h-full rounded-full bg-gradient-to-r ${colors[idx % colors.length]}`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No category data available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Weekly Activity */}
                                <div className={`rounded-lg border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-500" />
                                        Weekly Activity
                                    </h3>
                                    <div className="flex items-end justify-between h-24 gap-1">
                                        {stats.weeklyActivity.length > 0 ? (
                                            stats.weeklyActivity.map((day, idx) => {
                                                const maxActive = Math.max(...stats.weeklyActivity.map(d => d.active_members));
                                                const height = maxActive > 0 ? (day.active_members / maxActive) * 100 : 0;
                                                const dayLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                                                return (
                                                    <div key={day.date} className="flex-1 flex flex-col items-center">
                                                        <div className="relative w-full flex justify-center mb-1">
                                                            <div
                                                                className={`w-6 rounded-t transition-all ${height > 0
                                                                    ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                                                                    : darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                                                    }`}
                                                                style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                                                                title={`${day.active_members} active members`}
                                                            />
                                                            {height > 0 && (
                                                                <span className="absolute -top-4 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                                    {day.active_members}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className={`text-[10px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{dayLabel}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            Array.from({ length: 7 }).map((_, idx) => (
                                                <div key={idx} className="flex-1 flex flex-col items-center">
                                                    <div className={`w-6 h-4 rounded-t ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
                                                    <span className={`text-[10px] mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>-</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className={`mt-2 pt-2 border-t text-center ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Last 7 days activity</span>
                                    </div>
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
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Time Spent</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Streak</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Sessions</th>
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
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                                                                    <ClockIcon className="w-3 h-3" />
                                                                    {member.total_time_formatted || '0h 0m'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex items-center gap-1">
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${member.current_streak > 0
                                                                        ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'
                                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                                        }`}>
                                                                        <FireIcon className="w-3 h-3" />
                                                                        {member.current_streak || 0}
                                                                    </span>
                                                                    {member.longest_streak > 0 && member.longest_streak > member.current_streak && (
                                                                        <span className="text-xs text-gray-400" title="Best streak">
                                                                            (max: {member.longest_streak})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{member.session_count || 0}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {member.last_activity_date || (member.last_updated ? new Date(member.last_updated).toLocaleDateString() : 'Never')}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
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
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedMember.completed_count}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed</p>
                                        </div>
                                        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedMember.total_time_formatted || '0h'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Time Spent</p>
                                        </div>
                                        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{selectedMember.current_streak || 0}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current Streak</p>
                                        </div>
                                        <div className={`p-3 rounded-lg text-center ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{selectedMember.session_count || 0}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sessions</p>
                                        </div>
                                    </div>

                                    {/* Streak Info */}
                                    {(selectedMember.current_streak > 0 || selectedMember.longest_streak > 0) && (
                                        <div className={`p-3 rounded-lg ${darkMode ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-200'} border`}>
                                            <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                                                <TrophyIcon className="w-4 h-4" />
                                                Streak Stats
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Current: </span>
                                                    <span className="font-bold text-orange-600 dark:text-orange-400">{selectedMember.current_streak || 0} days</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">Best: </span>
                                                    <span className="font-bold text-orange-600 dark:text-orange-400">{selectedMember.longest_streak || 0} days</span>
                                                </div>
                                                {selectedMember.last_activity_date && (
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Last: </span>
                                                        <span className="font-medium text-gray-800 dark:text-gray-200">{selectedMember.last_activity_date}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Category Breakdown */}
                                    {selectedMember.category_breakdown && Object.keys(selectedMember.category_breakdown).length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                                <AcademicCapIcon className="w-4 h-4 text-indigo-600" />
                                                Progress by Category
                                            </h4>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {Object.entries(selectedMember.category_breakdown).map(([category, data], idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`flex items-center justify-between px-3 py-2 rounded ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}
                                                    >
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">{category}</span>
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                                ✓ {data.completed}
                                                            </span>
                                                            {data.in_progress > 0 && (
                                                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                                                    ◐ {data.in_progress}
                                                                </span>
                                                            )}
                                                            {data.time_seconds > 0 && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {Math.floor(data.time_seconds / 60)}m
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

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
                                                        <div className="flex items-center gap-2">
                                                            {topic.count > 1 && (
                                                                <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                    ×{topic.count}
                                                                </span>
                                                            )}
                                                            <span className={`text-xs px-2 py-0.5 rounded ml-2 flex-shrink-0 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                                                {topic.category || 'Uncategorized'}
                                                            </span>
                                                        </div>
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
