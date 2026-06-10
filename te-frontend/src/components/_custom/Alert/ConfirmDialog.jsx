import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, TrashIcon, CheckCircleIcon, InformationCircleIcon } from 'icons'

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning" // "warning", "danger", "success", "info"
}) => {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const getIcon = () => {
        switch (type) {
            case "danger":
                return <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />;
            case "success":
                return <CheckCircleIcon className="h-6 w-6 text-[var(--te-text)]" />;
            case "info":
                return <InformationCircleIcon className="h-6 w-6 text-[var(--te-text)]" />;
            default:
                return <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case "danger":
                return {
                    iconBg: "bg-[var(--te-surface-alt)] border border-[var(--te-border)]",
                    confirmBtn: "te-btn-danger",
                    border: "border-[var(--te-border)]"
                };
            case "success":
                return {
                    iconBg: "bg-[var(--te-surface-alt)] border border-[var(--te-border)]",
                    confirmBtn: "te-btn-primary",
                    border: "border-[var(--te-border)]"
                };
            case "info":
                return {
                    iconBg: "bg-[var(--te-surface-alt)] border border-[var(--te-border)]",
                    confirmBtn: "te-btn-primary",
                    border: "border-[var(--te-border)]"
                };
            default:
                return {
                    iconBg: "bg-[var(--te-surface-alt)] border border-[var(--te-border)]",
                    confirmBtn: "te-btn-primary",
                    border: "border-[var(--te-border)]"
                };
        }
    };

    const colors = getColors();

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
                    <div className="fixed inset-0 bg-black/40 transition-all" />
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
                            <Dialog.Panel className="te-card relative transform overflow-hidden shadow-sm transition-all w-full max-w-md">
                                <div className="p-6">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center mb-4">
                                        <div className={`${colors.iconBg} rounded-md p-3`}>
                                            {getIcon()}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Dialog.Title className="text-xl font-bold text-[var(--te-text)] text-center mb-2">
                                        {title}
                                    </Dialog.Title>

                                    {/* Message */}
                                    <div className="text-sm text-[var(--te-text-dim)] text-center mb-6">
                                        {message}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            className="te-btn-secondary flex-1"
                                            onClick={onClose}
                                        >
                                            {cancelText}
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 ${colors.confirmBtn}`}
                                            onClick={handleConfirm}
                                        >
                                            {confirmText}
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

export default ConfirmDialog;
