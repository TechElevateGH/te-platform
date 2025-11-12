import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon, TrashIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

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
                return <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />;
            case "info":
                return <InformationCircleIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
            default:
                return <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case "danger":
                return {
                    iconBg: "bg-red-100 dark:bg-red-900/30",
                    confirmBtn: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-600/25 dark:from-red-600 dark:to-red-700 dark:hover:from-red-700 dark:hover:to-red-800",
                    border: "border-red-200 dark:border-red-800"
                };
            case "success":
                return {
                    iconBg: "bg-green-100 dark:bg-green-900/30",
                    confirmBtn: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-600/25 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800",
                    border: "border-green-200 dark:border-green-800"
                };
            case "info":
                return {
                    iconBg: "bg-blue-100 dark:bg-blue-900/30",
                    confirmBtn: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/25 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800",
                    border: "border-blue-200 dark:border-blue-800"
                };
            default:
                return {
                    iconBg: "bg-amber-100 dark:bg-amber-900/30",
                    confirmBtn: "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-600/25 dark:from-amber-600 dark:to-amber-700 dark:hover:from-amber-700 dark:hover:to-amber-800",
                    border: "border-amber-200 dark:border-amber-800"
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
                    <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-sm transition-all" />
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all w-full max-w-md">
                                <div className="p-6">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center mb-4">
                                        <div className={`${colors.iconBg} rounded-full p-3`}>
                                            {getIcon()}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                                        {title}
                                    </Dialog.Title>

                                    {/* Message */}
                                    <div className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
                                        {message}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 border border-gray-300 dark:border-gray-600"
                                            onClick={onClose}
                                        >
                                            {cancelText}
                                        </button>
                                        <button
                                            type="button"
                                            className={`flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-all duration-200 shadow-lg ${colors.confirmBtn}`}
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
