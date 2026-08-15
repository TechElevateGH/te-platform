import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowLeftOnRectangleIcon, XMarkIcon } from 'icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const GROUP_LABELS = {
    career: 'Career toolkit',
    interview: 'People & opportunities',
    learn: 'Grow your skills',
    analytics: 'Insights',
    accounts: 'Administration',
};

const GROUP_TONES = {
    career: '#68d8a0',
    interview: '#f0bd61',
    learn: '#f0868d',
    analytics: '#85b7ff',
    accounts: '#c59df5',
};

const ROLE_LABELS = { 5: 'Administrator', 4: 'Team lead', 3: 'Volunteer', 2: 'Referrer' };

const getRoleLabel = (userRole, isGuest) => {
    if (isGuest) return 'Guest preview';
    const role = parseInt(userRole);
    if (!role || role < 2) return 'Member workspace';
    if (role >= 5) return ROLE_LABELS[5];
    if (role >= 4) return ROLE_LABELS[4];
    if (role >= 3) return ROLE_LABELS[3];
    return ROLE_LABELS[2];
};

const Sidebar = ({ navigation, content, setContent, sidebarOpen, setSidebarOpen }) => {
    const navigate = useNavigate();
    const { logout, userRole, isGuest } = useAuth();

    const groups = ['career', 'interview', 'learn', 'analytics', 'accounts']
        .map((key) => ({
            key,
            label: GROUP_LABELS[key],
            items: navigation.filter((item) => item.type === key),
        }))
        .filter((group) => group.items.length > 0);

    const roleLabel = getRoleLabel(userRole, isGuest);

    const navItem = (item, onSelect) => {
        const active = item.name === content;
        const tone = GROUP_TONES[item.type] || GROUP_TONES.career;

        return (
            <button
                type="button"
                onClick={onSelect}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    active
                        ? 'bg-white text-[#0b2e21] shadow-[0_10px_24px_-14px_rgba(0,0,0,0.7)]'
                        : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                }`}
            >
                <span
                    className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg transition-colors ${
                        active ? 'bg-[#e6f6ed]' : 'bg-white/[0.08] group-hover:bg-white/[0.12]'
                    }`}
                    style={{ color: active ? '#0d7c4c' : tone }}
                >
                    <item.icon className="h-4 w-4" strokeWidth={active ? 2.3 : 1.9} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-[#0d7c4c]" />}
            </button>
        );
    };

    const handleLogout = () => {
        logout();
        navigate(isGuest ? '/login' : '/');
        setSidebarOpen(false);
    };

    const renderBody = (onItemClick) => (
        <>
            <div className="border-b border-white/10 px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Your space</p>
                        <p className="mt-1 text-sm font-bold text-white">{roleLabel}</p>
                    </div>
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#68d8a0] opacity-40" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#68d8a0]" />
                    </span>
                </div>
            </div>

            <nav className="te-scroll flex flex-1 flex-col overflow-y-auto px-3 py-5">
                <div className="space-y-6">
                    {groups.map((group) => (
                        <div key={group.key}>
                            <p className="mb-2 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: GROUP_TONES[group.key] }} />
                                {group.label}
                            </p>
                            <ul className="space-y-1">
                                {group.items.map((item) => (
                                    <li key={item.name}>
                                        {navItem(item, () => onItemClick(item.name))}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </nav>

            <div className="mt-auto border-t border-white/10 p-3">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/60 hover:bg-[#f47782]/10 hover:text-[#ff9ca4]"
                >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.07] group-hover:bg-[#f47782]/10">
                        <ArrowLeftOnRectangleIcon className="h-4 w-4" strokeWidth={1.9} />
                    </span>
                    {isGuest ? 'Leave guest preview' : 'Log out'}
                </button>
            </div>
        </>
    );

    return (
        <>
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-[#06130d]/70 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-out duration-200 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in duration-180 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative flex w-full max-w-[18rem] flex-col bg-[#0b2e21] shadow-2xl">
                                <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
                                    <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
                                        <img src="/te-mark.svg" alt="" className="h-9 w-9 rounded-xl" />
                                        <span className="te-wordmark text-[15px] text-white">TechElevate</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="grid h-9 w-9 place-items-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white"
                                        onClick={() => setSidebarOpen(false)}
                                        aria-label="Close workspace navigation"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                {renderBody((name) => {
                                    setContent(name);
                                    setSidebarOpen(false);
                                })}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </Dialog>
            </Transition.Root>

            <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-64 flex-col border-r border-white/5 bg-[#0b2e21] shadow-[12px_0_40px_-32px_rgba(0,0,0,0.7)] md:flex">
                {renderBody(setContent)}
            </aside>
        </>
    );
};

export default Sidebar;
