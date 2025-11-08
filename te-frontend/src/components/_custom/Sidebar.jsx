import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    Bars3Icon,
    XMarkIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    ArrowLeftOnRectangleIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline'
import {
    SparklesIcon,
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
                                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-br from-blue-600 to-blue-800 px-6 pb-4 relative">
                                        {/* Glassmorphism overlay */}
                                        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>

                                        <div className="relative z-10">
                                            <div className="flex h-20 shrink-0 items-center mt-2">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/20">
                                                        <RocketLaunchIcon className="h-7 w-7 text-white" />
                                                    </div>
                                                    <div>
                                                        <h1 className="text-white font-bold text-xl tracking-tight">TechElevate</h1>
                                                        <p className="text-blue-100 text-xs font-medium">Your Career Hub</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <nav className="flex flex-1 flex-col mt-6">
                                                <ul className="flex flex-1 flex-col gap-y-7">
                                                    <li>
                                                        <ul className="-mx-2 space-y-2">
                                                            {navigation.map((item) => (
                                                                <li key={item.name}>
                                                                    <button
                                                                        onClick={() => { setContent(item.name); setSidebarOpen(false) }}
                                                                        className={classNames(
                                                                            item.name === content
                                                                                ? 'bg-white/25 text-white backdrop-blur-xl shadow-xl border border-white/30'
                                                                                : 'text-blue-50 hover:bg-white/15 hover:text-white border border-transparent hover:border-white/20',
                                                                            'group flex w-full items-center gap-x-3 rounded-2xl p-3.5 text-sm font-semibold leading-6 transition-all duration-300'
                                                                        )}
                                                                    >
                                                                        <div className={classNames(
                                                                            item.name === content
                                                                                ? 'bg-white/20 shadow-lg'
                                                                                : 'bg-white/10 group-hover:bg-white/15',
                                                                            'p-2 rounded-xl transition-all duration-300'
                                                                        )}>
                                                                            <item.icon
                                                                                className="h-5 w-5 text-white"
                                                                                aria-hidden="true"
                                                                            />
                                                                        </div>
                                                                        <span className="flex-1 text-left">{item.name}</span>
                                                                        {item.name === content && (
                                                                            <ChevronRightIcon className="h-4 w-4 text-white/70" />
                                                                        )}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </li>

                                                    <li className="mt-auto">
                                                        {/* User Profile - Mobile */}
                                                        <div className="bg-white/15 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-xl">
                                                            <button
                                                                onClick={() => { setContent("Profile"); setSidebarOpen(false) }}
                                                                className="flex w-full items-center gap-x-3 text-sm font-semibold leading-6 text-white hover:bg-white/10 rounded-xl p-2 transition-all"
                                                            >
                                                                <div className="relative">
                                                                    <img
                                                                        className="h-12 w-12 rounded-xl bg-white/20 ring-2 ring-white/40 shadow-lg object-cover"
                                                                        src={userInfo?.image || "https://via.placeholder.com/48"}
                                                                        alt="Profile"
                                                                    />
                                                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white/50"></div>
                                                                </div>
                                                                <div className="flex-1 text-left">
                                                                    <p className="text-sm font-bold text-white">
                                                                        {(userInfo?.first_name ?? "") + " " + (userInfo?.last_name ?? "") || "Guest User"}
                                                                    </p>
                                                                    <p className="text-xs text-blue-100 font-medium">View profile</p>
                                                                </div>
                                                                <UserCircleIcon className="h-5 w-5 text-white/60" />
                                                            </button>

                                                            {/* Auth Button - Mobile */}
                                                            <div className="mt-3">
                                                                {!accessToken ? (
                                                                    <a
                                                                        href='/login'
                                                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                                                                    >
                                                                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                                                        <span>Sign In</span>
                                                                    </a>
                                                                ) : (
                                                                    <button
                                                                        onClick={logout}
                                                                        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white/15 text-white rounded-xl font-bold hover:bg-white/25 transition-all border border-white/20"
                                                                    >
                                                                        <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                                                                        <span>Sign Out</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                {/* Desktop sidebar */}
                <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-80 md:flex-col">
                    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-6 relative">
                        {/* Premium Glassmorphism overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl"></div>
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40"></div>

                        <div className="relative z-10">
                            {/* Logo and Brand */}
                            <div className="flex h-20 shrink-0 items-center">
                                <div className="flex items-center gap-3">
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl border border-white/30 hover:scale-105 transition-transform duration-300">
                                        <RocketLaunchIcon className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-white font-bold text-2xl tracking-tight">TechElevate</h1>
                                        <p className="text-blue-100 text-sm font-medium">Your Career Hub</p>
                                    </div>
                                </div>
                            </div>

                            <nav className="flex flex-1 flex-col mt-8">
                                <ul className="flex flex-1 flex-col gap-y-7">
                                    <li>
                                        <div className="text-xs font-bold leading-6 text-white/60 mb-4 tracking-wider uppercase flex items-center gap-2">
                                            <div className="h-px flex-1 bg-gradient-to-r from-white/30 to-transparent"></div>
                                            <span>Workspace</span>
                                            <div className="h-px flex-1 bg-gradient-to-l from-white/30 to-transparent"></div>
                                        </div>
                                        <ul className="-mx-2 space-y-2">
                                            {navigation.filter((item) => item.type === "app").map((item) => (
                                                <li key={item.name}>
                                                    <button
                                                        onClick={() => setContent(item.name)}
                                                        className={classNames(
                                                            item.name === content
                                                                ? 'bg-white/25 text-white backdrop-blur-xl shadow-2xl border border-white/40 scale-[1.02]'
                                                                : 'text-blue-50 hover:bg-white/15 hover:text-white border border-transparent hover:border-white/20 hover:scale-[1.01]',
                                                            'group flex w-full items-center gap-x-3 rounded-2xl p-4 text-sm font-semibold leading-6 transition-all duration-300'
                                                        )}
                                                    >
                                                        <div className={classNames(
                                                            item.name === content
                                                                ? 'bg-gradient-to-br from-white/30 to-white/20 shadow-xl'
                                                                : 'bg-white/10 group-hover:bg-white/20',
                                                            'p-2.5 rounded-xl transition-all duration-300'
                                                        )}>
                                                            <item.icon
                                                                className="h-5 w-5 text-white"
                                                                aria-hidden="true"
                                                            />
                                                        </div>
                                                        <span className="flex-1 text-left">{item.name}</span>
                                                        {item.name === content && (
                                                            <ChevronRightIcon className="h-5 w-5 text-white/70" />
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>

                                    <li>
                                        <div className="text-xs font-bold leading-6 text-white/60 mb-4 tracking-wider uppercase flex items-center gap-2">
                                            <div className="h-px flex-1 bg-gradient-to-r from-white/30 to-transparent"></div>
                                            <span>Learning</span>
                                            <div className="h-px flex-1 bg-gradient-to-l from-white/30 to-transparent"></div>
                                        </div>
                                        <ul className="-mx-2 space-y-2">
                                            {navigation.filter((item) => item.type === "learn").map((item) => (
                                                <li key={item.name}>
                                                    <button
                                                        onClick={() => setContent(item.name)}
                                                        className={classNames(
                                                            item.name === content
                                                                ? 'bg-white/25 text-white backdrop-blur-xl shadow-2xl border border-white/40 scale-[1.02]'
                                                                : 'text-blue-50 hover:bg-white/15 hover:text-white border border-transparent hover:border-white/20 hover:scale-[1.01]',
                                                            'group flex w-full items-center gap-x-3 rounded-2xl p-4 text-sm font-semibold leading-6 transition-all duration-300'
                                                        )}
                                                    >
                                                        <div className={classNames(
                                                            item.name === content
                                                                ? 'bg-gradient-to-br from-white/30 to-white/20 shadow-xl'
                                                                : 'bg-white/10 group-hover:bg-white/20',
                                                            'p-2.5 rounded-xl transition-all duration-300'
                                                        )}>
                                                            <item.icon
                                                                className="h-5 w-5 text-white"
                                                                aria-hidden="true"
                                                            />
                                                        </div>
                                                        <span className="flex-1 text-left">{item.name}</span>
                                                        {item.name === content && (
                                                            <ChevronRightIcon className="h-5 w-5 text-white/70" />
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>

                                    <li>
                                        <div className="text-xs font-bold leading-6 text-white/60 mb-4 tracking-wider uppercase flex items-center gap-2">
                                            <div className="h-px flex-1 bg-gradient-to-r from-white/30 to-transparent"></div>
                                            <span>Resources</span>
                                            <div className="h-px flex-1 bg-gradient-to-l from-white/30 to-transparent"></div>
                                        </div>
                                        <ul className="-mx-2 space-y-2">
                                            {navigation.filter((item) => item.type === "other").map((item) => (
                                                <li key={item.name}>
                                                    <button
                                                        onClick={() => setContent(item.name)}
                                                        className={classNames(
                                                            item.name === content
                                                                ? 'bg-white/25 text-white backdrop-blur-xl shadow-2xl border border-white/40 scale-[1.02]'
                                                                : 'text-blue-50 hover:bg-white/15 hover:text-white border border-transparent hover:border-white/20 hover:scale-[1.01]',
                                                            'group flex w-full items-center gap-x-3 rounded-2xl p-4 text-sm font-semibold leading-6 transition-all duration-300'
                                                        )}
                                                    >
                                                        <div className={classNames(
                                                            item.name === content
                                                                ? 'bg-gradient-to-br from-white/30 to-white/20 shadow-xl'
                                                                : 'bg-white/10 group-hover:bg-white/20',
                                                            'p-2.5 rounded-xl transition-all duration-300'
                                                        )}>
                                                            <item.icon
                                                                className="h-5 w-5 text-white"
                                                                aria-hidden="true"
                                                            />
                                                        </div>
                                                        <span className="flex-1 text-left">{item.name}</span>
                                                        {item.name === content && (
                                                            <ChevronRightIcon className="h-5 w-5 text-white/70" />
                                                        )}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>

                                    <li className="mt-auto">
                                        <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/30 shadow-2xl">
                                            {/* User Profile */}
                                            <button
                                                onClick={() => setContent("Profile")}
                                                className="flex w-full items-center gap-x-3 text-sm font-semibold leading-6 text-white hover:bg-white/15 rounded-xl p-3 transition-all mb-4"
                                            >
                                                <div className="relative">
                                                    <img
                                                        className="h-12 w-12 rounded-xl bg-white/20 ring-2 ring-white/50 shadow-xl object-cover"
                                                        src={userInfo?.image || "https://via.placeholder.com/48"}
                                                        alt="Profile"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white/80 shadow-lg"></div>
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="text-sm font-bold text-white">
                                                        {(userInfo?.first_name ?? "") + " " + (userInfo?.last_name ?? "") || "Guest User"}
                                                    </p>
                                                    <p className="text-xs text-blue-100 font-medium">View profile</p>
                                                </div>
                                                <UserCircleIcon className="h-5 w-5 text-white/60" />
                                            </button>

                                            {/* Auth Button */}
                                            {!accessToken ? (
                                                <a
                                                    href='/login'
                                                    className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                                                >
                                                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                                    <span>Sign In</span>
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={logout}
                                                    className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-white/15 text-white rounded-xl font-bold hover:bg-white/25 transition-all border border-white/30 hover:scale-[1.02]"
                                                >
                                                    <ArrowLeftOnRectangleIcon className="h-5 w-5" />
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

                {/* Mobile header */}
                <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 shadow-2xl md:hidden">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"></div>
                    <button
                        type="button"
                        className="relative z-10 -m-2.5 p-2.5 text-white hover:bg-white/20 rounded-lg transition-all"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="relative z-10 flex-1 flex items-center justify-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-lg border border-white/30">
                            <RocketLaunchIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white">TechElevate</span>
                    </div>
                    <button
                        onClick={() => setContent("Profile")}
                        className="relative z-10 -m-2.5 p-1"
                    >
                        <span className="sr-only">Your profile</span>
                        <div className="relative">
                            <img
                                className="h-9 w-9 rounded-lg bg-white/20 ring-2 ring-white/50 object-cover shadow-lg"
                                src={userInfo?.image || "https://via.placeholder.com/36"}
                                alt="Profile"
                            />
                            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white/80"></div>
                        </div>
                    </button>
                </div>
            </div>
        </>
    )
}

export default Sidebar;