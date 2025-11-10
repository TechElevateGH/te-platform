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
                return <TrashIcon className="h-6 w-6 text-red-600" />;
            case "success":
                return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
            case "info":
                return <InformationCircleIcon className="h-6 w-6 text-blue-600" />;
            default:
                return <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case "danger":
                return {
                    iconBg: "bg-red-100",
                    confirmBtn: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-red-600/25",
                    border: "border-red-200"
                };
            case "success":
                return {
                    iconBg: "bg-green-100",
                    confirmBtn: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-600/25",
                    border: "border-green-200"
                };
            case "info":
                return {
                    iconBg: "bg-blue-100",
                    confirmBtn: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/25",
                    border: "border-blue-200"
                };
            default:
                return {
                    iconBg: "bg-amber-100",
                    confirmBtn: "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-600/25",
                    border: "border-amber-200"
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-md">
                                <div className="p-6">
                                    {/* Icon */}
                                    <div className="flex items-center justify-center mb-4">
                                        <div className={`${colors.iconBg} rounded-full p-3`}>
                                            {getIcon()}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Dialog.Title className="text-xl font-bold text-gray-900 text-center mb-2">
                                        {title}
                                    </Dialog.Title>

                                    {/* Message */}
                                    <div className="text-sm text-gray-600 text-center mb-6">
                                        {message}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 border border-gray-300"
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
