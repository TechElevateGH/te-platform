import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'


const SlideOverForm = ({ title, setHandler, requestHandler, children, submitButtonText = "Create Application", shouldReload = true }) => {
    const [open, setOpen] = useState(false);

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
        await requestHandler();
        document.getElementById('createForm').reset();
        if (shouldReload) {
            window.location.reload();
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
                    <div className="fixed inset-0 bg-gray-950/60 backdrop-blur-md transition-all" />
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all w-full max-w-2xl">
                                <form
                                    id="createForm"
                                    className="flex flex-col"
                                    onKeyDown={handleKeyDown}
                                    onSubmit={submitFormHandler}
                                >
                                    {/* Premium Header */}
                                    <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 px-6 py-5">
                                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
                                        <div className="relative flex items-center justify-between">
                                            <Dialog.Title className="text-xl font-bold text-white">
                                                {title}
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
                                                onClick={() => { setOpen(false); }}
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="max-h-[calc(100vh-16rem)] overflow-y-auto bg-gray-50/30">
                                        {children}
                                    </div>

                                    {/* Premium Footer */}
                                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                                        <button
                                            type="button"
                                            className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-white rounded-xl transition-all duration-200 border border-gray-200"
                                            onClick={() => { setOpen(false) }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-600/25"
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