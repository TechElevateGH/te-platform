import { useEffect } from 'react';
import { CheckCircleIcon, XMarkIcon } from 'icons';

const Toast = ({ message, type = 'success', onClose, duration = 2000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className="fixed top-4 right-4 z-[10000] animate-slide-in-right">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm border bg-[var(--te-surface)] text-[var(--te-text)] border-[var(--te-border)] ${type === 'error'
                    ? 'border-l-4 border-l-red-600'
                    : type === 'warning'
                        ? 'border-l-4 border-l-amber-500'
                        : ''
                }`}>
                <div className={`flex-shrink-0 ${type === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : type === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[var(--te-text)]'
                    }`}>
                    <CheckCircleIcon className="h-5 w-5 animate-scale-in" />
                </div>
                <p className={`text-sm font-medium ${type === 'success'
                        ? 'text-[var(--te-text)]'
                        : 'text-[var(--te-text)]'
                    }`}>
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className={`flex-shrink-0 ${type === 'success'
                            ? 'text-[var(--te-text-dim)] hover:text-[var(--te-text)]'
                            : 'text-[var(--te-text-dim)] hover:text-[var(--te-text)]'
                        }`}
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
