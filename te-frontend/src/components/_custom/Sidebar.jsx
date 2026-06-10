import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { XMarkIcon, ArrowLeftOnRectangleIcon } from 'icons'

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

const GROUP_LABELS = {
    career: 'Workspace',
    interview: 'Support',
    learn: 'Learning',
    analytics: 'Insights',
    accounts: 'Admin',
}

const ROLE_LABELS = { 5: 'Admin', 4: 'Lead', 3: 'Volunteer', 2: 'Referrer' }

const getRoleLabel = (userRole, isGuest) => {
    if (isGuest) return 'Guest'
    const n = parseInt(userRole)
    if (!n || n < 2) return null
    if (n >= 5) return ROLE_LABELS[5]
    if (n >= 4) return ROLE_LABELS[4]
    if (n >= 3) return ROLE_LABELS[3]
    return ROLE_LABELS[2]
}

const Sidebar = ({ navigation, content, setContent, sidebarOpen, setSidebarOpen }) => {
    const navigate = useNavigate();
    const { logout, userRole, isGuest } = useAuth();

    const groups = ['career', 'interview', 'learn', 'analytics', 'accounts']
        .map((key) => ({ key, label: GROUP_LABELS[key], items: navigation.filter((item) => item.type === key) }))
        .filter((group) => group.items.length > 0)

    const roleLabel = getRoleLabel(userRole, isGuest)

    const navButton = (item, onClick) => {
        const active = item.name === content
        return (
            <button
                onClick={onClick}
                className={classNames(
                    'group flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-sm transition-colors duration-150',
                    active
                        ? 'bg-[var(--te-accent-soft)] font-medium text-[var(--te-accent)]'
                        : 'font-normal text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] hover:text-[var(--te-text)]'
                )}
            >
                <item.icon
                    className="h-[18px] w-[18px] flex-shrink-0"
                    strokeWidth={active ? 2.1 : 1.8}
                    aria-hidden="true"
                />
                <span className="flex-1 truncate text-left">{item.name}</span>
            </button>
        )
    }

    const renderBody = (onItemClick) => (
        <>
            <nav className="te-scroll flex-1 overflow-y-auto px-3 py-4">
                <div className="flex flex-col gap-y-5">
                    {groups.map((group) => (
                        <div key={group.key}>
                            <p className="mb-1.5 px-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--te-gold)]">
                                {group.label}
                            </p>
                            <ul className="space-y-0.5">
                                {group.items.map((item) => (
                                    <li key={item.name}>{navButton(item, () => onItemClick(item.name))}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </nav>

            <div className="mt-auto border-t border-[var(--te-border)] p-3">
                {roleLabel && (
                    <div className="mb-1 flex items-center justify-between rounded-md px-2.5 py-1.5">
                        <span className="text-xs font-medium text-[var(--te-text-dim)]">
                            {roleLabel}{isGuest ? ' mode' : ' access'}
                        </span>
                    </div>
                )}
                <button
                    onClick={() => { logout(); navigate(isGuest ? '/login' : '/'); setSidebarOpen(false) }}
                    className="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-sm font-normal text-[var(--te-text-dim)] transition-colors hover:bg-[var(--te-hover)] hover:text-[var(--te-text)]"
                >
                    <ArrowLeftOnRectangleIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    <span>{isGuest ? 'Exit guest mode' : 'Log out'}</span>
                </button>
            </div>
        </>
    )

    return (
        <>
            {/* ===================== Mobile sidebar ===================== */}
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-200"
                        enterFrom="opacity-0" enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-200"
                        leaveFrom="opacity-100" leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-200 transform"
                            enterFrom="-translate-x-full" enterTo="translate-x-0"
                            leave="transition ease-in-out duration-200 transform"
                            leaveFrom="translate-x-0" leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative mr-16 flex w-full max-w-[17rem] flex-1">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-in-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                                    leave="ease-in-out duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
                                >
                                    <div className="absolute left-full top-0 flex w-16 justify-center pt-4">
                                        <button type="button" className="te-icon-btn text-white hover:bg-white/10" onClick={() => setSidebarOpen(false)}>
                                            <span className="sr-only">Close sidebar</span>
                                            <XMarkIcon className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
                                        </button>
                                    </div>
                                </Transition.Child>

                                <div className="flex grow flex-col bg-[var(--te-surface-alt)]">
                                    <button onClick={() => navigate('/')} className="flex h-16 shrink-0 items-center gap-2.5 border-b border-[var(--te-border)] px-5">
                                        <img src="/te-mark.svg" alt="TechElevate" className="h-8 w-8 rounded-[9px]" />
                                        <span className="te-wordmark text-[15px] text-[var(--te-text)]">techelevate</span>
                                    </button>
                                    {renderBody((name) => { setContent(name); setSidebarOpen(false) })}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* ===================== Desktop sidebar (persistent) ===================== */}
            <aside className="hidden md:fixed md:top-16 md:bottom-0 md:left-0 md:z-40 md:flex md:w-60 md:flex-col border-r border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                <div className="te-stripe h-1 w-full flex-shrink-0" />
                {renderBody((name) => setContent(name))}
            </aside>
        </>
    )
}

export default Sidebar;
