import Navbar from "./Navbar";
import Hero from "./Hero";
import Features from "./Features";
import Members from "./Members";
import ImpactStats from "./ImpactStats";
import Testimonials from "./Testimonials";
import CTASection from "./CTASection";
import Footer from "./Footer";
import { useAuth } from '../../context/AuthContext';
import { useMemo } from 'react';

const roleLabels = {
    0: 'Guest',
    1: 'Mentee',
    2: 'Contributor',
    3: 'Mentor',
    4: 'Team',
    5: 'Admin'
};

const Home = () => {
    // Store previous page once (avoid rewriting each render)
    if (!localStorage.getItem('prevPage')) {
        localStorage.setItem('prevPage', '/');
    }
    const { isAuthenticated, userRole } = useAuth();
    const roleText = useMemo(() => roleLabels[userRole] ?? '', [userRole]);

    return (
        <div className="relative">
            <Navbar />
            <Hero />
            {isAuthenticated && (
                <section aria-label="Quick access" className="mx-auto max-w-6xl mt-10 px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl border border-blue-100 bg-white/70 backdrop-blur-sm shadow-sm p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Welcome back</h2>
                            {roleText && (
                                <span className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                    {roleText}
                                </span>
                            )}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[{
                                label: 'Workspace',
                                desc: 'Jump into your dashboard',
                                href: '/workspace'
                            }, {
                                label: 'Applications',
                                desc: 'Track your job pipeline',
                                href: '/workspace#applications'
                            }, {
                                label: 'Learning',
                                desc: 'Access curated lessons',
                                href: '/workspace#learning'
                            }, {
                                label: 'Profile',
                                desc: 'Update your information',
                                href: '/workspace#profile'
                            }].map((item) => (
                                <a key={item.label} href={item.href} className="group rounded-xl border border-gray-200 bg-white p-4 hover:border-blue-300 hover:shadow-md transition-all">
                                    <div className="font-semibold text-gray-800 group-hover:text-blue-600 flex items-center justify-between">
                                        {item.label}
                                        <span className="text-xs text-gray-400 group-hover:text-blue-500">→</span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 group-hover:text-gray-600">{item.desc}</p>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            <Features />
            <ImpactStats />
            <Members />
            <Testimonials />
            <CTASection />
            <Footer />
        </div>
    );
}

export default Home;