import { useEffect, useState, useMemo } from 'react';
import axios from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { ChartBarIcon, XMarkIcon, UserIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon, BookmarkIcon as BookmarkSolidIcon, FireIcon as FireSolidIcon } from '@heroicons/react/24/solid';

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
                topicsMap.get(topic.topic_name).completed.push({
                    name: member.full_name,
                    email: member.email,
                    user_id: member.user_id
                });
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

    if (!isLeadOrAdmin) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            {/* Header - More Compact */}
            <div className="mb-3 sm:mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    Member Learning Analytics
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    Real-time overview of all member progress and engagement
                </p>
            </div>

            {/* Content */}
            <div>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600"></div>
                        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-indigo-400 opacity-20"></div>
                    </div>
                    <p className={`mt-6 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading analytics...</p>
                </div>
            ) : adminStatistics ? (
                <div className="space-y-4">
                    {/* Single Row Stats - Most Relevant Metrics */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{adminStatistics.total_members}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Total Members</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        
                        <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{adminStatistics.members_with_progress}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Active Learners</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                    <FireSolidIcon className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                        
                        <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{adminStatistics.total_completions}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Completions</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                                    <CheckCircleSolidIcon className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                        
                        <div className={`p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{adminStatistics.engagement_rate}%</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Engagement</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                                    <ChartBarIcon className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Table with View Switcher */}
                    <div className={`rounded-lg border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {viewMode === 'member' ? 'Members' : 'Topics'} Progress
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {viewMode === 'member' ? `${filteredMembers.length} members` : `${filteredTopics.length} topics`} {searchQuery && '(filtered)'}
                                        </p>
                                    </div>
                                    {/* View Switcher */}
                                    <div className={`flex rounded-lg p-0.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <button
                                            onClick={() => setViewMode('member')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                                viewMode === 'member'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <UserIcon className="w-3.5 h-3.5 inline mr-1" />
                                            Members
                                        </button>
                                        <button
                                            onClick={() => setViewMode('topic')}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                                viewMode === 'topic'
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            <AcademicCapIcon className="w-3.5 h-3.5 inline mr-1" />
                                            Topics
                                        </button>
                                    </div>
                                </div>
                                {/* Search Bar and Filters */}
                                <div className="flex items-center gap-2">
                                    {/* Category Filter - Only for Topic View */}
                                    {viewMode === 'topic' && (
                                        <select
                                            value={categoryFilter}
                                            onChange={(e) => setCategoryFilter(e.target.value)}
                                            className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>
                                                    {cat === 'all' ? 'All Categories' : cat}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    
                                    {/* Sort Dropdown - Only for Topic View */}
                                    {viewMode === 'topic' && (
                                        <select
                                            value={`${sortBy}-${sortOrder}`}
                                            onChange={(e) => {
                                                const [by, order] = e.target.value.split('-');
                                                setSortBy(by);
                                                setSortOrder(order);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        >
                                            <option value="name-asc">Name (A-Z)</option>
                                            <option value="name-desc">Name (Z-A)</option>
                                            <option value="completed-desc">Most Completed</option>
                                            <option value="completed-asc">Least Completed</option>
                                            <option value="bookmarked-desc">Most Bookmarked</option>
                                            <option value="bookmarked-asc">Least Bookmarked</option>
                                        </select>
                                    )}
                                    
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={`Search ${viewMode === 'member' ? 'members' : 'topics'}...`}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className={`pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                            }`}
                                    />
                                    <svg
                                        className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'
                                            }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        </div>
                        <div className="overflow-x-auto">
                            {viewMode === 'member' ? (
                                /* Member View Table */
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className={darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}>
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Member</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Completed</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Bookmarked</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Notes</th>
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
                                                    <td className="px-4 py-2.5 text-center">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                                            <CheckCircleSolidIcon className="w-3 h-3" />
                                                            {member.completed_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
                                                            <BookmarkSolidIcon className="w-3 h-3" />
                                                            {member.bookmarked_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
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
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Completed By</th>
                                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Bookmarked By</th>
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
                                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {topic.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                                            <CheckCircleSolidIcon className="w-3 h-3" />
                                                            {topic.completed.length}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center">
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
            ) : (
                <div className="flex flex-col items-center justify-center py-24">
                    <p className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Failed to load statistics
                    </p>
                </div>
            )}
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
                        className={`max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-lg border ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`sticky top-0 px-6 py-4 border-b ${
                            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
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
                                    className={`p-2 rounded-lg transition-colors ${
                                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
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
                                            <div className="space-y-1">
                                                {selectedMember.completed_topics.map((topic, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className={`flex items-center justify-between p-2 rounded-lg ${
                                                            darkMode ? 'bg-gray-700/30' : 'bg-gray-50'
                                                        }`}
                                                    >
                                                        <span className="text-xs text-gray-900 dark:text-white">{topic.topic_name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                                        }`}>
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
                                            <div className="space-y-1">
                                                {selectedMember.bookmarked_topics.map((topic, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className={`flex items-center justify-between p-2 rounded-lg ${
                                                            darkMode ? 'bg-gray-700/30' : 'bg-gray-50'
                                                        }`}
                                                    >
                                                        <span className="text-xs text-gray-900 dark:text-white">{topic.topic_name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                                        }`}>
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
                                                Completed By ({selectedTopic.completed.length})
                                            </h4>
                                            <div className="space-y-1">
                                                {selectedTopic.completed.map((member, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}
                                                    >
                                                        <p className="text-xs font-medium text-gray-900 dark:text-white">{member.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
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
                                            <div className="space-y-1">
                                                {selectedTopic.bookmarked.map((member, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}
                                                    >
                                                        <p className="text-xs font-medium text-gray-900 dark:text-white">{member.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
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
