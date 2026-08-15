import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowLeftOnRectangleIcon,
    Bars3Icon,
    MoonIcon,
    SunIcon,
    UserCircleIcon,
    XMarkIcon,
} from 'icons';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import NotificationBell from './NotificationBell';

const navigation = [
    { name: 'What you get', href: '#features' },
    { name: 'Outcomes', href: '#outcomes' },
    { name: 'Impact', href: '#impact' },
];

const getRoleLabel = (role) => {
    const roleNumber = parseInt(role);
    if (roleNumber >= 5) return 'Admin';
    if (roleNumber >= 4) return 'Lead';
    if (roleNumber >= 3) return 'Volunteer';
    if (roleNumber >= 2) return 'Referrer';
    return null;
};

const Navbar = ({ onMobileMenuOpen, isWorkspace = false }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const { darkMode, toggleDarkMode } = useDarkMode();
    const { isAuthenticated, logout, userRole, isGuest } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isSignedIn = isAuthenticated && !isGuest;
    const roleLabel = getRoleLabel(userRole);
    const solidHeader = scrolled || isWorkspace || mobileMenuOpen;

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        localStorage.setItem('appDarkMode', darkMode);
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    const scrollToSection = (href) => {
        const scroll = () => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(scroll, 120);
        } else {
            scroll();
        }
        setMobileMenuOpen(false);
    };

    const openProfile = () => {
        sessionStorage.setItem('content', 'Profile');
        if (location.pathname === '/workspace') {
            window.dispatchEvent(new CustomEvent('workspaceContentChange', { detail: 'Profile' }));
        } else {
            navigate('/workspace');
        }
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        logout();
        navigate('/');
    };

    return (
        <>
            <header
                className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
                    solidHeader
                        ? 'border-[var(--te-border)] bg-[color:color-mix(in_srgb,var(--te-bg)_88%,transparent)] shadow-[0_1px_0_rgba(18,37,28,0.02)] backdrop-blur-xl'
                        : 'border-transparent bg-transparent'
                }`}
            >
                <nav className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8" aria-label="Global navigation">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <button
                            type="button"
                            className={`${isWorkspace ? 'md:hidden' : 'lg:hidden'} te-icon-btn -ml-2`}
                            onClick={() => (onMobileMenuOpen ? onMobileMenuOpen() : setMobileMenuOpen(true))}
                            aria-label={isWorkspace ? 'Open workspace navigation' : 'Open navigation'}
                        >
                            <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                        </button>

                        <button onClick={() => navigate('/')} className="group flex min-w-0 items-center gap-2.5 rounded-xl">
                            <img src="/te-mark.svg" alt="" className="h-9 w-9 rounded-xl shadow-sm transition-transform group-hover:rotate-[-3deg] group-hover:scale-105" />
                            <span className="te-wordmark truncate text-[16px] text-[var(--te-text)]">TechElevate</span>
                            <span className="hidden rounded-full bg-[var(--te-gold-soft)] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[var(--te-gold)] sm:inline">
                                GH
                            </span>
                        </button>
                    </div>

                    {!isWorkspace ? (
                        <div className="hidden items-center rounded-full border border-[var(--te-border)] bg-[color:color-mix(in_srgb,var(--te-surface)_82%,transparent)] p-1 shadow-sm lg:flex">
                            {navigation.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => scrollToSection(item.href)}
                                    className="rounded-full px-4 py-2 text-xs font-bold text-[var(--te-text-dim)] hover:bg-[var(--te-surface-alt)] hover:text-[var(--te-text)]"
                                >
                                    {item.name}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="hidden items-center gap-2 text-xs font-semibold text-[var(--te-text-dim)] md:flex">
                            <span className="h-2 w-2 rounded-full bg-[var(--te-green)] shadow-[0_0_0_4px_var(--te-green-soft)]" />
                            Career workspace
                        </div>
                    )}

                    <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
                        {isSignedIn && <NotificationBell />}

                        <button
                            onClick={toggleDarkMode}
                            className="te-icon-btn"
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={darkMode ? 'Light mode' : 'Dark mode'}
                        >
                            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                        </button>

                        <div className="hidden items-center gap-1 lg:flex">
                            {!isWorkspace && (
                                <button onClick={() => navigate('/documentation')} className="te-btn-ghost te-btn-sm">
                                    Resources
                                </button>
                            )}

                            {isSignedIn ? (
                                <>
                                    {roleLabel && <span className="te-chip ml-1">{roleLabel}</span>}
                                    {!isWorkspace && (
                                        <button onClick={() => navigate('/workspace')} className="te-btn-secondary te-btn-sm ml-1">
                                            Workspace
                                        </button>
                                    )}
                                    <button onClick={openProfile} className="te-icon-btn" aria-label="Open profile" title="Profile">
                                        <UserCircleIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="te-icon-btn hover:!bg-[var(--te-red-soft)] hover:!text-[var(--te-red)]"
                                        aria-label="Log out"
                                        title="Log out"
                                    >
                                        <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => navigate('/login')} className="te-btn-ghost te-btn-sm">
                                        Sign in
                                    </button>
                                    <button onClick={() => navigate('/register')} className="te-btn-primary te-btn-sm px-4">
                                        Join free
                                    </button>
                                </>
                            )}
                        </div>

                        {roleLabel && isWorkspace && (
                            <span className="te-chip ml-1 hidden sm:inline-flex lg:hidden">{roleLabel}</span>
                        )}
                    </div>
                </nav>
            </header>

            {!isWorkspace && mobileMenuOpen && (
                <div className="lg:hidden">
                    <button
                        type="button"
                        className="fixed inset-0 z-[60] cursor-default bg-[var(--te-ink)]/55 backdrop-blur-sm"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close navigation"
                    />
                    <aside className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-sm flex-col border-l border-[var(--te-border)] bg-[var(--te-surface)] p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <img src="/te-mark.svg" alt="" className="h-9 w-9 rounded-xl" />
                                <span className="te-wordmark text-base">TechElevate</span>
                            </div>
                            <button type="button" className="te-icon-btn" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-10">
                            <span className="te-eyebrow">Explore</span>
                            <nav className="mt-5 space-y-1">
                                {navigation.map((item) => (
                                    <button
                                        key={item.name}
                                        onClick={() => scrollToSection(item.href)}
                                        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-bold text-[var(--te-text)] hover:bg-[var(--te-surface-alt)]"
                                    >
                                        {item.name}
                                        <span className="text-[var(--te-text-dim)]">↗</span>
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        navigate('/documentation');
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base font-bold text-[var(--te-text)] hover:bg-[var(--te-surface-alt)]"
                                >
                                    Resources
                                    <span className="text-[var(--te-text-dim)]">↗</span>
                                </button>
                            </nav>
                        </div>

                        <div className="mt-auto space-y-3 border-t border-[var(--te-border)] pt-6">
                            {isSignedIn ? (
                                <>
                                    <button onClick={() => navigate('/workspace')} className="te-btn-primary w-full">Open workspace</button>
                                    <button onClick={openProfile} className="te-btn-secondary w-full">View profile</button>
                                    <button onClick={() => setShowLogoutConfirm(true)} className="te-btn-ghost w-full text-[var(--te-red)]">Log out</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => navigate('/register')} className="te-btn-primary w-full">Create your account</button>
                                    <button onClick={() => navigate('/login')} className="te-btn-secondary w-full">Sign in</button>
                                </>
                            )}
                        </div>
                    </aside>
                </div>
            )}

            {isSignedIn && showLogoutConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 cursor-default bg-[var(--te-ink)]/60 backdrop-blur-sm"
                        onClick={() => setShowLogoutConfirm(false)}
                        aria-label="Cancel logout"
                    />
                    <div role="dialog" aria-modal="true" aria-labelledby="logout-title" className="te-card relative w-full max-w-md p-6 shadow-[var(--te-shadow-lg)] sm:p-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--te-red-soft)] text-[var(--te-red)]">
                            <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                        </div>
                        <h3 id="logout-title" className="mt-5 text-xl font-bold">Log out of TechElevate?</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--te-text-dim)]">
                            Your progress is saved. You can sign back in whenever you are ready.
                        </p>
                        <div className="mt-7 flex gap-3">
                            <button onClick={() => setShowLogoutConfirm(false)} className="te-btn-secondary flex-1">Stay signed in</button>
                            <button onClick={confirmLogout} className="te-btn-danger flex-1">Log out</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
