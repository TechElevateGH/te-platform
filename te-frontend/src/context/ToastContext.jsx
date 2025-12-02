import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, duration };
        
        setToasts(prev => [...prev, toast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }

        return id;
    }, [removeToast]);

    const success = useCallback((message, duration) => addToast(message, 'success', duration), [addToast]);
    const error = useCallback((message, duration) => addToast(message, 'error', duration), [addToast]);
    const warning = useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]);
    const info = useCallback((message, duration) => addToast(message, 'info', duration), [addToast]);

    const value = {
        success,
        error,
        warning,
        info,
        removeToast
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
            ))}
        </div>
    );
};

const Toast = ({ toast, onClose }) => {
    const { type, message } = toast;

    const styles = {
        success: {
            bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
            text: 'text-green-800 dark:text-green-200',
            icon: CheckCircleIcon,
            iconColor: 'text-green-600 dark:text-green-400'
        },
        error: {
            bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            text: 'text-red-800 dark:text-red-200',
            icon: XCircleIcon,
            iconColor: 'text-red-600 dark:text-red-400'
        },
        warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
            text: 'text-yellow-800 dark:text-yellow-200',
            icon: ExclamationTriangleIcon,
            iconColor: 'text-yellow-600 dark:text-yellow-400'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            text: 'text-blue-800 dark:text-blue-200',
            icon: InformationCircleIcon,
            iconColor: 'text-blue-600 dark:text-blue-400'
        }
    };

    const style = styles[type] || styles.info;
    const Icon = style.icon;

    return (
        <div 
            className={`pointer-events-auto flex items-start gap-3 min-w-[300px] max-w-md p-4 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 animate-slide-in ${style.bg}`}
        >
            <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${style.iconColor}`} />
            <p className={`flex-1 text-sm font-medium ${style.text}`}>{message}</p>
            <button
                onClick={onClose}
                className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
            >
                <XMarkIcon className="h-5 w-5" />
            </button>
        </div>
    );
};
