import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon } from 'icons';

const SlackInviteModal = ({ isOpen, onClose, onJoin }) => {
    const slackInviteUrl = 'https://join.slack.com/t/techelevateworkspace/shared_invite/zt-3ig9yhi07-XZpHhVVnlv0Cj3lTyJLAuw';

    const handleJoinSlack = () => {
        // Open Slack invite in new tab
        window.open(slackInviteUrl, '_blank');
        // Mark as joined
        if (onJoin) {
            onJoin();
        }
        onClose();
    };

    const handleSkip = () => {
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleSkip}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="te-card w-full max-w-lg transform overflow-hidden shadow-sm transition-all">
                                {/* Close button */}
                                <div className="absolute right-4 top-4">
                                    <button
                                        type="button"
                                        className="te-icon-btn"
                                        onClick={handleSkip}
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Header */}
                                <div className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)] px-8 pt-12 pb-8 text-[var(--te-text)]">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-lg bg-[var(--te-surface)] border border-[var(--te-border)] text-[var(--te-text)]">
                                        {/* Slack icon */}
                                        <svg className="h-12 w-12" viewBox="0 0 127 127" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="currentColor" />
                                            <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="currentColor" />
                                            <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="currentColor" />
                                            <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-bold mb-3 text-[var(--te-text)]"
                                    >
                                        Join Our Slack Community! 🎉
                                    </Dialog.Title>
                                    <p className="text-[var(--te-text-dim)] text-base">
                                        Connect with fellow members, get support, and stay updated
                                    </p>
                                </div>

                                {/* Content */}
                                <div className="px-8 py-8">
                                    {/* Benefits list */}
                                    <div className="space-y-4 mb-8">
                                        {[
                                            {
                                                icon: '💬',
                                                title: 'Real-time Support',
                                                description: 'Get quick answers to your questions from mentors and peers'
                                            },
                                            {
                                                icon: '🤝',
                                                title: 'Network & Collaborate',
                                                description: 'Connect with other members on their tech journey'
                                            },
                                            {
                                                icon: '📢',
                                                title: 'Stay Updated',
                                                description: 'Be the first to know about opportunities, events, and resources'
                                            },
                                            {
                                                icon: '🎯',
                                                title: 'Exclusive Resources',
                                                description: 'Access special channels, tips, and career guidance'
                                            }
                                        ].map((benefit, index) => (
                                            <div key={index} className="flex gap-4 items-start">
                                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-[var(--te-surface-alt)] border border-[var(--te-border)] text-2xl">
                                                    {benefit.icon}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <h4 className="font-semibold text-[var(--te-text)] mb-1">
                                                        {benefit.title}
                                                    </h4>
                                                    <p className="text-sm text-[var(--te-text-dim)]">
                                                        {benefit.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Success note */}
                                    <div className="mb-6 rounded-lg bg-[var(--te-surface-alt)] border border-[var(--te-border)] p-4">
                                        <div className="flex gap-3">
                                            <CheckCircleIcon className="h-6 w-6 text-[var(--te-text)] flex-shrink-0 mt-0.5" />
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-[var(--te-text)] mb-1">
                                                    You're all set!
                                                </p>
                                                <p className="text-sm text-[var(--te-text-dim)]">
                                                    Click below to join our Slack workspace and introduce yourself. We can't wait to meet you!
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            type="button"
                                            className="te-btn-primary te-btn-lg flex-1"
                                            onClick={handleJoinSlack}
                                        >
                                            Join Slack Workspace
                                        </button>
                                        <button
                                            type="button"
                                            className="te-btn-secondary te-btn-lg flex-shrink-0"
                                            onClick={handleSkip}
                                        >
                                            Maybe Later
                                        </button>
                                    </div>

                                    <p className="mt-4 text-xs text-center text-[var(--te-text-dim)]">
                                        You can always join later from your workspace homepage
                                    </p>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default SlackInviteModal;
