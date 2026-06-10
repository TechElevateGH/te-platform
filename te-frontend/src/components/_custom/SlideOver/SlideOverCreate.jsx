import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from 'icons'
const SlideOverForm = ({
    title,
    setHandler,
    requestHandler,
    children,
    submitButtonText = "Create Application",
    shouldReload = true,
    isSubmitting = false,
    isSubmitDisabled = false,
}) => {
    const [open, setOpen] = useState(false);
    const formRef = useRef(null);

    useEffect(() => {
        // Delay opening to allow smooth entrance
        const openTimeout = setTimeout(() => setOpen(true), 50);

        return () => clearTimeout(openTimeout);
    }, []);

    useEffect(() => {
        let timeoutId;
        if (open === false) {
            timeoutId = setTimeout(() => {
                setHandler(false);
            }, 300);
        }

        return () => clearTimeout(timeoutId);
    }, [open, setHandler]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    const submitFormHandler = async (e) => {
        e.preventDefault();
        let wasSuccessful = false;

        try {
            const result = await requestHandler();
            wasSuccessful = result === true;
        } catch (error) {
            console.error('SlideOver submit failed:', error);
        }

        if (wasSuccessful) {
            if (formRef.current) {
                formRef.current.reset();
            }

            if (shouldReload) {
                window.location.reload();
            }
        }
    };


    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => { setOpen(false) }}>
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
                            <Dialog.Panel className="te-card relative transform overflow-hidden shadow-sm transition-all w-full max-w-2xl">
                                <form
                                    ref={formRef}
                                    className="flex flex-col"
                                    onKeyDown={handleKeyDown}
                                    onSubmit={submitFormHandler}
                                >
                                    {/* Premium Header */}
                                    <div className="relative bg-[var(--te-surface-alt)] border-b border-[var(--te-border)] px-6 py-5">
                                        <div className="absolute inset-0 opacity-30" />
                                        <div className="relative flex items-center justify-between">
                                            <Dialog.Title className="text-xl font-bold text-[var(--te-text)]">
                                                {title}
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                className="te-icon-btn"
                                                onClick={() => { setOpen(false); }}
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="te-scroll max-h-[calc(100vh-16rem)] overflow-y-auto bg-[var(--te-surface)] transition-colors">
                                        {children}
                                    </div>

                                    {/* Premium Footer */}
                                    <div className="flex items-center justify-end gap-3 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)] px-6 py-4 transition-colors">
                                        <button
                                            type="button"
                                            className="te-btn-secondary"
                                            onClick={() => { setOpen(false) }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className={`te-btn-primary ${(isSubmitting || isSubmitDisabled)
                                                ? 'cursor-not-allowed'
                                                : ''
                                                }`}
                                            disabled={isSubmitting || isSubmitDisabled}
                                        >
                                            {submitButtonText}
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default SlideOverForm;