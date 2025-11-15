import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import Companies from "./Companies";
import ImpactStats from "./ImpactStats";
import Testimonials from "./Testimonials";
import Footer from "./Footer";
import { useAuth } from '../../context/AuthContext';
import { useMemo, useEffect, useState } from 'react';
import axiosInstance from '../../axiosConfig';
import {
    BriefcaseIcon,
    AcademicCapIcon,
    RocketLaunchIcon,
    ChartBarIcon,
    UsersIcon
} from '@heroicons/react/24/outline';

const roleLabels = {
    0: 'Guest',
    1: 'Member',
    2: 'Lead',
    3: 'Admin'
};

const Home = () => {
    useEffect(() => {
        if (!sessionStorage.getItem('prevPage')) {
            sessionStorage.setItem('prevPage', '/');
        }
    }, []);
    const { isAuthenticated, userRole, isGuest, userId } = useAuth();
    const roleText = useMemo(() => roleLabels[userRole] ?? '', [userRole]);
    const showQuickAccess = isAuthenticated && !isGuest;
    const isMember = userRole === 1;

    const [slackJoined, setSlackJoined] = useState(null);
    const [loadingSlackStatus, setLoadingSlackStatus] = useState(true);

    // Fetch user's slack_joined status if they're a member
    useEffect(() => {
        if (isMember && userId) {
            axiosInstance.get(`/users/${userId}`)
                .then(response => {
                    setSlackJoined(response.data.user.slack_joined);
                    setLoadingSlackStatus(false);
                })
                .catch(error => {
                    console.error('Error fetching user data:', error);
                    setLoadingSlackStatus(false);
                });
        } else {
            setLoadingSlackStatus(false);
        }
    }, [isMember, userId]);

    const handleJoinSlack = async () => {
        const slackInviteUrl = 'https://join.slack.com/t/techelevateworkspace/shared_invite/zt-3ig9yhi07-XZpHhVVnlv0Cj3lTyJLAuw';

        // Open Slack in new tab
        window.open(slackInviteUrl, '_blank');

        // Update slack_joined status
        try {
            await axiosInstance.patch(`/users/${userId}`, {
                slack_joined: true
            });
            setSlackJoined(true);
        } catch (error) {
            console.error('Error updating slack_joined status:', error);
        }
    };

    const quickAccessLinks = [
        {
            label: 'Workspace',
            desc: 'Your personal dashboard',
            href: '/workspace',
            icon: RocketLaunchIcon,
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            label: 'Applications',
            desc: 'Track your job pipeline',
            href: '/workspace#applications',
            icon: BriefcaseIcon,
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            label: 'Learning',
            desc: 'Access curated lessons',
            href: '/workspace#learning',
            icon: AcademicCapIcon,
            gradient: 'from-green-500 to-emerald-500'
        },
        {
            label: 'Referrals',
            desc: 'Get company referrals',
            href: '/workspace#referrals',
            icon: UsersIcon,
            gradient: 'from-orange-500 to-amber-500'
        }
    ];

    return (
        <div className="relative bg-white dark:bg-gray-900 transition-colors">
            <Navbar />
            <Hero />
            {showQuickAccess && (
                <section aria-label="Quick access" className="relative mx-auto max-w-7xl -mt-16 px-4 sm:px-6 lg:px-8 z-10 mb-16">
                    <div className="rounded-3xl border border-blue-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-8">
                        {/* Header */}
                        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                    Welcome back! 👋
                                </h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ready to continue your journey?</p>
                            </div>
                            {roleText && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md">
                                        {roleText}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Quick Access Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {quickAccessLinks.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={item.label}
                                        href={item.href}
                                        className="group relative overflow-hidden rounded-2xl border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700 p-6 hover:border-transparent hover:shadow-xl transition-all duration-300"
                                    >
                                        {/* Gradient Background on Hover */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300`}></div>

                                        {/* Icon */}
                                        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-full h-full text-white" />
                                        </div>

                                        {/* Content */}
                                        <div className="relative">
                                            <div className="font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {item.label}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">{item.desc}</p>
                                        </div>

                                        {/* Arrow Indicator */}
                                        <div className="relative mt-4 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span>Get started</span>
                                            <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>

                        {/* Stats Bar */}
                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Active Applications', value: '—', icon: BriefcaseIcon },
                                    { label: 'Lessons Completed', value: '—', icon: AcademicCapIcon },
                                    { label: 'Referrals Received', value: '—', icon: UsersIcon },
                                    { label: 'Profile Score', value: '—', icon: ChartBarIcon }
                                ].map((stat) => {
                                    const StatIcon = stat.icon;
                                    return (
                                        <div key={stat.label} className="text-center">
                                            <div className="flex justify-center mb-2">
                                                <StatIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Slack Join Section - Only for Members who haven't joined */}
            {isMember && !loadingSlackStatus && slackJoined === false && (
                <section aria-label="Join Slack community" className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-16">
                    <div className="rounded-3xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-blue-900/20 shadow-xl overflow-hidden">
                        <div className="relative p-8 sm:p-12">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-300/30 to-cyan-300/30 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-cyan-300/30 to-blue-300/30 dark:from-cyan-500/20 dark:to-blue-500/20 rounded-full blur-3xl"></div>

                            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                                {/* Icon and Content */}
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center rounded-3xl bg-white dark:bg-gray-800 shadow-2xl p-6">
                                        {/* Slack icon */}
                                        <svg className="w-full h-full" viewBox="0 0 127 127" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A" />
                                            <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0" />
                                            <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D" />
                                            <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="flex-1 text-center lg:text-left">
                                    <h3 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 bg-clip-text text-transparent">
                                        Join Our Slack Community! 🚀
                                    </h3>
                                    <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                                        Connect with mentors, peers, and get real-time support on your tech journey
                                    </p>
                                    <div className="flex flex-wrap gap-3 justify-center lg:justify-start mt-4 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">💬</span>
                                            <span>Live Support</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🤝</span>
                                            <span>Network</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">📢</span>
                                            <span>Updates</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">🎯</span>
                                            <span>Resources</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-shrink-0">
                                    <button
                                        onClick={handleJoinSlack}
                                        className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            Join Workspace
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <Features />
            <Companies />
            <ImpactStats />
            <Testimonials />
            <Footer />
        </div>
    );
}

export default Home;