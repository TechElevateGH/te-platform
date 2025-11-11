import { useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Toast = ({ message, type = 'success', onClose, duration = 2000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className="fixed top-4 right-4 z-[10000] animate-slide-in-right">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
                }`}>
                <div className={`flex-shrink-0 ${type === 'success'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                    <CheckCircleIcon className="h-5 w-5 animate-scale-in" />
                </div>
                <p className={`text-sm font-medium ${type === 'success'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className={`flex-shrink-0 ${type === 'success'
                            ? 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200'
                            : 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200'
                        }`}
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
