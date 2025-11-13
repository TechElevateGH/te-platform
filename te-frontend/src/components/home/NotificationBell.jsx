import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { BellAlertIcon } from '@heroicons/react/24/solid';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = (e, notificationId) => {
        e.stopPropagation();
        markAsRead(notificationId);
    };

    const getTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                title="Notifications"
            >
                {unreadCount > 0 ? (
                    <BellAlertIcon className="h-6 w-6 text-red-600 dark:text-red-400 animate-pulse" />
                ) : (
                    <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                )}

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in-down">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h3>
                            {notifications.length > 0 && (
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
                                        >
                                            <CheckIcon className="h-3.5 w-3.5" />
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={clearAll}
                                        className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        title="Clear all"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.filter(n => !n.read).length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <BellIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No notifications</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.filter(n => !n.read).map((notification) => (
                                <div
                                    key={notification.id}
                                    className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 transition-colors bg-red-50/50 dark:bg-red-900/10"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-red-600"></span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                {getTimeAgo(notification.timestamp)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                                            className="flex-shrink-0 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded hover:border-red-300 dark:hover:border-red-700 transition-all"
                                            title="Mark as read"
                                        >
                                            <CheckIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
