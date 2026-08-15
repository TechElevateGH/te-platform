import { useEffect, useState } from 'react';
import axios from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import { ChartBarIcon, TrophyIcon } from 'icons';
import { CheckCircleIcon as CheckCircleSolidIcon, BookmarkIcon as BookmarkSolidIcon, FireIcon as FireSolidIcon } from 'icons';

export default function AdminAnalytics() {
    const { userRole: authUserRole } = useAuth();
    const userRole = authUserRole ? parseInt(authUserRole) : 0;
    const isLeadOrAdmin = userRole >= 4;

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
        <div className="min-h-screen bg-[var(--te-bg)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8 border-b border-[var(--te-border)] pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="te-eyebrow mb-3">Analytics</p>
                        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--te-text)] sm:text-4xl">
                            Member Learning Analytics
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--te-text-dim)]">
                            Real-time overview of all member progress and engagement
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                            <ChartBarIcon className="h-6 w-6 animate-pulse text-te-green" />
                        </div>
                        <p className="mt-4 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Loading analytics...</p>
                    </div>
                ) : adminStatistics ? (
                    <div className="space-y-6">
                        {/* Summary Stats Grid */}
                        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)] sm:grid-cols-2 lg:grid-cols-4">
                            <div className="bg-[var(--te-surface)] p-6">
                                <div className="mb-5 flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--te-surface-alt)] flex items-center justify-center">
                                        <svg className="w-5 h-5 text-te-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                </div>
                                <p className="font-mono text-4xl font-bold tracking-tight text-te-green">{adminStatistics.total_members}</p>
                                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Total Members</p>
                            </div>

                            <div className="bg-[var(--te-surface)] p-6">
                                <div className="mb-5 flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--te-surface-alt)] flex items-center justify-center">
                                        <FireSolidIcon className="w-5 h-5 text-te-green" />
                                    </div>
                                </div>
                                <p className="font-mono text-4xl font-bold tracking-tight text-te-green">{adminStatistics.members_with_progress}</p>
                                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Active Learners</p>
                            </div>

                            <div className="bg-[var(--te-surface)] p-6">
                                <div className="mb-5 flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--te-surface-alt)] flex items-center justify-center">
                                        <ChartBarIcon className="w-5 h-5 text-te-gold" />
                                    </div>
                                </div>
                                <p className="font-mono text-4xl font-bold tracking-tight text-te-gold">{adminStatistics.engagement_rate}%</p>
                                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Engagement</p>
                            </div>

                            <div className="bg-[var(--te-surface)] p-6">
                                <div className="mb-5 flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--te-surface-alt)] flex items-center justify-center">
                                        <CheckCircleSolidIcon className="w-5 h-5 text-te-green" />
                                    </div>
                                </div>
                                <p className="font-mono text-4xl font-bold tracking-tight text-te-green">{adminStatistics.total_completions}</p>
                                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Total Completions</p>
                            </div>
                        </div>
                        {/* Additional Stats */}
                        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-[var(--te-border)] bg-[var(--te-border)] sm:grid-cols-3">
                            <div className="bg-[var(--te-surface)] p-5">
                                <p className="font-mono text-2xl font-bold text-te-green">{adminStatistics.avg_completions_per_member}</p>
                                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Avg Completions/Member</p>
                            </div>
                            <div className="bg-[var(--te-surface)] p-5">
                                <p className="font-mono text-2xl font-bold text-te-gold">{adminStatistics.total_bookmarks}</p>
                                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Total Bookmarks</p>
                            </div>
                            <div className="bg-[var(--te-surface)] p-5">
                                <p className="font-mono text-2xl font-bold text-[var(--te-text)]">{adminStatistics.total_notes}</p>
                                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">Total Notes</p>
                            </div>
                        </div>
                        {/* Most Popular Topics */}
                        {adminStatistics.most_completed_topics && adminStatistics.most_completed_topics.length > 0 && (
                            <div className="te-card p-6">
                                <h3 className="mb-4 flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-wide text-[var(--te-text)]">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--te-surface-alt)] flex items-center justify-center">
                                        <TrophyIcon className="w-4 h-4 text-te-gold" />
                                    </div>
                                    <span>Most Popular Topics</span>
                                </h3>
                                <div className="space-y-2">
                                    {adminStatistics.most_completed_topics.slice(0, 5).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[var(--te-surface-alt)] hover:bg-[var(--te-hover)] transition-colors">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs ${idx === 0 ? 'te-chip-green' :
                                                    idx === 1 ? 'te-chip-gold' :
                                                        idx === 2 ? 'te-chip-red' :
                                                            'bg-[var(--te-surface-alt)] text-[var(--te-text-dim)] border border-[var(--te-border)]'
                                                    }`}>
                                                    #{idx + 1}
                                                </div>
                                                <span className="text-sm font-medium text-[var(--te-text)] truncate">{item.topic}</span>
                                            </div>
                                            <span className="te-chip-green text-xs">{item.count} completions</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Member Progress Table */}
                        <div className="te-card overflow-hidden">
                            <div className="px-6 py-4 border-b border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div>
                                        <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-[var(--te-text)]">Individual Member Progress</h3>
                                        <p className="text-xs text-[var(--te-text-dim)] mt-1">{filteredMembers.length} members {searchQuery && '(filtered)'}</p>
                                    </div>
                                    {/* Search Bar */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search members..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="te-input pl-9"
                                        />
                                        <svg
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--te-text-dim)]"
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
                                <table className="min-w-full divide-y divide-[var(--te-border)]">
                                    <thead className="bg-[var(--te-surface-alt)]">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">Member</th>
                                            <th className="px-6 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">Completed</th>
                                            <th className="px-6 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">Bookmarked</th>
                                            <th className="px-6 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">Notes</th>
                                            <th className="px-6 py-3 text-left font-mono text-xs font-semibold uppercase tracking-wider text-[var(--te-text)]">Last Active</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--te-border)]">
                                        {filteredMembers.length > 0 ? (
                                            filteredMembers.map((member, idx) => (
                                                <tr key={idx} className="transition-colors hover:bg-[var(--te-hover)]">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-[var(--te-text)]">{member.full_name}</p>
                                                            <p className="text-xs text-[var(--te-text-dim)]">{member.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="te-chip-green text-xs">
                                                            <CheckCircleSolidIcon className="w-3 h-3" />
                                                            {member.completed_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="te-chip-gold text-xs">
                                                            <BookmarkSolidIcon className="w-3 h-3" />
                                                            {member.bookmarked_count}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-[var(--te-text)] font-medium">{member.notes_count}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs text-[var(--te-text-dim)]">
                                                            {member.last_updated ? new Date(member.last_updated).toLocaleDateString() : 'Never'}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center text-[var(--te-text-dim)]">
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
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                            <ChartBarIcon className="h-6 w-6 text-[var(--te-text-dim)]" />
                        </div>
                        <p className="font-mono text-xs uppercase tracking-wide text-[var(--te-text-dim)]">
                            Failed to load statistics
                        </p>
                    </div>
                )}
            </div>
        </div>
        </div>
    );
}
