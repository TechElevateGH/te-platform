import { useEffect, useState } from 'react';
import axios from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { ChartBarIcon, TrophyIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon, BookmarkIcon as BookmarkSolidIcon, FireIcon as FireSolidIcon } from '@heroicons/react/24/solid';

export default function AdminAnalytics() {
    const { userRole: authUserRole } = useAuth();
    const userRole = authUserRole ? parseInt(authUserRole) : 0;
    const isLeadOrAdmin = userRole >= 4;
    const { darkMode } = useDarkMode();

    const [adminStatistics, setAdminStatistics] = useState(null);
    const [allMembersProgress, setAllMembersProgress] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

    if (!isLeadOrAdmin) return null;

    // Filter members based on search
    const filteredMembers = allMembersProgress.filter(
        (member) =>
            member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                            Member Learning Analytics
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Real-time overview of all member progress and engagement
                        </p>
                    </div>
                </div>
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
                    <div className="space-y-6">
                        {/* Summary Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className={`p-5 rounded-xl border transition-all duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{adminStatistics.total_members}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wide">Total Members</p>
                            </div>

                            <div className={`p-5 rounded-xl border transition-all duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                        <FireSolidIcon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{adminStatistics.members_with_progress}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wide">Active Learners</p>
                            </div>

                            <div className={`p-5 rounded-xl border transition-all duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                        <ChartBarIcon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{adminStatistics.engagement_rate}%</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wide">Engagement</p>
                            </div>

                            <div className={`p-5 rounded-xl border transition-all duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                        <CheckCircleSolidIcon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{adminStatistics.total_completions}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wide">Total Completions</p>
                            </div>
                        </div>
                        {/* Additional Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className={`p-5 rounded-xl border text-center transition-all duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{adminStatistics.avg_completions_per_member}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium uppercase tracking-wide">Avg Completions/Member</p>
                            </div>
                            <div className={`p-5 rounded-xl border text-center transition-all duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{adminStatistics.total_bookmarks}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium uppercase tracking-wide">Total Bookmarks</p>
                            </div>
                            <div className={`p-5 rounded-xl border text-center transition-all duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{adminStatistics.total_notes}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium uppercase tracking-wide">Total Notes</p>
                            </div>
                        </div>
                        {/* Most Popular Topics */}
                        {adminStatistics.most_completed_topics && adminStatistics.most_completed_topics.length > 0 && (
                            <div className={`p-6 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                        <TrophyIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <span>Most Popular Topics</span>
                                </h3>
                                <div className="space-y-2">
                                    {adminStatistics.most_completed_topics.slice(0, 5).map((item, idx) => (
                                        <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs ${idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                    idx === 1 ? 'bg-gray-300 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                            'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                                    }`}>
                                                    #{idx + 1}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.topic}</span>
                                            </div>
                                            <span className="px-3 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-medium">{item.count} completions</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Member Progress Table */}
                        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Individual Member Progress</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{filteredMembers.length} members {searchQuery && '(filtered)'}</p>
                                    </div>
                                    {/* Search Bar */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search members..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className={`pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                                }`}
                                        />
                                        <svg
                                            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'
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
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Member</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Completed</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Bookmarked</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Notes</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Active</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredMembers.length > 0 ? (
                                            filteredMembers.map((member, idx) => (
                                                <tr key={idx} className={`transition-colors ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded-md text-xs font-medium">
                                                            <CheckCircleSolidIcon className="w-3 h-3" />
                                                            {member.completed_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-md text-xs font-medium">
                                                            <BookmarkSolidIcon className="w-3 h-3" />
                                                            {member.bookmarked_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{member.notes_count}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {member.last_updated ? new Date(member.last_updated).toLocaleDateString() : 'Never'}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                    {searchQuery ? 'No members found matching your search' : 'No member progress data available'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
        </div>
    );
}
