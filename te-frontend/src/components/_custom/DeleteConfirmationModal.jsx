import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, TrashIcon } from 'icons';

const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Delete",
    message,
    itemCount = 1,
    isDeleting = false,
    itemType = "item"
}) => {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                            <Dialog.Panel className="te-card w-full max-w-md transform overflow-hidden p-6 text-left align-middle shadow-sm transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-md bg-[var(--te-surface-alt)] border border-[var(--te-border)] flex items-center justify-center">
                                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div>
                                        <Dialog.Title
                                            as="h3"
                                            className="text-lg font-semibold leading-6 text-[var(--te-text)]"
                                        >
                                            {title}
                                        </Dialog.Title>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className="text-sm text-[var(--te-text-dim)]">
                                        {message || `Are you sure you want to permanently delete ${itemCount === 1 ? 'this' : 'these'} ${itemCount} ${itemType}${itemCount > 1 ? 's' : ''}?`}
                                    </p>
                                    <div className="mt-3 p-3 bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded-lg">
                                        <p className="text-sm font-semibold text-[var(--te-text)]">
                                            ⚠️ This action cannot be undone
                                        </p>
                                        <p className="text-xs text-[var(--te-text-dim)] mt-1">
                                            The {itemType}{itemCount > 1 ? 's' : ''} will be permanently removed from the database and cannot be recovered.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        className="te-btn-secondary"
                                        onClick={onClose}
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="te-btn-danger"
                                        onClick={onConfirm}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <TrashIcon className="h-4 w-4 mr-2" />
                                                Delete {itemCount > 1 ? `${itemCount} ${itemType}s` : itemType}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default DeleteConfirmationModal;
