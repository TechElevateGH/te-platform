import { useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from 'icons'

const SuccessFeedback = ({ setShowSuccessFeedback, message }) => {

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowSuccessFeedback(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [setShowSuccessFeedback]);


    return (
        <div className="te-card w-9/12 mx-auto absolute z-20 p-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-[var(--te-text)]" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-[var(--te-text)]">{message}</p>
                </div>
                <div className="ml-auto pl-3">
                    <div className="-mx-1.5 -my-1.5">
                        <button
                            type="button"
                            className="te-icon-btn"
                            onClick={() => setShowSuccessFeedback(false)}
                        >
                            <span className="sr-only">Dismiss</span>
                            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuccessFeedback;
