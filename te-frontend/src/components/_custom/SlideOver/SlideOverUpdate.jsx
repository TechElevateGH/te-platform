import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, TrashIcon, FolderIcon } from 'icons'


const SlideOverUpdate = ({ title, setHandler, children, updateHandler }) => {
    const [open, setOpen] = useState(true);

    useEffect(() => {
        let timeoutId;
        if (open === false) {
            timeoutId = setTimeout(() => {
                setHandler(null);
            }, 700);
        }
        return () => clearTimeout(timeoutId);
    }, [open, setHandler]);

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-10" onClose={() => { }}>
                <div className="fixed inset-0" />
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-lg">
                                    <div className="flex h-full flex-col divide-y divide-[var(--te-border)] bg-[var(--te-surface)] shadow-sm border-l border-[var(--te-border)]">
                                        <div className="h-0 flex-1 overflow-y-auto">
                                            <div className="bg-[var(--te-surface-alt)] border-b border-[var(--te-border)] px-4 py-6 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <Dialog.Title className="text-base font-semibold leading-6 text-[var(--te-text)]">
                                                        {title}
                                                    </Dialog.Title>
                                                    <div className="ml-3 flex h-7 items-center">
                                                        <button
                                                            type="button"
                                                            className="te-icon-btn relative"
                                                            onClick={() => { setOpen(false); }}
                                                        >
                                                            <span className="absolute -inset-2.5" />
                                                            <span className="sr-only">Close panel</span>
                                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {children}

                                            <div className="flex bottom-0 text-center justify-between gap-3 px-12 py-4 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)]">
                                                <button
                                                    type="button"
                                                    className="te-btn-primary te-btn-sm ml-3 justify-between flex w-1/3"
                                                    onClick={updateHandler}
                                                >
                                                    Save <FolderIcon className="h-5 w-5" aria-hidden="true" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="te-btn-secondary te-btn-sm ml-3 justify-between flex w-1/3"
                                                >
                                                    Close <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                                </button>

                                            </div>
                                        </div>
                                    </div >

                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

export default SlideOverUpdate;