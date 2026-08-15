import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    InterviewCreate,
    MyInterviews,
    TimeslotManagement,
    InterviewManagement,
    MyAssignedInterviews
} from '../components/interview';
import {
    Cog6ToothIcon,
    UserGroupIcon,
    BriefcaseIcon,
    XMarkIcon,
    AcademicCapIcon,
    ChatBubbleBottomCenterTextIcon
} from 'icons';
import { CalendarDaysIcon, PlusIcon } from 'icons';

const TABS = {
    MY_INTERVIEWS: 'my_interviews',
    MY_ONE_ON_ONE: 'my_one_on_one',
    ASSIGNED: 'assigned',
    MANAGE_SLOTS: 'manage_slots',
    ALL_REQUESTS: 'all_requests'
};

const Interviews = () => {
    const { userRole } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS.MY_INTERVIEWS);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sessionType, setSessionType] = useState('interview'); // 'interview' or 'one_on_one'
    const [refreshKey, setRefreshKey] = useState(0);

    // Permission levels based on userRole
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const isMember = userRoleInt >= 1;
    const isMemberOnly = userRoleInt === 1; // Only Members (not Volunteers+) can have interviews
    const isVolunteer = userRoleInt >= 3;
    const isLead = userRoleInt >= 4;

    const tabs = [
        {
            id: TABS.MY_INTERVIEWS,
            label: 'Mock Interviews',
            icon: AcademicCapIcon,
            show: isMemberOnly, // Only Members can have mock interviews, not Volunteers+
        },
        {
            id: TABS.MY_ONE_ON_ONE,
            label: '1-on-1 Sessions',
            icon: ChatBubbleBottomCenterTextIcon,
            show: isMemberOnly,
        },
        {
            id: TABS.ASSIGNED,
            label: 'Assigned to Me',
            icon: BriefcaseIcon,
            show: isVolunteer,
        },
        {
            id: TABS.ALL_REQUESTS,
            label: 'All Requests',
            icon: UserGroupIcon,
            show: isLead,
        },
        {
            id: TABS.MANAGE_SLOTS,
            label: 'Manage Slots',
            icon: Cog6ToothIcon,
            show: isVolunteer,
        }
    ].filter(tab => tab.show);

    // Set default tab based on permission
    const getDefaultTab = () => {
        if (isMemberOnly) return TABS.MY_INTERVIEWS;
        if (isVolunteer) return TABS.ASSIGNED;
        return TABS.MY_INTERVIEWS;
    };

    // Ensure active tab is valid for current user
    if (!tabs.find(t => t.id === activeTab)) {
        setActiveTab(getDefaultTab());
    }

    const handleCreateSuccess = useCallback(() => {
        setShowCreateModal(false);
        setRefreshKey(prev => prev + 1);
    }, []);

    const renderContent = () => {
        switch (activeTab) {
            case TABS.MY_INTERVIEWS:
                return <MyInterviews
                    key={`interviews-${refreshKey}`}
                    onRequestNew={() => {
                        setSessionType('interview');
                        setShowCreateModal(true);
                    }}
                    interviewType="mock"
                />;
            case TABS.MY_ONE_ON_ONE:
                return <MyInterviews
                    key={`one-on-one-${refreshKey}`}
                    onRequestNew={() => {
                        setSessionType('one_on_one');
                        setShowCreateModal(true);
                    }}
                    interviewType="one_on_one"
                />;
            case TABS.ASSIGNED:
                return <MyAssignedInterviews />;
            case TABS.MANAGE_SLOTS:
                return <TimeslotManagement />;
            case TABS.ALL_REQUESTS:
                return <InterviewManagement />;
            default:
                return <MyInterviews
                    key={refreshKey}
                    onRequestNew={() => {
                        setSessionType('interview');
                        setShowCreateModal(true);
                    }}
                />;
        }
    };

    const activeTitle = activeTab === TABS.MY_ONE_ON_ONE
        ? '1-on-1 Sessions'
        : activeTab === TABS.MY_INTERVIEWS
            ? 'Mock Interviews'
            : activeTab === TABS.ASSIGNED
                ? 'Assigned Meetings'
                : activeTab === TABS.MANAGE_SLOTS
                    ? 'Availability'
                    : 'Requests';

    const activeDescription = activeTab === TABS.MY_ONE_ON_ONE
        ? 'Book focused mentorship time for career questions, resume reviews, and next steps.'
        : activeTab === TABS.MY_INTERVIEWS
            ? 'Practice technical and behavioral rounds with real interviewers.'
            : activeTab === TABS.MANAGE_SLOTS
                ? 'Publish clean availability windows for members to book.'
                : 'Review, assign, confirm, and complete meeting requests.';

    if (!isMember) {
        return (
            <div className="min-h-screen bg-[var(--te-bg)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
                    <div className="te-card mx-auto max-w-lg p-8">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                            <CalendarDaysIcon className="h-6 w-6 text-[var(--te-text-dim)]" />
                        </div>
                        <span className="te-eyebrow">Meetings</span>
                        <h3 className="mt-2 font-mono text-xl font-bold text-[var(--te-text)]">Members only</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--te-text-dim)]">
                            Meetings are available to verified members only. Please sign in or complete verification to access this feature.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--te-bg)]">
            <div className="sticky top-16 z-30 border-b border-[var(--te-border)] bg-[var(--te-bg)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-2xl">
                            <span className="te-eyebrow">Meetings</span>
                            <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--te-text)]">
                                {activeTitle}
                            </h1>
                            <p className="mt-2 text-sm leading-relaxed text-[var(--te-text-dim)]">
                                {activeDescription}
                            </p>
                        </div>
                        {isMemberOnly && (activeTab === TABS.MY_INTERVIEWS || activeTab === TABS.MY_ONE_ON_ONE) && (
                            <button
                                onClick={() => {
                                    setSessionType(activeTab === TABS.MY_ONE_ON_ONE ? 'one_on_one' : 'interview');
                                    setShowCreateModal(true);
                                }}
                                className="te-btn-primary te-btn-sm"
                            >
                                <PlusIcon className="h-4 w-4" />
                                {activeTab === TABS.MY_ONE_ON_ONE ? 'Request 1-on-1' : 'Request mock'}
                            </button>
                        )}
                    </div>

                    {tabs.length > 1 && (
                        <div className="mt-4 overflow-x-auto te-scroll">
                            <div className="inline-flex rounded-lg border border-[var(--te-border)] bg-[var(--te-surface-alt)] p-1 font-mono text-sm">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 whitespace-nowrap transition-colors ${isActive
                                                ? 'bg-[var(--te-green-soft)] text-te-green shadow-sm'
                                                : 'text-[var(--te-text-dim)] hover:bg-[var(--te-hover)] hover:text-[var(--te-text)]'
                                                }`}
                                        >
                                            {Icon && <Icon className="h-4 w-4" />}
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                {renderContent()}
            </main>

            {/* Create Interview Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/50 transition-opacity"
                            onClick={() => setShowCreateModal(false)}
                        />

                        {/* Modal */}
                        <div className="relative te-card max-w-2xl w-full max-h-[90vh] overflow-y-auto te-scroll">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-[var(--te-surface)] px-6 py-4 border-b border-[var(--te-border)] flex items-center justify-between">
                                <h2 className="font-mono text-lg font-semibold text-[var(--te-text)]">
                                    {sessionType === 'one_on_one' ? 'Request 1-on-1 Session' : 'Request Mock Interview'}
                                </h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="te-icon-btn"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                <InterviewCreate
                                    sessionType={sessionType}
                                    onSuccess={handleCreateSuccess}
                                    onCancel={() => setShowCreateModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Interviews;
