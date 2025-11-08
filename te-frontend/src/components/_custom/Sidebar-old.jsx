import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useNavigate } from 'react-router-dom'
import {
    XMarkIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline'
import {
    RocketLaunchIcon
} from '@heroicons/react/24/solid'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

const Sidebar = ({ navigation, content, setContent, setLogin }) => {
    const { accessToken, logout } = useAuth();
    const { userInfo } = useData();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <>
            <div className="">
                {/* Mobile sidebar */}
                <Transition.Root show={sidebarOpen} as={Fragment}>
                    <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
                        <Transition.Child
                            as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" />
                        </Transition.Child>

                        <div className="fixed inset-0 flex">
                            <Transition.Child
                                as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="-translate-x-full"
                                enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0"
                                leaveTo="-translate-x-full"
                            >
                                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                                    <Transition.Child
                                        as={Fragment}
                                        enter="ease-in-out duration-300"
                                        enterFrom="opacity-0"
                                        enterTo="opacity-100"
                                        leave="ease-in-out duration-300"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                    >
                                        <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                                            <button type="button" className="-m-2.5 p-2.5 hover:bg-white/10 rounded-lg transition-all" onClick={() => setSidebarOpen(false)}>
                                                <span className="sr-only">Close sidebar</span>
                                                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </Transition.Child>

                                    {/* Mobile Sidebar Content */}
                                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                                        <div className="flex h-20 shrink-0 items-center mt-2 border-b border-gray-100 pb-4">
                                            <button
                                                onClick={() => navigate('/')}
                                                className="flex items-center gap-3 group"
                                            >
                                                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                                                    <RocketLaunchIcon className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <h1 className="text-lg font-bold text-gray-900">TechElevate</h1>
                                                    <p className="text-xs text-gray-500 font-medium">Career Platform</p>
                                                </div>
                                            </button>
                                        </div>

                                        <nav className="flex flex-1 flex-col mt-2">
                                            <ul className="flex flex-1 flex-col gap-y-6">
                                                <li>
                                                    <ul className="space-y-1">
                                                        {navigation.map((item) => (
                                                            <li key={item.name}>
                                                                <button
                                                                    onClick={() => { setContent(item.name); setSidebarOpen(false) }}
                                                                    className={classNames(
                                                                        item.name === content
                                                                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                                                                            : 'text-gray-700 hover:bg-gray-50',
                                                                        'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all'
                                                                    )}
                                                                >
                                                                    <item.icon
                                                                        className={classNames(
                                                                            item.name === content ? 'text-blue-600' : 'text-gray-400',
                                                                            'h-5 w-5 transition-colors'
                                                                        )}
                                                                        aria-hidden="true"
                                                                    />
                                                                    <span className="flex-1 text-left">{item.name}</span>
                                                                    {item.name === content && (
                                                                        <ChevronRightIcon className="h-4 w-4 text-blue-600" />
                                                                    )}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>

                                                <li className="mt-auto pt-4 border-t border-gray-100">
                                                    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                                                        <button
                                                            onClick={() => { setContent("Profile"); setSidebarOpen(false) }}
                                                            className="flex w-full items-center gap-x-3 text-sm font-semibold text-gray-700 hover:bg-white rounded-lg p-2 transition-all mb-2.5"
                                                        >
                                                            <div className="relative">
                                                                <img
                                                                    className="h-9 w-9 rounded-lg object-cover border border-gray-200"
                                                                    src={userInfo?.image || "https://via.placeholder.com/36"}
                                                                    alt="Profile"
                                                                />
                                                                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                                                            </div>
                                                            <div className="flex-1 text-left min-w-0">
                                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                                    {(userInfo?.first_name ?? "") + " " + (userInfo?.last_name ?? "") || "Guest User"}
                                                                </p>
                                                                <p className="text-xs text-gray-500">View profile</p>
                                                            </div>
                                                            <UserCircleIcon className="h-5 w-5 text-gray-400 shrink-0" />
                                                        </button>

                                                        {!accessToken ? (
                                                            <a
                                                                href='/login'
                                                                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm text-sm"
                                                            >
                                                                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                                                <span>Sign In</span>
                                                            </a>
                                                        ) : (
                                                            <button
                                                                onClick={logout}
                                                                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all border border-gray-200 text-sm"
                                                            >
                                                                <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                                                                <span>Sign Out</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            </ul>
                                        </nav>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                {/* Desktop sidebar */}
                <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-80 md:flex-col">
                    <div className="flex grow flex-col gap-y-6 overflow-y-auto bg-white border-r border-gray-200 px-6 py-6">
                        <div>
                            {/* Logo and Brand */}
                            <div className="flex h-16 shrink-0 items-center border-b border-gray-100 pb-6">
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex items-center gap-3 group"
                                >
                                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                                        <RocketLaunchIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">TechElevate</h1>
                                        <p className="text-xs text-gray-500 font-medium">Career Platform</p>
                                    </div>
                                </button>
                            </div>

                            <nav className="flex flex-1 flex-col mt-4">
                                <ul className="flex flex-1 flex-col gap-y-6">
                                    <li>
                                        <div className="text-xs font-semibold text-gray-400 mb-3 tracking-wider uppercase px-1">
                                            Workspace
                                        </div>
                                        <ul className="space-y-1">
                                            {navigation.filter((item) => item.type === "app").map((item) => (
                                                <li key={item.name}>
                                                    <button
                                                        onClick={() => setContent(item.name)}
                                                        className={classNames(
                                                            item.name === content
                                                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                                                            'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200'
                                                        )}
                                                    >
                                                        <item.icon
                                                            className={classNames(
                                                                item.name === content ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600',
                                                                'h-5 w-5 shrink-0 transition-colors'
                                                            )}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="flex-1 text-left">{item.name}</span>
                                                        {item.name === content && (
                                                            <ChevronRightIcon className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>

                                    <li>
                                        <div className="text-xs font-semibold text-gray-400 mb-3 tracking-wider uppercase px-1">
                                            Learning
                                        </div>
                                        <ul className="space-y-1">
                                            {navigation.filter((item) => item.type === "learn").map((item) => (
                                                <li key={item.name}>
                                                    <button
                                                        onClick={() => setContent(item.name)}
                                                        className={classNames(
                                                            item.name === content
                                                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                                                            'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200'
                                                        )}
                                                    >
                                                        <item.icon
                                                            className={classNames(
                                                                item.name === content ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600',
                                                                'h-5 w-5 shrink-0 transition-colors'
                                                            )}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="flex-1 text-left">{item.name}</span>
                                                        {item.name === content && (
                                                            <ChevronRightIcon className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>

                                    <li>
                                        <div className="text-xs font-semibold text-gray-400 mb-3 tracking-wider uppercase px-1">
                                            Resources
                                        </div>
                                        <ul className="space-y-1">
                                            {navigation.filter((item) => item.type === "other").map((item) => (
                                                <li key={item.name}>
                                                    <button
                                                        onClick={() => setContent(item.name)}
                                                        className={classNames(
                                                            item.name === content
                                                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                                                            'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200'
                                                        )}
                                                    >
                                                        <item.icon
                                                            className={classNames(
                                                                item.name === content ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600',
                                                                'h-5 w-5 shrink-0 transition-colors'
                                                            )}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="flex-1 text-left">{item.name}</span>
                                                        {item.name === content && (
                                                            <ChevronRightIcon className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>

                                    <li className="mt-auto pt-4 border-t border-gray-100">
                                        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                                            {/* User Profile */}
                                            <button
                                                onClick={() => setContent("Profile")}
                                                className="flex w-full items-center gap-x-3 text-sm font-semibold text-gray-700 hover:bg-white rounded-lg p-2 transition-all mb-2.5"
                                            >
                                                <div className="relative">
                                                    <img
                                                        className="h-9 w-9 rounded-lg object-cover border border-gray-200"
                                                        src={userInfo?.image || "https://via.placeholder.com/36"}
                                                        alt="Profile"
                                                    />
                                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                                                </div>
                                                <div className="flex-1 text-left min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 truncate">
                                                        {(userInfo?.first_name ?? "") + " " + (userInfo?.last_name ?? "") || "Guest User"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">View profile</p>
                                                </div>
                                                <UserCircleIcon className="h-5 w-5 text-gray-400 shrink-0" />
                                            </button>

                                            {/* Auth Button */}
                                            {!accessToken ? (
                                                <a
                                                    href='/login'
                                                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md text-sm"
                                                >
                                                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                                    <span>Sign In</span>
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={logout}
                                                    className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all border border-gray-200 text-sm"
                                                >
                                                    <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                                                    <span>Sign Out</span>
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                                        </div>
                                        </div>
                    </div>
                </div>

                {/* Mobile header - Now hidden since WorkspaceNavbar handles it */}
                <div className="hidden">
                    {/* Placeholder - mobile navigation now handled by WorkspaceNavbar */}
                </div>
            </div>
        </>
    )
}

export default Sidebar;
                                    </li>

                                    <li>
                                        <div className="text-xs font-semibold leading-6 text-gray-500 mb-3 tracking-wide uppercase">
                                            Learning
                                        </div>
                                        <ul className="space-y-2">
                                            {navigation.filter((item) => item.type === "learn").map((item, index) => {
                                                const colors = [
                                                    { bg: 'bg-orange-500/10', hoverBg: 'hover:bg-orange-500/20', text: 'text-orange-700', icon: 'text-orange-600', activeBg: 'bg-gradient-to-r from-orange-500 to-amber-500', ring: 'ring-orange-500/20' },
                                                    { bg: 'bg-rose-500/10', hoverBg: 'hover:bg-rose-500/20', text: 'text-rose-700', icon: 'text-rose-600', activeBg: 'bg-gradient-to-r from-rose-500 to-pink-500', ring: 'ring-rose-500/20' },
                                                ];
                                                const color = colors[index % colors.length];
                                                return (
                                                    <li key={item.name}>
                                                        <button
                                                            onClick={() => setContent(item.name)}
                                                            className={classNames(
                                                                item.name === content
                                                                    ? `${color.activeBg} text-white shadow-lg shadow-${color.icon}/30 scale-[1.02] ring-2 ${color.ring}`
                                                                    : `${color.bg} ${color.text} ${color.hoverBg} hover:scale-[1.01]`,
                                                                'group flex w-full items-center gap-x-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-300 backdrop-blur-sm'
                                                            )}
                                                        >
                                                            <div className={classNames(
                                                                item.name === content ? 'bg-white/20 shadow-lg' : 'bg-white/50',
                                                                'p-2 rounded-lg transition-all duration-300'
                                                            )}>
                                                                <item.icon
                                                                    className={classNames(
                                                                        item.name === content ? 'text-white' : color.icon,
                                                                        'h-5 w-5 transition-colors'
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                            </div>
                                                            <span className="flex-1 text-left">{item.name}</span>
                                                            {item.name === content && (
                                                                <ChevronRightIcon className="h-4 w-4 text-white/90" />
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </li>

                                    <li>
                                        <div className="text-xs font-semibold leading-6 text-gray-500 mb-3 tracking-wide uppercase">
                                            Resources
                                        </div>
                                        <ul className="space-y-2">
                                            {navigation.filter((item) => item.type === "other").map((item, index) => {
                                                const colors = [
                                                    { bg: 'bg-indigo-500/10', hoverBg: 'hover:bg-indigo-500/20', text: 'text-indigo-700', icon: 'text-indigo-600', activeBg: 'bg-gradient-to-r from-indigo-500 to-purple-500', ring: 'ring-indigo-500/20' },
                                                    { bg: 'bg-teal-500/10', hoverBg: 'hover:bg-teal-500/20', text: 'text-teal-700', icon: 'text-teal-600', activeBg: 'bg-gradient-to-r from-teal-500 to-cyan-500', ring: 'ring-teal-500/20' },
                                                ];
                                                const color = colors[index % colors.length];
                                                return (
                                                    <li key={item.name}>
                                                        <button
                                                            onClick={() => setContent(item.name)}
                                                            className={classNames(
                                                                item.name === content
                                                                    ? `${color.activeBg} text-white shadow-lg shadow-${color.icon}/30 scale-[1.02] ring-2 ${color.ring}`
                                                                    : `${color.bg} ${color.text} ${color.hoverBg} hover:scale-[1.01]`,
                                                                'group flex w-full items-center gap-x-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-300 backdrop-blur-sm'
                                                            )}
                                                        >
                                                            <div className={classNames(
                                                                item.name === content ? 'bg-white/20 shadow-lg' : 'bg-white/50',
                                                                'p-2 rounded-lg transition-all duration-300'
                                                            )}>
                                                                <item.icon
                                                                    className={classNames(
                                                                        item.name === content ? 'text-white' : color.icon,
                                                                        'h-5 w-5 transition-colors'
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                            </div>
                                                            <span className="flex-1 text-left">{item.name}</span>
                                                            {item.name === content && (
                                                                <ChevronRightIcon className="h-4 w-4 text-white/90" />
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </li>

                                    <li className="mt-auto">
                                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-white/80 shadow-xl shadow-blue-500/10">
                                            {/* User Profile */}
                                            <button
                                                onClick={() => setContent("Profile")}
                                                className="flex w-full items-center gap-x-3 text-sm font-semibold leading-6 text-gray-700 hover:bg-white/80 rounded-xl p-2.5 transition-all mb-3"
                                            >
                                                <div className="relative">
                                                    <img
                                                        className="h-10 w-10 rounded-lg object-cover ring-2 ring-white shadow-md"
                                                        src={userInfo?.image || "https://via.placeholder.com/40"}
                                                        alt="Profile"
                                                    />
                                                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white shadow-lg"></div>
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm font-bold text-gray-900 truncate">
                                                        {(userInfo?.first_name ?? "") + " " + (userInfo?.last_name ?? "") || "Guest User"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">View profile</p>
                                                </div>
                                                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                                            </button>

                                            {/* Auth Button */}
                                            {!accessToken ? (
                                                <a
                                                    href='/login'
                                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all shadow-md hover:scale-[1.02]"
                                                >
                                                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                                    <span>Sign In</span>
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={logout}
                                                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white/80 text-gray-700 rounded-xl font-semibold hover:bg-white transition-all border border-gray-200 shadow-sm"
                                                >
                                                    <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                                                    <span>Sign Out</span>
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Mobile header - Now hidden since WorkspaceNavbar handles it */}
                <div className="hidden">
                    {/* Placeholder - mobile navigation now handled by WorkspaceNavbar */}
                </div>
            </div>
        </>
    )
}

export default Sidebar;