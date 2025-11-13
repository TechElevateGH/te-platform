import { Fragment, useState, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useNavigate } from 'react-router-dom'
import {
    XMarkIcon,
    ChevronRightIcon,
    ChevronDownIcon
} from '@heroicons/react/24/outline'
import {
    RocketLaunchIcon
} from '@heroicons/react/24/solid'

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

const Sidebar = ({ navigation, content, setContent, setLogin, sidebarOpen, setSidebarOpen }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false)
    const [showScrollIndicator, setShowScrollIndicator] = useState(false)
    const sidebarContentRef = useRef(null)

    useEffect(() => {
        const checkScroll = () => {
            if (sidebarContentRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = sidebarContentRef.current
                setShowScrollIndicator(scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight - 10)
            }
        }

        const sidebar = sidebarContentRef.current
        if (sidebar) {
            checkScroll()
            sidebar.addEventListener('scroll', checkScroll)
            return () => sidebar.removeEventListener('scroll', checkScroll)
        }
    }, [isExpanded])

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
                                    <div className="flex grow flex-col gap-y-5 overflow-y-auto scrollbar-hide bg-white dark:bg-gray-800 px-6 pb-4 transition-colors">
                                        <div className="flex h-20 shrink-0 items-center mt-2 border-b border-gray-100 dark:border-gray-700 pb-4 transition-colors">
                                            <button
                                                onClick={() => navigate('/')}
                                                className="flex items-center gap-3 group"
                                            >
                                                <div className="h-11 w-11 rounded-xl bg-te-gradient flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                                                    <RocketLaunchIcon className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <h1 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">TechElevate</h1>
                                                    <p className="text-xs text-gray-500 dark:text-gray-300 font-medium transition-colors">Career Platform</p>
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
                                                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                                                                        'group flex w-full items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all'
                                                                    )}
                                                                >
                                                                    <item.icon
                                                                        className={classNames(
                                                                            item.name === content ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500',
                                                                            'h-5 w-5 transition-colors'
                                                                        )}
                                                                        aria-hidden="true"
                                                                    />
                                                                    <span className="flex-1 text-left">{item.name}</span>
                                                                    {item.name === content && (
                                                                        <ChevronRightIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                                    )}
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>


                                            </ul>
                                        </nav>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>

                {/* Desktop sidebar - Collapsible */}
                <div
                    className={classNames(
                        "hidden md:fixed md:top-20 md:bottom-6 md:left-6 md:z-40 md:flex md:flex-col transition-all duration-300 ease-in-out",
                        isExpanded ? "md:w-80" : "md:w-20"
                    )}
                    onMouseEnter={() => setIsExpanded(true)}
                    onMouseLeave={() => setIsExpanded(false)}
                >
                    <div className={classNames(
                        "flex grow flex-col gap-y-5 bg-gradient-to-br from-blue-50/80 via-cyan-50/60 to-purple-50/70 dark:from-gray-800/80 dark:via-gray-900/60 dark:to-gray-800/70 backdrop-blur-xl border border-white/60 dark:border-gray-700/60 rounded-2xl px-4 py-6 relative overflow-hidden transition-shadow duration-300",
                        isExpanded ? "shadow-2xl shadow-blue-500/30 dark:shadow-blue-900/30" : "shadow-2xl dark:shadow-gray-900/50"
                    )}>
                        {/* Glassmorphism overlay */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-2xl rounded-2xl"></div>
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2IoOTksMTAyLDI0MSkiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-60 dark:opacity-40 rounded-2xl"></div>

                        {/* Scrollable content */}
                        <div
                            ref={sidebarContentRef}
                            className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
                        >
                            <nav className="flex flex-1 flex-col">
                                <ul className="flex flex-1 flex-col gap-y-7">
                                    <li>
                                        {isExpanded && (
                                            <div className="text-xs font-semibold leading-6 text-gray-500 dark:text-gray-400 mb-3 tracking-wide uppercase">
                                                Workspace
                                            </div>
                                        )}
                                        <ul className="space-y-2">
                                            {navigation.filter((item) => item.type === "app").map((item, index) => {
                                                const colors = [
                                                    { bg: 'bg-blue-500/10', hoverBg: 'hover:bg-blue-500/20', text: 'text-blue-700', icon: 'text-blue-600', activeBg: 'bg-gradient-to-r from-blue-500 to-cyan-500', ring: 'ring-blue-500/20' },
                                                    { bg: 'bg-purple-500/10', hoverBg: 'hover:bg-purple-500/20', text: 'text-purple-700', icon: 'text-purple-600', activeBg: 'bg-gradient-to-r from-purple-500 to-pink-500', ring: 'ring-purple-500/20' },
                                                    { bg: 'bg-cyan-500/10', hoverBg: 'hover:bg-cyan-500/20', text: 'text-cyan-700', icon: 'text-cyan-600', activeBg: 'bg-gradient-to-r from-cyan-500 to-blue-500', ring: 'ring-cyan-500/20' },
                                                    { bg: 'bg-emerald-500/10', hoverBg: 'hover:bg-emerald-500/20', text: 'text-emerald-700', icon: 'text-emerald-600', activeBg: 'bg-gradient-to-r from-emerald-500 to-teal-500', ring: 'ring-emerald-500/20' },
                                                ];
                                                const color = colors[index % colors.length];
                                                return (
                                                    <li key={item.name}>
                                                        <button
                                                            onClick={() => setContent(item.name)}
                                                            className={classNames(
                                                                item.name === content
                                                                    ? `${color.activeBg} text-white shadow-lg scale-[1.02] ring-2 ${color.ring}`
                                                                    : `${color.bg} ${color.text} ${color.hoverBg} hover:scale-[1.01]`,
                                                                'group flex w-full items-center rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 backdrop-blur-sm',
                                                                isExpanded ? 'gap-x-3' : 'justify-center'
                                                            )}
                                                            title={!isExpanded ? item.name : ''}
                                                        >
                                                            <div className={classNames(
                                                                item.name === content ? 'bg-white/20 shadow-lg' : 'bg-white/50',
                                                                'p-2 rounded-lg transition-all duration-300 flex-shrink-0'
                                                            )}>
                                                                <item.icon
                                                                    className={classNames(
                                                                        item.name === content ? 'text-white' : color.icon,
                                                                        'h-5 w-5 transition-colors'
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                            </div>
                                                            {isExpanded && (
                                                                <>
                                                                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">{item.name}</span>
                                                                    {item.name === content && (
                                                                        <ChevronRightIcon className="h-4 w-4 text-white/90 flex-shrink-0" />
                                                                    )}
                                                                </>
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </li>

                                    <li>
                                        {isExpanded && (
                                            <div className="text-xs font-semibold leading-6 text-gray-500 dark:text-gray-400 mb-3 tracking-wide uppercase">
                                                Learning
                                            </div>
                                        )}
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
                                                                    ? `${color.activeBg} text-white shadow-lg scale-[1.02] ring-2 ${color.ring}`
                                                                    : `${color.bg} ${color.text} ${color.hoverBg} hover:scale-[1.01]`,
                                                                'group flex w-full items-center rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 backdrop-blur-sm',
                                                                isExpanded ? 'gap-x-3' : 'justify-center'
                                                            )}
                                                            title={!isExpanded ? item.name : ''}
                                                        >
                                                            <div className={classNames(
                                                                item.name === content ? 'bg-white/20 shadow-lg' : 'bg-white/50',
                                                                'p-2 rounded-lg transition-all duration-300 flex-shrink-0'
                                                            )}>
                                                                <item.icon
                                                                    className={classNames(
                                                                        item.name === content ? 'text-white' : color.icon,
                                                                        'h-5 w-5 transition-colors'
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                            </div>
                                                            {isExpanded && (
                                                                <>
                                                                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">{item.name}</span>
                                                                    {item.name === content && (
                                                                        <ChevronRightIcon className="h-4 w-4 text-white/90 flex-shrink-0" />
                                                                    )}
                                                                </>
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </li>

                                    <li>
                                        {isExpanded && (
                                            <div className="text-xs font-semibold leading-6 text-gray-500 dark:text-gray-400 mb-3 tracking-wide uppercase">
                                                Accounts
                                            </div>
                                        )}
                                        <ul className="space-y-2">
                                            {navigation.filter((item) => item.type === "accounts").map((item) => {
                                                const color = { bg: 'bg-indigo-500/10', hoverBg: 'hover:bg-indigo-500/20', text: 'text-indigo-700', icon: 'text-indigo-600', activeBg: 'bg-gradient-to-r from-indigo-500 to-purple-500', ring: 'ring-indigo-500/20' };
                                                return (
                                                    <li key={item.name}>
                                                        <button
                                                            onClick={() => setContent(item.name)}
                                                            className={classNames(
                                                                item.name === content
                                                                    ? `${color.activeBg} text-white shadow-lg scale-[1.02] ring-2 ${color.ring}`
                                                                    : `${color.bg} ${color.text} ${color.hoverBg} hover:scale-[1.01]`,
                                                                'group flex w-full items-center rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 backdrop-blur-sm',
                                                                isExpanded ? 'gap-x-3' : 'justify-center'
                                                            )}
                                                            title={!isExpanded ? item.name : ''}
                                                        >
                                                            <div className={classNames(
                                                                item.name === content ? 'bg-white/20 shadow-lg' : 'bg-white/50',
                                                                'p-2 rounded-lg transition-all duration-300 flex-shrink-0'
                                                            )}>
                                                                <item.icon
                                                                    className={classNames(
                                                                        item.name === content ? 'text-white' : color.icon,
                                                                        'h-5 w-5 transition-colors'
                                                                    )}
                                                                    aria-hidden="true"
                                                                />
                                                            </div>
                                                            {isExpanded && (
                                                                <>
                                                                    <span className="flex-1 text-left whitespace-nowrap overflow-hidden">{item.name}</span>
                                                                    {item.name === content && (
                                                                        <ChevronRightIcon className="h-4 w-4 text-white/90 flex-shrink-0" />
                                                                    )}
                                                                </>
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </li>


                                </ul>
                            </nav>
                        </div>

                        {/* Scroll indicator with blinking down arrow */}
                        {showScrollIndicator && (
                            <div className="relative z-20 flex justify-center py-3 pointer-events-none">
                                <ChevronDownIcon className="h-5 w-5 text-blue-600 animate-bounce opacity-60" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Sidebar;
