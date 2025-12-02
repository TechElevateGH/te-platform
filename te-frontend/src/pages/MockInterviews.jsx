import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    MockInterviewCreate,
    MyMockInterviews,
    TimeslotManagement,
    MockInterviewManagement,
    MyAssignedInterviews
} from '../components/mock-interview';
import {
    Cog6ToothIcon,
    UserGroupIcon,
    BriefcaseIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { CalendarDaysIcon, PlusIcon } from '@heroicons/react/20/solid';

const TABS = {
    MY_INTERVIEWS: 'my_interviews',
    ASSIGNED: 'assigned',
    MANAGE_SLOTS: 'manage_slots',
    ALL_REQUESTS: 'all_requests'
};

const MockInterviews = () => {
    const { userRole } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS.MY_INTERVIEWS);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    // Permission levels based on userRole
    const userRoleInt = userRole ? parseInt(userRole) : 0;
    const isMember = userRoleInt >= 1;
    const isVolunteer = userRoleInt >= 3;
    const isLead = userRoleInt >= 4;

    const tabs = [
        {
            id: TABS.MY_INTERVIEWS,
            label: 'My Interviews',
            show: isMember,
        },
        {
            id: TABS.ASSIGNED,
            label: 'Assigned to Me',
            icon: BriefcaseIcon,
            show: isVolunteer,
        },
        {
            id: TABS.MANAGE_SLOTS,
            label: 'Manage Slots',
            icon: Cog6ToothIcon,
            show: isVolunteer,
        },
        {
            id: TABS.ALL_REQUESTS,
            label: 'All Requests',
            icon: UserGroupIcon,
            show: isLead,
        }
    ].filter(tab => tab.show);

    // Set default tab based on permission
    const getDefaultTab = () => {
        if (isMember) return TABS.MY_INTERVIEWS;
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
                return <MyMockInterviews key={refreshKey} onRequestNew={() => setShowCreateModal(true)} />;
            case TABS.ASSIGNED:
                return <MyAssignedInterviews />;
            case TABS.MANAGE_SLOTS:
                return <TimeslotManagement />;
            case TABS.ALL_REQUESTS:
                return <MockInterviewManagement />;
            default:
                return <MyMockInterviews key={refreshKey} onRequestNew={() => setShowCreateModal(true)} />;
        }
    };

    if (!isMember) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Members Only</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                    Mock interviews are available to verified members only. Please sign in or complete verification to access this feature.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Mock Interviews</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Practice with real interviewers and get personalized feedback
                    </p>
                </div>
                {isMember && activeTab === TABS.MY_INTERVIEWS && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Request Interview
                    </button>
                )}
            </div>

            {/* Tabs - Only show if more than one tab */}
            {tabs.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
                                    ${isActive
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                                    }
                                `}
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Content */}
            <div>
                {renderContent()}
            </div>

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
                        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Request Mock Interview</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6">
                                <MockInterviewCreate onSuccess={handleCreateSuccess} onCancel={() => setShowCreateModal(false)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MockInterviews;
