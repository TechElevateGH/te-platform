import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { Bars3Icon, XMarkIcon, ArrowLeftOnRectangleIcon, UserCircleIcon, SunIcon, MoonIcon } from 'icons';
import NotificationBell from './NotificationBell';

const navigation = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'Impact', href: '#impact' },
];

const Navbar = ({ onMobileMenuOpen, isWorkspace = false }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const { darkMode, toggleDarkMode } = useDarkMode();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout, userRole, isGuest } = useAuth();
    const isSignedIn = isAuthenticated && !isGuest;

    // Define role labels — neutral monochrome chips (black & white theme)
    const getRoleInfo = (role) => {
        const roleNum = parseInt(role);
        if (roleNum >= 5) return { label: 'Admin' };
        if (roleNum >= 4) return { label: 'Lead' };
        if (roleNum >= 3) return { label: 'Volunteer' };
        if (roleNum >= 2) return { label: 'Referrer' };
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
            // For workspace, use the callback
            onMobileMenuOpen();
        } else {
            // For home page, toggle local state
            setMobileMenuOpen(!mobileMenuOpen);
        }
    };

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || isWorkspace
                    ? 'bg-[var(--te-bg)] border-b border-[var(--te-border)]'
                    : 'bg-transparent'
                    }`}
            >
                <nav className="mx-auto flex h-16 items-center justify-between px-6 lg:px-8" aria-label="Global">
                    {/* Left section: Mobile menu + Logo */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className={`${isWorkspace ? 'md:hidden' : 'lg:hidden'} -m-2.5 inline-flex items-center justify-center rounded-lg p-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
                            onClick={handleMobileMenuToggle}
                        >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>

                        {/* Logo */}
                        <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2.5">
                            <img
                                src="/te-mark.svg"
                                alt="TechElevate"
                                className="h-9 w-9 rounded-[10px]"
                            />
                            <span className="te-wordmark text-[15px] text-[var(--te-text)]">
                                techelevate
                            </span>
                        </a>
                    </div>

                    {/* Center section: Navigation Links */}
                    <div className="hidden lg:flex lg:flex-1 lg:justify-center lg:gap-x-8">
                        {navigation.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => scrollToSection(item.href)}
                                className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative group"
                            >
                                {item.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-500 group-hover:w-full transition-all duration-300"></span>
                            </button>
                        ))}
                    </div>

                    {/* Right section: Mobile workspace controls + Desktop Auth Buttons */}
                    <div className="flex items-center gap-x-2 lg:gap-x-3 flex-shrink-0">
                        {/* Mobile-only controls for workspace */}
                        {isWorkspace && (
                            <>
                                {/* Role Badge - Mobile */}
                                {roleInfo && (
                                    <div className="lg:hidden te-chip">
                                        <span className="text-xs font-semibold text-[var(--te-text)]">
                                            {roleInfo.label}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Dark Mode Toggle - Mobile (for all pages) */}
                        <button
                            onClick={toggleDarkMode}
                            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title={darkMode ? 'Light Mode' : 'Dark Mode'}
                        >
                            {darkMode ? (
                                <SunIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                            ) : (
                                <MoonIcon className="h-5 w-5 text-slate-600" />
                            )}
                        </button>

                        {/* Desktop controls */}
                        <div className="hidden lg:flex lg:items-center lg:gap-x-3">
                            {/* Notification Bell - Show only when fully signed in */}
                            {isSignedIn && <NotificationBell />}

                            <button
                                onClick={() => navigate('/documentation')}
                                className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors px-4 py-2"
                            >
                                Docs
                            </button>

                            {/* Role Badge - Show for privileged users */}
                            {isSignedIn && roleInfo && (
                                <div className="te-chip">
                                    <span className="text-xs font-semibold text-[var(--te-text)]">
                                        {roleInfo.label}
                                    </span>
                                </div>
                            )}

                            {/* Dark Mode Toggle */}
                            <button
                                onClick={toggleDarkMode}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                                title={darkMode ? 'Light Mode' : 'Dark Mode'}
                            >
                                {darkMode ? (
                                    <SunIcon className="h-5 w-5 text-slate-600 dark:text-slate-300 group-hover:text-amber-500 transition-colors" />
                                ) : (
                                    <MoonIcon className="h-5 w-5 text-slate-600 group-hover:text-brand-600 transition-colors" />
                                )}
                            </button>

                            {isSignedIn ? (
                                <>
                                    <button
                                        onClick={() => navigate('/workspace')}
                                        className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors px-4 py-2"
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
                                        className="p-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-all group"
                                        title="Profile"
                                    >
                                        <UserCircleIcon className="h-6 w-6 text-slate-600 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors" />
                                    </button>

                                    {/* Sign out icon */}
                                    <button
                                        onClick={handleLogoutClick}
                                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
                                        title="Sign Out"
                                    >
                                        <ArrowLeftOnRectangleIcon className="h-6 w-6 text-slate-600 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors px-4 py-2"
                                    >
                                        Log in
                                    </button>
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="te-btn-primary te-btn-sm rounded-full px-5"
                                    >
                                        Get Started
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </nav>
                {(scrolled || isWorkspace) && (
                    <div className="te-stripe absolute bottom-0 left-0 right-0 h-[3px]" />
                )}
            </header>

            {/* Mobile menu - only for home page - Outside header for proper layering */}
            {!isWorkspace && mobileMenuOpen && (
                <div className="lg:hidden">
                    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed inset-y-0 right-0 z-[70] w-full overflow-y-auto bg-[var(--te-bg)] px-6 py-6 sm:max-w-sm border-l border-[var(--te-border)]">
                        <div className="flex items-center justify-between">
                            <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2.5">
                                <img
                                    src="/te-mark.svg"
                                    alt="TechElevate"
                                    className="h-9 w-9 rounded-[10px]"
                                />
                                <span className="te-wordmark text-[15px] text-[var(--te-text)]">
                                    techelevate
                                </span>
                            </a>
                            <button
                                type="button"
                                className="-m-2.5 rounded-lg p-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-slate-500/10">
                                <div className="space-y-2 py-6">
                                    {navigation.map((item) => (
                                        <button
                                            key={item.name}
                                            onClick={() => scrollToSection(item.href)}
                                            className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            {item.name}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => {
                                            navigate('/documentation');
                                            setMobileMenuOpen(false);
                                        }}
                                        className="-mx-3 block w-full text-left rounded-lg px-3 py-2 text-base font-semibold leading-7 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        Docs
                                    </button>
                                </div>
                                <div className="py-6 space-y-2">
                                    {/* Role Badge - Mobile */}
                                    {isSignedIn && roleInfo && (
                                        <div className="-mx-3 px-3 py-2.5">
                                            <div className="te-chip">
                                                <span className="text-sm font-semibold text-[var(--te-text)]">
                                                    {roleInfo.label}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {isSignedIn ? (
                                        <>
                                            <button
                                                onClick={() => {
                                                    navigate('/workspace');
                                                    setMobileMenuOpen(false);
                                                }}
                                                className="-mx-3 block w-full text-left rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                Workspace
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/workspace#profile');
                                                    setMobileMenuOpen(false);
                                                }}
                                                className="-mx-3 flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                <UserCircleIcon className="h-6 w-6" />
                                                Profile
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleLogoutClick();
                                                    setMobileMenuOpen(false);
                                                }}
                                                className="-mx-3 block w-full text-left rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                Logout
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => {
                                                    navigate('/login');
                                                    setMobileMenuOpen(false);
                                                }}
                                                className="-mx-3 block w-full text-left rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            >
                                                Log in
                                            </button>
                                            <button
                                                onClick={() => {
                                                    navigate('/register');
                                                    setMobileMenuOpen(false);
                                                }}
                                                className="te-btn-primary te-btn-sm w-full justify-center rounded-full"
                                            >
                                                Get Started
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Modal - Outside header for proper centering */}
            {isSignedIn && showLogoutConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={cancelLogout}>
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <ArrowLeftOnRectangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    Confirm Logout
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                                    Are you sure you want to log out? You'll need to sign in again to access your account.
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={confirmLogout}
                                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={cancelLogout}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-semibold rounded-lg transition-colors"
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
