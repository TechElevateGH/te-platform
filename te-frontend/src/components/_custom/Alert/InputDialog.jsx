import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { PencilSquareIcon } from '@heroicons/react/24/outline'

const InputDialog = ({
    isOpen,
    onClose,
    onSubmit,
    title = "Enter Information",
    message = "Please provide your input:",
    placeholder = "Enter text...",
    submitText = "Submit",
    cancelText = "Cancel",
    isTextArea = false,
    required = false,
    defaultValue = ""
}) => {
    const [value, setValue] = useState(defaultValue);

    const handleSubmit = () => {
        if (required && !value.trim()) {
            return;
        }
        onSubmit(value);
        setValue("");
        onClose();
    };

    const handleCancel = () => {
        setValue("");
        onClose();
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleCancel}>
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
                                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
                                            <PencilSquareIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                                        {title}
                                    </Dialog.Title>

                                    {/* Message */}
                                    {message && (
                                        <div className="text-sm text-gray-600 dark:text-gray-300 text-center mb-4">
                                            {message}
                                        </div>
                                    )}

                                    {/* Input Field */}
                                    <div className="mb-6">
                                        {isTextArea ? (
                                            <textarea
                                                value={value}
                                                onChange={(e) => setValue(e.target.value)}
                                                placeholder={placeholder}
                                                rows={4}
                                                className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => setValue(e.target.value)}
                                                placeholder={placeholder}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSubmit();
                                                    }
                                                }}
                                                className="w-full px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                autoFocus
                                            />
                                        )}
                                        {required && (
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                * This field is required
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 border border-gray-300 dark:border-gray-600"
                                            onClick={handleCancel}
                                        >
                                            {cancelText}
                                        </button>
                                        <button
                                            type="button"
                                            className="flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-all duration-200 shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={handleSubmit}
                                            disabled={required && !value.trim()}
                                        >
                                            {submitText}
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

export default InputDialog;
