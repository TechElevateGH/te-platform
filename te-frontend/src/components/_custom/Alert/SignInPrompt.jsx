import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { LockClosedIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const SignInPrompt = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleSignIn = () => {
        navigate('/login');
        onClose();
    };

    const handleSignUp = () => {
        navigate('/signup');
        onClose();
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop with smooth fade and blur */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-blue-900/80 to-purple-900/80 backdrop-blur-md transition-all" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white shadow-2xl transition-all w-full max-w-md">
                                {/* Decorative gradient header */}
                                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-500 opacity-10" />

                                <div className="relative p-8">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center mb-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-20 animate-pulse" />
                                            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-4">
                                                <LockClosedIcon className="h-8 w-8 text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Dialog.Title className="text-2xl font-bold text-gray-900 text-center mb-3">
                                        Sign In Required
                                    </Dialog.Title>

                                    {/* Message */}
                                    <div className="text-center mb-8">
                                        <p className="text-sm text-gray-600 mb-2">
                                            Please sign in to access your workspace and manage your resumes, applications, and referrals.
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Don't have an account? Create one in seconds!
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-600/30"
                                            onClick={handleSignIn}
                                        >
                                            Sign In
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </button>

                                        <button
                                            type="button"
                                            className="w-full px-6 py-3.5 bg-white text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200"
                                            onClick={handleSignUp}
                                        >
                                            Create Account
                                        </button>

                                        <button
                                            type="button"
                                            className="w-full px-6 py-2.5 text-gray-500 text-xs font-medium hover:text-gray-700 transition-all duration-200"
                                            onClick={onClose}
                                        >
                                            Maybe Later
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default SignInPrompt;
