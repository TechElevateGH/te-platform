import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { LockClosedIcon, ArrowRightIcon } from 'icons'
import { useNavigate } from 'react-router-dom'

const SignInPrompt = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleSignIn = () => {
        navigate('/login');
        onClose();
    };

    const handleSignUp = () => {
        navigate('/register');
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
                    <div className="fixed inset-0 bg-[#06130d]/60 backdrop-blur-sm transition-all" />
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
                            <Dialog.Panel className="te-card relative w-full max-w-md transform overflow-hidden shadow-[var(--te-shadow-lg)] transition-all">
                                {/* Header */}
                                <div className="absolute top-0 inset-x-0 h-32 bg-[var(--te-surface-alt)] border-b border-[var(--te-border)]" />

                                <div className="relative p-8">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center mb-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-[var(--te-hover)] rounded-lg opacity-60 animate-pulse" />
                                            <div className="relative bg-[var(--te-surface)] border border-[var(--te-border)] rounded-lg p-4">
                                                <LockClosedIcon className="h-8 w-8 text-[var(--te-text)]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Dialog.Title className="mb-3 text-center text-2xl font-extrabold tracking-[-0.04em] text-[var(--te-text)]">
                                        Save your momentum
                                    </Dialog.Title>

                                    {/* Message */}
                                    <div className="text-center mb-8">
                                        <p className="text-sm text-[var(--te-text-dim)] mb-2">
                                            Sign in to manage your resumes, applications, referrals, and saved learning progress.
                                        </p>
                                        <p className="text-xs text-[var(--te-text-dim)]">
                                            Don't have an account? Create one in seconds!
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-3">
                                        <button
                                            type="button"
                                            className="te-btn-primary te-btn-lg w-full"
                                            onClick={handleSignIn}
                                        >
                                            Sign In
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </button>

                                        <button
                                            type="button"
                                            className="te-btn-secondary te-btn-lg w-full"
                                            onClick={handleSignUp}
                                        >
                                            Create Account
                                        </button>

                                        <button
                                            type="button"
                                            className="te-btn-ghost te-btn-sm w-full"
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
