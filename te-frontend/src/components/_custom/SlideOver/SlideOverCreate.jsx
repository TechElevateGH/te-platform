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
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-[#06130d]/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
                        <Transition.Child
                            as={Fragment}
                            enter="transform transition ease-out duration-300"
                            enterFrom="translate-x-full"
                            enterTo="translate-x-0"
                            leave="transform transition ease-in duration-200"
                            leaveFrom="translate-x-0"
                            leaveTo="translate-x-full"
                        >
                            <Dialog.Panel className="pointer-events-auto h-full w-screen max-w-2xl border-l border-[var(--te-border)] bg-[var(--te-surface)] shadow-[var(--te-shadow-lg)]">
                                <form
                                    ref={formRef}
                                    className="flex h-full flex-col"
                                    onKeyDown={handleKeyDown}
                                    onSubmit={submitFormHandler}
                                >
                                    <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-5 py-5 sm:px-7">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <span className="te-eyebrow">Create new</span>
                                                <Dialog.Title className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--te-text)]">
                                                {title}
                                                </Dialog.Title>
                                            </div>
                                            <button
                                                type="button"
                                                className="te-icon-btn"
                                                onClick={() => { setOpen(false); }}
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="te-scroll min-h-0 flex-1 overflow-y-auto bg-[var(--te-surface)]">
                                        {children}
                                    </div>

                                    <div className="flex items-center justify-end gap-3 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)] px-5 py-4 sm:px-7">
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
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default SlideOverForm;