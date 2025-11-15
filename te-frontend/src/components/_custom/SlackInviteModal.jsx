import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
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
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
                                {/* Close button */}
                                <div className="absolute right-4 top-4">
                                    <button
                                        type="button"
                                        className="rounded-full p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        onClick={handleSkip}
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Header with TechElevate gradient background */}
                                <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 px-8 pt-12 pb-8 text-white">
                                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                                        {/* Slack icon */}
                                        <svg className="h-12 w-12" viewBox="0 0 127 127" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z" fill="#E01E5A" />
                                            <path d="M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z" fill="#36C5F0" />
                                            <path d="M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z" fill="#2EB67D" />
                                            <path d="M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z" fill="#ECB22E" />
                                        </svg>
                                    </div>
                                    <Dialog.Title
                                        as="h3"
                                        className="text-3xl font-bold mb-3"
                                    >
                                        Join Our Slack Community! 🎉
                                    </Dialog.Title>
                                    <p className="text-white/90 text-lg">
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
                                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-2xl">
                                                    {benefit.icon}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                        {benefit.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {benefit.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Success note */}
                                    <div className="mb-6 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                                        <div className="flex gap-3">
                                            <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                                                    You're all set!
                                                </p>
                                                <p className="text-sm text-green-700 dark:text-green-300">
                                                    Click below to join our Slack workspace and introduce yourself. We can't wait to meet you!
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            type="button"
                                            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                            onClick={handleJoinSlack}
                                        >
                                            Join Slack Workspace
                                        </button>
                                        <button
                                            type="button"
                                            className="flex-shrink-0 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-3.5 text-base font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                                            onClick={handleSkip}
                                        >
                                            Maybe Later
                                        </button>
                                    </div>

                                    <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
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
