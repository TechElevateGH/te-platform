import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Bars3Icon, XMarkIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import { RocketLaunchIcon } from '@heroicons/react/24/solid';

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
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, userRole, logout } = useAuth();
    const { userInfo } = useData();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-white/90 backdrop-blur-xl shadow-sm'
                : 'bg-transparent'
                }`}
        >
            <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
                <div className="flex items-center gap-4">
                    {/* Mobile menu button - only show on mobile for workspace */}
                    {isWorkspace && (
                        <button
                            type="button"
                            className="md:hidden -m-2.5 inline-flex items-center justify-center rounded-lg p-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={handleMobileMenuToggle}
                        >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    )}
                    {!isWorkspace && (
                        <button
                            type="button"
                            className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-lg p-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={handleMobileMenuToggle}
                        >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    )}

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

                {/* Desktop Navigation */}
                <div className="hidden lg:flex lg:gap-x-8">
                    {!isWorkspace && navigation.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => scrollToSection(item.href)}
                            className="text-sm font-semibold leading-6 text-gray-700 hover:text-blue-600 transition-colors relative group"
                        >
                            {item.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
                        </button>
                    ))}
                </div>

                {/* Desktop Auth Buttons */}
                <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3">
                    {!isAuthenticated ? (
                        <>
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
                                Get Started
                            </button>
                        </>
                    ) : (
                        <>
                            {!isWorkspace && (
                                <button
                                    onClick={() => navigate('/workspace')}
                                    className="text-sm font-semibold leading-6 text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
                                >
                                    Workspace
                                </button>
                            )}

                            {isWorkspace && userInfo && (
                                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
                                    <img
                                        className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-md"
                                        src={userInfo?.image || "https://via.placeholder.com/36"}
                                        alt="Profile"
                                    />
                                    <div className="pr-2">
                                        <p className="text-sm font-bold text-gray-900">
                                            {`${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`.trim() || "Guest User"}
                                        </p>
                                        <p className="text-xs text-blue-600 font-medium">{userRole}</p>
                                    </div>
                                </div>
                            )}

                            {!isWorkspace && (
                                <span className="text-sm font-medium px-4 py-2 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                    {userRole}
                                </span>
                            )}

                            <button
                                onClick={logout}
                                className="flex items-center gap-2 text-sm font-semibold leading-6 text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all px-4 py-2 rounded-lg"
                                title="Sign Out"
                            >
                                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                                <span className="hidden xl:inline">Sign Out</span>
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Mobile menu - only for home page */}
            {!isWorkspace && (
                <div className={`lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
                    <div className="fixed inset-0 z-50" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
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
                                </div>
                                <div className="py-6 space-y-2">
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
                                                onClick={logout}
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
    );
};

export default Navbar;
