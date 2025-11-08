import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircleIcon, Bars3Icon } from '@heroicons/react/24/solid';
import { ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

const WorkspaceNavbar = ({ currentPage, onMobileMenuOpen }) => {
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const { accessToken, logout } = useAuth();
    const { userInfo } = useData();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 md:left-80 z-40 transition-all duration-300 ${scrolled
                    ? 'bg-white/80 backdrop-blur-xl shadow-lg shadow-black/5'
                    : 'bg-transparent'
                }`}
        >
            <nav className="mx-auto flex items-center justify-between px-6 py-4" aria-label="Workspace Navigation">
                {/* Left: Mobile menu + Navigation items */}
                <div className="flex items-center gap-3">
                    {/* Mobile menu button - only visible on mobile */}
                    <button
                        onClick={onMobileMenuOpen}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <Bars3Icon className="h-6 w-6 text-gray-700" />
                    </button>

                    {/* Navigation items */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm font-semibold leading-6 text-gray-700 hover:text-blue-600 transition-colors relative group px-3 py-2"
                        >
                            Home
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
                        </button>
                        <button
                            onClick={scrollToTop}
                            className="text-sm font-semibold leading-6 px-3 py-2 rounded-lg transition-all relative"
                            style={{
                                color: '#2563eb',
                                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            }}
                        >
                            Workspace
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600"></span>
                        </button>
                    </div>
                </div>

                {/* Right: User profile and actions */}
                <div className="flex items-center gap-4">
                    {accessToken ? (
                        <>
                            {/* User profile */}
                            <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
                                <img
                                    className="h-8 w-8 rounded-lg object-cover ring-2 ring-blue-100 group-hover:ring-blue-300 transition-all"
                                    src={userInfo?.image || "https://via.placeholder.com/32"}
                                    alt="Profile"
                                />
                                <div className="hidden lg:block">
                                    <p className="text-sm font-bold text-gray-900">
                                        {(userInfo?.first_name ?? "") + " " + (userInfo?.last_name ?? "") || "Guest User"}
                                    </p>
                                    <p className="text-xs text-gray-500">Workspace</p>
                                </div>
                            </div>

                            {/* Sign out button */}
                            <button
                                onClick={logout}
                                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Sign Out"
                            >
                                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                                <span className="hidden lg:inline">Sign Out</span>
                            </button>

                            {/* Mobile profile icon */}
                            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                <UserCircleIcon className="h-6 w-6 text-gray-700" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-sm font-semibold leading-6 text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
                            >
                                Log in
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="text-sm font-semibold leading-6 text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all px-5 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform duration-200"
                            >
                                <span className="hidden sm:inline">Get Started</span>
                                <ArrowRightOnRectangleIcon className="h-5 w-5 sm:hidden" />
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default WorkspaceNavbar;
