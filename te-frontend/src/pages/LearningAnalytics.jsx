import { useEffect, useState, useMemo } from 'react';
import axios from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
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
} from 'icons';
import { CheckCircleIcon as CheckCircleSolidIcon, BookmarkIcon as BookmarkSolidIcon } from 'icons';

export default function LearningAnalytics() {
    const { userRole: authUserRole } = useAuth();
    const userRole = authUserRole ? parseInt(authUserRole) : 0;
    const isLeadOrAdmin = userRole >= 4;

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
            totalTimeFormatted: '0h 0m',
            totalSessions: 0,
            avgSessionDuration: 0,
            activeStreaks: 0,
            maxStreak: 0,
            avgStreak: 0,
            engagementRate: 0,
            categoryStats: [],
            weeklyActivity: []
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
        <div className="min-h-screen bg-[var(--te-bg)]">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 border-b border-[var(--te-border)] bg-[var(--te-surface)]">
                {/* Title Bar */}
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                <ChartBarIcon className="w-6 h-6 text-te-green" />
                            </div>
                            <div>
                                <p className="te-eyebrow mb-2">{'// analytics'}</p>
                                <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--te-text)]">Learning Analytics</h1>
                                <p className="mt-2 text-sm leading-relaxed text-[var(--te-text-dim)]">Track member progress, topic adoption, and engagement signals.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="border-t border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                    <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-[var(--te-border)] px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-6 lg:px-8">
                        <div className="bg-[var(--te-surface-alt)] py-3">
                            <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                <UserGroupIcon className="w-4 h-4 text-te-green" />
                                <span className="font-mono text-[10px] uppercase tracking-wide">Total</span>
                            </div>
                            <span className="mt-1 block font-mono text-lg font-semibold text-te-green">{stats.totalMembers}</span>
                        </div>
                        <div className="bg-[var(--te-surface-alt)] py-3 pl-3">
                            <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                <FireIcon className="w-4 h-4 text-te-green" />
                                <span className="font-mono text-[10px] uppercase tracking-wide">Active</span>
                            </div>
                            <span className="mt-1 block font-mono text-lg font-semibold text-te-green">{stats.activeMembers} <span className="text-xs text-[var(--te-text-dim)]">({stats.engagementRate}%)</span></span>
                        </div>
                        <div className="bg-[var(--te-surface-alt)] py-3 pl-3">
                            <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                <CheckCircleSolidIcon className="w-4 h-4 text-te-green" />
                                <span className="font-mono text-[10px] uppercase tracking-wide">Completions</span>
                            </div>
                            <span className="mt-1 block font-mono text-lg font-semibold text-te-green">{stats.totalCompletions}</span>
                        </div>
                        <div className="bg-[var(--te-surface-alt)] py-3 pl-3">
                            <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                <ClockIcon className="w-4 h-4 text-te-gold" />
                                <span className="font-mono text-[10px] uppercase tracking-wide">Time</span>
                            </div>
                            <span className="mt-1 block font-mono text-lg font-semibold text-te-gold">{stats.totalTimeFormatted}</span>
                        </div>
                        <div className="bg-[var(--te-surface-alt)] py-3 pl-3">
                            <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                <TrophyIcon className="w-4 h-4 text-te-gold" />
                                <span className="font-mono text-[10px] uppercase tracking-wide">Best Streak</span>
                            </div>
                            <span className="mt-1 block font-mono text-lg font-semibold text-te-gold">{stats.maxStreak} days</span>
                        </div>
                        <div className="bg-[var(--te-surface-alt)] py-3 pl-3">
                            <div className="flex items-center gap-2 text-[var(--te-text-dim)]">
                                <ArrowTrendingUpIcon className="w-4 h-4 text-te-green" />
                                <span className="font-mono text-[10px] uppercase tracking-wide">Streaks</span>
                            </div>
                            <span className="mt-1 block font-mono text-lg font-semibold text-te-green">{stats.activeStreaks}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div>
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                <ChartBarIcon className="h-6 w-6 animate-pulse text-te-green" />
                            </div>
                            <p className="mt-4 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Loading analytics...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Search, Sort, and View Switcher Bar */}
                            <div className="te-card p-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Search */}
                                    <div className="flex-1">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--te-text-dim)]" />
                                            <input
                                                type="text"
                                                placeholder={viewMode === 'member' ? 'Search members...' : 'Search topics...'}
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="te-input pl-10"
                                            />
                                        </div>
                                    </div>

                                    {/* View Switcher */}
                                    <div className="flex rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-1">
                                        <button
                                            onClick={() => setViewMode('member')}
                                            className={`te-btn-sm ${viewMode === 'member' ? 'te-btn-primary' : 'te-btn-ghost'}`}
                                        >
                                            <UserIcon className="w-4 h-4 inline mr-1.5" />
                                            Members
                                        </button>
                                        <button
                                            onClick={() => setViewMode('topic')}
                                            className={`te-btn-sm ${viewMode === 'topic' ? 'te-btn-primary' : 'te-btn-ghost'}`}
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
                                                    className="te-select"
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
                                                    className="te-select"
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
                                            className={`te-btn-sm ${showAdvancedFilters ? 'te-btn-primary' : 'te-btn-secondary'}`}
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
                                <div className="te-card p-4">
                                    <h3 className="mb-3 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-[var(--te-text)]">
                                        <AcademicCapIcon className="w-4 h-4 text-te-gold" />
                                        Category Breakdown
                                    </h3>
                                    <div className="space-y-3">
                                        {stats.categoryStats.length > 0 ? (
                                            stats.categoryStats.slice(0, 5).map((cat, idx) => {
                                                const maxCompletions = Math.max(...stats.categoryStats.map(c => c.completions));
                                                const percentage = maxCompletions > 0 ? (cat.completions / maxCompletions) * 100 : 0;
                                                return (
                                                    <div key={cat.category}>
                                                        <div className="flex justify-between text-xs mb-1">
                                                            <span className="text-[var(--te-text)]">{cat.category}</span>
                                                            <span className="font-medium text-[var(--te-text)]">{cat.completions} completions</span>
                                                        </div>
                                                        <div className="h-2 overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                                            <div
                                                                className={`h-full rounded-lg ${idx % 2 === 0 ? 'bg-[var(--te-green)]' : 'bg-[var(--te-gold)]'}`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-[var(--te-text-dim)] py-4">No category data available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Weekly Activity */}
                                <div className="te-card p-4">
                                    <h3 className="mb-3 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-[var(--te-text)]">
                                        <ArrowTrendingUpIcon className="w-4 h-4 text-te-green" />
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
                                                                    ? (idx % 2 === 0 ? 'bg-[var(--te-green)]' : 'bg-[var(--te-gold)]') : 'bg-[var(--te-surface-alt)]'
                                                                    }`}
                                                                style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                                                                title={`${day.active_members} active members`}
                                                            />
                                                            {height > 0 && (
                                                                <span className="absolute -top-4 font-mono text-[10px] font-semibold text-te-green">
                                                                    {day.active_members}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-[var(--te-text-dim)]">{dayLabel}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            Array.from({ length: 7 }).map((_, idx) => (
                                                <div key={idx} className="flex-1 flex flex-col items-center">
                                                    <div className={`w-6 h-4 rounded-t bg-[var(--te-surface-alt)]`} />
                                                    <span className="mt-1 text-[10px] text-[var(--te-text-dim)]">-</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <div className="mt-2 border-t border-[var(--te-border)] pt-2">
                                        <span className="text-xs text-[var(--te-text-dim)]">Last 7 days activity</span>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="te-card overflow-hidden">
                                <div className="overflow-x-auto">
                                    {viewMode === 'member' ? (
                                        /* Member View Table */
                                        <table className="min-w-full divide-y divide-[var(--te-border)]">
                                            <thead className="bg-[var(--te-surface-alt)]">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] ">Member</th>
                                                    <th className="px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] ">Completed</th>
                                                    <th className="px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] ">Time Spent</th>
                                                    <th className="px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] ">Streak</th>
                                                    <th className="px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] ">Sessions</th>
                                                    <th className="px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] ">Last Active</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--te-border)]">
                                                {filteredMembers.length > 0 ? (
                                                    filteredMembers.map((member, idx) => (
                                                        <tr
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedMember(member);
                                                                setShowModal(true);
                                                            }}
                                                            className="cursor-pointer transition-colors hover:bg-[var(--te-hover)]"
                                                        >
                                                            <td className="px-4 py-2.5">
                                                                <div>
                                                                    <p className="text-xs font-medium text-[var(--te-text)] ">{member.full_name}</p>
                                                                    <p className="text-xs text-[var(--te-text-dim)]">{member.email}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="te-chip-green text-xs">
                                                                    <CheckCircleSolidIcon className="w-3 h-3" />
                                                                    {member.completed_count}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="te-chip-gold text-xs">
                                                                    <ClockIcon className="w-3 h-3" />
                                                                    {member.total_time_formatted || '0h 0m'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <div className="flex items-center gap-1">
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${member.current_streak > 0
                                                                        ? 'te-chip-green'
                                                                        : 'te-chip text-[var(--te-text-dim)]'
                                                                        }`}>
                                                                        <FireIcon className="w-3 h-3" />
                                                                        {member.current_streak || 0}
                                                                    </span>
                                                                    {member.longest_streak > 0 && member.longest_streak > member.current_streak && (
                                                                        <span className="text-xs text-[var(--te-text-dim)]" title="Best streak">
                                                                            (max: {member.longest_streak})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="text-xs text-[var(--te-text)]  font-medium">{member.session_count || 0}</span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <p className="text-xs text-[var(--te-text-dim)]">
                                                                    {member.last_activity_date || (member.last_updated ? new Date(member.last_updated).toLocaleDateString() : 'Never')}
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="px-4 py-6 text-sm text-[var(--te-text-dim)]">
                                                            {searchQuery ? 'No members found matching your search' : 'No member progress data available'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        /* Topic View Table */
                                        <table className="min-w-full divide-y divide-[var(--te-border)]">
                                            <thead className="bg-[var(--te-surface-alt)]">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] ">Topic</th>
                                                    <th className="px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] ">Category</th>
                                                    <th className="px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] ">Completed By</th>
                                                    <th className="px-4 py-2 text-left font-mono text-xs font-semibold uppercase tracking-wide text-[var(--te-text)] ">Bookmarked By</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--te-border)]">
                                                {filteredTopics.length > 0 ? (
                                                    filteredTopics.map((topic, idx) => (
                                                        <tr
                                                            key={idx}
                                                            onClick={() => {
                                                                setSelectedTopic(topic);
                                                                setShowModal(true);
                                                            }}
                                                            className="cursor-pointer transition-colors hover:bg-[var(--te-hover)]"
                                                        >
                                                            <td className="px-4 py-2.5">
                                                                <p className="text-xs font-medium text-[var(--te-text)] ">{topic.name}</p>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="te-chip-gold text-xs">
                                                                    {topic.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="te-chip-green text-xs">
                                                                    <CheckCircleSolidIcon className="w-3 h-3" />
                                                                    {topic.completed.length}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <span className="te-chip-gold text-xs">
                                                                    <BookmarkSolidIcon className="w-3 h-3" />
                                                                    {topic.bookmarked.length}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="4" className="px-4 py-6 text-sm text-[var(--te-text-dim)]">
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
                    className="fixed inset-0 bg-black/50  z-50 flex items-center justify-center p-4"
                    onClick={() => {
                        setShowModal(false);
                        setSelectedMember(null);
                        setSelectedTopic(null);
                    }}
                >
                    <div
                        className="te-card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 border-b border-[var(--te-border)] bg-[var(--te-surface)] px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--te-text)] ">
                                        {selectedMember ? selectedMember.full_name : selectedTopic?.name}
                                    </h3>
                                    <p className="text-sm text-[var(--te-text-dim)]">
                                        {selectedMember ? selectedMember.email : selectedTopic?.category}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedMember(null);
                                        setSelectedTopic(null);
                                    }}
                                    className="te-icon-btn"
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
                                        <div className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                                            <p className="font-mono text-2xl font-bold text-te-green">{selectedMember.completed_count}</p>
                                            <p className="text-xs text-[var(--te-text-dim)] mt-1">Completed</p>
                                        </div>
                                        <div className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                                            <p className="font-mono text-2xl font-bold text-te-gold">{selectedMember.total_time_formatted || '0h'}</p>
                                            <p className="text-xs text-[var(--te-text-dim)] mt-1">Time Spent</p>
                                        </div>
                                        <div className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                                            <p className="font-mono text-2xl font-bold text-te-green">{selectedMember.current_streak || 0}</p>
                                            <p className="text-xs text-[var(--te-text-dim)] mt-1">Current Streak</p>
                                        </div>
                                        <div className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                                            <p className="font-mono text-2xl font-bold text-[var(--te-text)]">{selectedMember.session_count || 0}</p>
                                            <p className="text-xs text-[var(--te-text-dim)] mt-1">Sessions</p>
                                        </div>
                                    </div>

                                    {/* Streak Info */}
                                    {(selectedMember.current_streak > 0 || selectedMember.longest_streak > 0) && (
                                        <div className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                                            <h4 className="text-sm font-semibold text-[var(--te-text)] mb-2 flex items-center gap-2">
                                                <TrophyIcon className="w-4 h-4 text-te-gold" />
                                                Streak Stats
                                            </h4>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div>
                                                    <span className="text-[var(--te-text-dim)]">Current: </span>
                                                    <span className="font-bold text-[var(--te-text)]">{selectedMember.current_streak || 0} days</span>
                                                </div>
                                                <div>
                                                    <span className="text-[var(--te-text-dim)]">Best: </span>
                                                    <span className="font-bold text-[var(--te-text)]">{selectedMember.longest_streak || 0} days</span>
                                                </div>
                                                {selectedMember.last_activity_date && (
                                                    <div>
                                                        <span className="text-[var(--te-text-dim)]">Last: </span>
                                                        <span className="font-medium text-[var(--te-text)] ">{selectedMember.last_activity_date}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Category Breakdown */}
                                    {selectedMember.category_breakdown && Object.keys(selectedMember.category_breakdown).length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-[var(--te-text)]  mb-2 flex items-center gap-2">
                                                <AcademicCapIcon className="w-4 h-4 text-te-gold" />
                                                Progress by Category
                                            </h4>
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {Object.entries(selectedMember.category_breakdown).map(([category, data], idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between border border-[var(--te-border)] bg-[var(--te-surface-alt)] px-3 py-2"
                                                    >
                                                        <span className="text-sm font-medium text-[var(--te-text)]  truncate flex-1">{category}</span>
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <span className="text-xs text-[var(--te-text)] font-medium">
                                                                ✓ {data.completed}
                                                            </span>
                                                            {data.in_progress > 0 && (
                                                                <span className="text-xs text-[var(--te-text)]">
                                                                    ◐ {data.in_progress}
                                                                </span>
                                                            )}
                                                            {data.time_seconds > 0 && (
                                                                <span className="text-xs text-[var(--te-text-dim)]">
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
                                            <h4 className="text-sm font-semibold text-[var(--te-text)]  mb-2 flex items-center gap-2">
                                                <CheckCircleSolidIcon className="w-4 h-4 text-te-green" />
                                                Completed Topics ({selectedMember.completed_topics.length})
                                            </h4>
                                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                                {selectedMember.completed_topics.map((topic, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between border border-[var(--te-border)] bg-[var(--te-surface-alt)] px-2.5 py-1.5 transition-colors hover:bg-[var(--te-hover)]"
                                                    >
                                                        <span className="text-sm font-medium text-[var(--te-text)]  truncate flex-1">{topic.topic_name}</span>
                                                        <div className="flex items-center gap-2">
                                                            {topic.count > 1 && (
                                                                <span className="te-chip text-xs">
                                                                    ×{topic.count}
                                                                </span>
                                                            )}
                                                            <span className="te-chip-gold ml-2 flex-shrink-0 text-xs">
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
                                            <h4 className="text-sm font-semibold text-[var(--te-text)]  mb-2 flex items-center gap-2">
                                                <BookmarkSolidIcon className="w-4 h-4 text-te-gold" />
                                                Bookmarked Topics ({selectedMember.bookmarked_topics.length})
                                            </h4>
                                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                                {selectedMember.bookmarked_topics.map((topic, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between border border-[var(--te-border)] bg-[var(--te-surface-alt)] px-2.5 py-1.5 transition-colors hover:bg-[var(--te-hover)]"
                                                    >
                                                        <span className="text-sm font-medium text-[var(--te-text)]  truncate flex-1">{topic.topic_name}</span>
                                                        <span className="te-chip-gold ml-2 flex-shrink-0 text-xs">
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
                                        <div className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                                            <p className="font-mono text-2xl font-bold text-te-green">{selectedTopic.completed.length}</p>
                                            <p className="text-xs text-[var(--te-text-dim)] mt-1">Completed By</p>
                                        </div>
                                        <div className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-3">
                                            <p className="font-mono text-2xl font-bold text-te-gold">{selectedTopic.bookmarked.length}</p>
                                            <p className="text-xs text-[var(--te-text-dim)] mt-1">Bookmarked By</p>
                                        </div>
                                    </div>

                                    {/* Members who completed */}
                                    {selectedTopic.completed.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-[var(--te-text)]  mb-2 flex items-center gap-2">
                                                <CheckCircleSolidIcon className="w-4 h-4 text-te-green" />
                                                Completed By ({selectedTopic.completed.length} {selectedTopic.completed.length === 1 ? 'member' : 'members'})
                                            </h4>
                                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                                {selectedTopic.completed.map((member, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] px-2.5 py-2 transition-colors hover:bg-[var(--te-hover)]"
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-[var(--te-text)]  truncate">{member.name}</p>
                                                                <p className="text-xs text-[var(--te-text-dim)] truncate">{member.email}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                {member.count > 1 && (
                                                                    <span className="te-chip text-xs">
                                                                        ×{member.count}
                                                                    </span>
                                                                )}
                                                                {member.completed_at && (
                                                                    <span className="text-xs text-[var(--te-text-dim)] whitespace-nowrap">
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
                                            <h4 className="text-sm font-semibold text-[var(--te-text)]  mb-2 flex items-center gap-2">
                                                <BookmarkSolidIcon className="w-4 h-4 text-te-gold" />
                                                Bookmarked By ({selectedTopic.bookmarked.length})
                                            </h4>
                                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                                {selectedTopic.bookmarked.map((member, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="border border-[var(--te-border)] bg-[var(--te-surface-alt)] px-2.5 py-2 transition-colors hover:bg-[var(--te-hover)]"
                                                    >
                                                        <p className="text-sm font-medium text-[var(--te-text)]  truncate">{member.name}</p>
                                                        <p className="text-xs text-[var(--te-text-dim)] truncate">{member.email}</p>
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
