import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import Companies from "./Companies";
import ImpactStats from "./ImpactStats";
import Testimonials from "./Testimonials";
import Footer from "./Footer";
import { useAuth } from '../../context/AuthContext';
import { useMemo } from 'react';
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
    // Store previous page once (avoid rewriting each render)
    if (!localStorage.getItem('prevPage')) {
        localStorage.setItem('prevPage', '/');
    }
    const { isAuthenticated, userRole, isGuest } = useAuth();
    const roleText = useMemo(() => roleLabels[userRole] ?? '', [userRole]);
    const showQuickAccess = isAuthenticated && !isGuest;

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
            <Features />
            <Companies />
            <ImpactStats />
            <Testimonials />
            <Footer />
        </div>
    );
}

export default Home;