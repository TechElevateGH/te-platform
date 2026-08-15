import { useEffect } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XCircleIcon,
    XMarkIcon,
} from 'icons';

const variants = {
    success: {
        icon: CheckCircleIcon,
        iconClass: 'bg-[var(--te-green-soft)] text-[var(--te-green)]',
        label: 'Success',
    },
    error: {
        icon: XCircleIcon,
        iconClass: 'bg-[var(--te-red-soft)] text-[var(--te-red)]',
        label: 'Something went wrong',
    },
    warning: {
        icon: ExclamationTriangleIcon,
        iconClass: 'bg-[var(--te-gold-soft)] text-[var(--te-gold)]',
        label: 'Heads up',
    },
    info: {
        icon: InformationCircleIcon,
        iconClass: 'bg-[var(--te-accent-soft)] text-[var(--te-accent)]',
        label: 'Update',
    },
};

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const variant = variants[type] || variants.info;
    const Icon = variant.icon;

    return (
        <div className="fixed inset-x-4 top-4 z-[10000] animate-slide-in-right sm:left-auto sm:right-5 sm:w-full sm:max-w-sm" role="alert">
            <div className="flex items-start gap-3 rounded-2xl border border-[var(--te-border)] bg-[var(--te-surface)] p-4 shadow-[var(--te-shadow-lg)]">
                <span className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ${variant.iconClass}`}>
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-xs font-extrabold text-[var(--te-text)]">{variant.label}</p>
                    <p className="mt-1 text-sm leading-5 text-[var(--te-text-dim)]">{message}</p>
                </div>
                <button onClick={onClose} className="te-icon-btn -mr-2 -mt-2 h-8 w-8 flex-shrink-0" aria-label="Dismiss notification">
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
