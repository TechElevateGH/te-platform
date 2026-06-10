import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { PencilSquareIcon } from 'icons'

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
                                        <div className="bg-[var(--te-surface-alt)] border border-[var(--te-border)] rounded-md p-3">
                                            <PencilSquareIcon className="h-6 w-6 text-[var(--te-text)]" />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Dialog.Title className="text-xl font-bold text-[var(--te-text)] text-center mb-2">
                                        {title}
                                    </Dialog.Title>

                                    {/* Message */}
                                    {message && (
                                        <div className="text-sm text-[var(--te-text-dim)] text-center mb-4">
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
                                                className="te-textarea resize-none"
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
                                                className="te-input"
                                                autoFocus
                                            />
                                        )}
                                        {required && (
                                            <p className="mt-1 text-xs text-[var(--te-text-dim)]">
                                                * This field is required
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            className="te-btn-secondary flex-1"
                                            onClick={handleCancel}
                                        >
                                            {cancelText}
                                        </button>
                                        <button
                                            type="button"
                                            className="te-btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
