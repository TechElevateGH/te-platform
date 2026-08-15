import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, TrashIcon, ArchiveBoxIcon } from 'icons'


const SlideOverInfo = ({ entityId, title, setHandler, archiveRequest, deleteRequest, children }) => {
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
            <Dialog as="div" className="relative z-50" onClose={setOpen}>
                <div className="fixed inset-0 bg-[#06130d]/60 backdrop-blur-sm transition-opacity" />
                <div className="fixed inset-0 overflow-hidden">
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
                                <Dialog.Panel className="pointer-events-auto h-full w-screen max-w-xl">
                                    <div className="flex h-full flex-col border-l border-[var(--te-border)] bg-[var(--te-surface)] shadow-[var(--te-shadow-lg)]">
                                            <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-5 py-5 sm:px-7">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="te-eyebrow">Details</span>
                                                        <Dialog.Title className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[var(--te-text)]">{title}</Dialog.Title>
                                                    </div>
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
                                            <div className="te-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>

                                            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--te-border)] bg-[var(--te-surface-alt)] px-5 py-4 sm:px-7">
                                                <button
                                                    type="button"
                                                    className="te-btn-secondary"
                                                    onClick={() => archiveRequest([entityId])}
                                                >
                                                    Archive <ArchiveBoxIcon className="h-5 w-5" aria-hidden="true" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="te-btn-secondary"
                                                    onClick={() => setOpen(false)}
                                                >
                                                    Close <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="te-btn-danger"
                                                    onClick={() => deleteRequest([entityId])}
                                                >
                                                    Delete <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                                </button>
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

export default SlideOverInfo;