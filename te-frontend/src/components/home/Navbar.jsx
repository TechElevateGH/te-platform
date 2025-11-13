import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { Bars3Icon, XMarkIcon, ArrowLeftOnRectangleIcon, UserCircleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { RocketLaunchIcon } from '@heroicons/react/24/solid';
import NotificationBell from './NotificationBell';

const navigation = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'Team', href: '#team' },
    { name: 'Impact', href: '#impact' },
    { name: 'Testimonials', href: '#testimonials' },
];

const Navbar = ({ onMobileMenuOpen, isWorkspace = false }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const { darkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout, userRole } = useAuth();

    // Define role labels and styling
    const getRoleInfo = (role) => {
        const roleNum = parseInt(role);
        if (roleNum >= 5) return { label: 'Admin', color: 'from-purple-600 to-pink-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' };
        if (roleNum >= 4) return { label: 'Mentor', color: 'from-blue-600 to-cyan-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
        if (roleNum >= 3) return { label: 'Lead', color: 'from-emerald-600 to-teal-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' };
        if (roleNum >= 2) return { label: 'Referrer', color: 'from-orange-600 to-amber-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' };
        return null;
    };

    const roleInfo = userRole ? getRoleInfo(userRole) : null;

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        logout();
        navigate('/');
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        localStorage.setItem('appDarkMode', darkMode);
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const scrollToSection = (href) => {
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                const element = document.querySelector(href);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        setMobileMenuOpen(false);
    };

    const handleMobileMenuToggle = () => {
        if (onMobileMenuOpen) {
            onMobileMenuOpen();
        } else {
            setMobileMenuOpen(true);
        }
    };

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || isWorkspace
                    ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-sm dark:border-b dark:border-slate-700/50'
                    : 'bg-transparent'
                    }`}
            >
                <nav className="mx-auto flex items-center justify-between px-6 py-4 lg:px-8" aria-label="Global">
                    {/* Left section: Mobile menu + Logo */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className={`${isWorkspace ? 'md:hidden' : 'lg:hidden'} -m-2.5 inline-flex items-center justify-center rounded-lg p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                            onClick={handleMobileMenuToggle}
                        >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>

                        {/* Logo */}
                        <a href="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <RocketLaunchIcon className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
                                TechElevate
                            </span>
                        </a>
                    </div>

                    {/* Center section: Navigation Links */}
                    <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:gap-x-8">
                        {navigation.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => scrollToSection(item.href)}
                                className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative group"
                            >
                                {item.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
                            </button>
                        ))}
                    </div>

                    {/* Right section: Auth Buttons */}
                    <div className="hidden lg:flex lg:items-center lg:gap-x-3 flex-shrink-0">
                        {/* Notification Bell - Show only when authenticated */}
                        {isAuthenticated && <NotificationBell />}

                        <button
                            onClick={() => navigate('/documentation')}
                            className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 py-2"
                        >
                            Docs
                        </button>

                        {/* Role Badge - Show for privileged users */}
                        {isAuthenticated && roleInfo && (
                            <div className={`${roleInfo.bgColor} px-3 py-1.5 rounded-full border border-current/20`}>
                                <span className={`text-xs font-bold bg-gradient-to-r ${roleInfo.color} bg-clip-text text-transparent`}>
                                    {roleInfo.label}
                                </span>
                            </div>
                        )}

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? (
                                <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-amber-500 transition-colors" />
                            ) : (
                                <MoonIcon className="h-5 w-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                            )}
                        </button>

                        {!isAuthenticated ? (
                            <>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 py-2"
                                >
                                    Log in
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="text-sm font-semibold leading-6 text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all px-5 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transform duration-200"
                                >
                                    Get Started
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/workspace')}
                                    className="text-sm font-semibold leading-6 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-4 py-2"
                                >
                                    Workspace
                                </button>

                                {/* Profile icon */}
                                <button
                                    onClick={() => {
                                        sessionStorage.setItem('content', 'Profile');
                                        if (location.pathname === '/workspace') {
                                            // If already on workspace, dispatch a custom event to trigger content change
                                            window.dispatchEvent(new CustomEvent('workspaceContentChange', { detail: 'Profile' }));
                                        } else {
                                            navigate('/workspace');
                                        }
                                    }}
                                    className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                                    title="Profile"
                                >
                                    <UserCircleIcon className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                </button>

                                {/* Sign out icon */}
                                <button
                                    onClick={handleLogoutClick}
                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                                    title="Sign Out"
                                >
                                    <ArrowLeftOnRectangleIcon className="h-6 w-6 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                                </button>
                            </>
                        )}
                    </div>
                </nav>

                {/* Mobile menu - only for home page */}
                {!isWorkspace && (
                    <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
                        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                        <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white dark:bg-slate-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 dark:sm:ring-slate-700/50">
                            <div className="flex items-center justify-between">
                                <a href="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
                                    <img
                                        src="/logo.png"
                                        alt="TechElevate"
                                        className="h-10 w-10 rounded-xl shadow-lg"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-blue-500 hidden items-center justify-center shadow-lg">
                                        <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18.5c-3.86-.96-6.5-4.58-6.5-8.5V8.42l6.5-3.25 6.5 3.25V12c0 3.92-2.64 7.54-6.5 8.5z" />
                                            <path d="M10.5 14.5l-2-2-1.5 1.5 3.5 3.5 6-6-1.5-1.5z" />
                                        </svg>
                                    </div>
                                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                        TechElevate
                                    </span>
                                </a>
                                <button
                                    type="button"
                                    className="-m-2.5 rounded-lg p-2.5 text-gray-700 hover:bg-gray-100"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <span className="sr-only">Close menu</span>
                                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="mt-6 flow-root">
                                <div className="-my-6 divide-y divide-gray-500/10">
                                    <div className="space-y-2 py-6">
                                        {navigation.map((item) => (
                                            <button
                                                key={item.name}
                                                onClick={() => scrollToSection(item.href)}
                                                className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                                            >
                                                {item.name}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => {
                                                navigate('/documentation');
                                                setMobileMenuOpen(false);
                                            }}
                                            className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 text-blue-600 hover:bg-blue-50"
                                        >
                                            Docs
                                        </button>
                                    </div>
                                    <div className="py-6 space-y-2">
                                        {/* Dark Mode Toggle - Mobile */}
                                        <button
                                            onClick={toggleDarkMode}
                                            className="-mx-3 flex items-center justify-between w-full rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                                            {darkMode ? (
                                                <SunIcon className="h-5 w-5 text-amber-500" />
                                            ) : (
                                                <MoonIcon className="h-5 w-5 text-indigo-600" />
                                            )}
                                        </button>

                                        {/* Role Badge - Mobile */}
                                        {isAuthenticated && roleInfo && (
                                            <div className="-mx-3 px-3 py-2.5">
                                                <div className={`inline-flex ${roleInfo.bgColor} px-4 py-2 rounded-full border border-current/20`}>
                                                    <span className={`text-sm font-bold bg-gradient-to-r ${roleInfo.color} bg-clip-text text-transparent`}>
                                                        {roleInfo.label}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        {!isAuthenticated ? (
                                            <>
                                                <button
                                                    onClick={() => navigate('/login')}
                                                    className="-mx-3 block w-full text-left rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                                                >
                                                    Log in
                                                </button>
                                                <button
                                                    onClick={() => navigate('/register')}
                                                    className="w-full text-center text-sm font-semibold leading-6 text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all px-5 py-3 rounded-full shadow-lg"
                                                >
                                                    Get Started
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => navigate('/workspace')}
                                                    className="-mx-3 block w-full text-left rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                                                >
                                                    Workspace
                                                </button>
                                                <button
                                                    onClick={handleLogoutClick}
                                                    className="-mx-3 block w-full text-left rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-red-600 hover:bg-red-50"
                                                >
                                                    Logout
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Logout Confirmation Modal - Outside header for proper centering */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={cancelLogout}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <ArrowLeftOnRectangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    Confirm Logout
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                                    Are you sure you want to log out? You'll need to sign in again to access your account.
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={confirmLogout}
                                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        Yes, Logout
                                    </button>
                                    <button
                                        onClick={cancelLogout}
                                        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
