import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { BellIcon, CheckIcon, TrashIcon } from 'icons';
import { BellAlertIcon } from 'icons';

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

    const formatTimestamp = (timestamp) => {
        // Parse the timestamp - it comes from backend as ISO string in UTC
        let date;
        if (timestamp.endsWith('Z') || timestamp.includes('+')) {
            // Already has timezone info
            date = new Date(timestamp);
        } else {
            // No timezone info, assume UTC and append 'Z'
            date = new Date(timestamp + 'Z');
        }

        const now = new Date();

        // Check if it's today in local timezone
        const isToday = date.toDateString() === now.toDateString();

        // Check if it's yesterday in local timezone
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        const timeString = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        if (isToday) {
            return `Today at ${timeString}`;
        } else if (isYesterday) {
            return `Yesterday at ${timeString}`;
        } else {
            // Show date and time for older notifications
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            }) + ` at ${timeString}`;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="te-icon-btn relative"
                title="Notifications"
                aria-label="Notifications"
                aria-expanded={isOpen}
            >
                {unreadCount > 0 ? (
                    <BellAlertIcon className="h-5 w-5 text-[var(--te-red)]" />
                ) : (
                    <BellIcon className="h-5 w-5" />
                )}

                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--te-red)] opacity-40"></span>
                        <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--te-red)] text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="te-card absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden shadow-[var(--te-shadow-lg)] animate-fade-in-down">
                    {/* Header */}
                    <div className="border-b border-[var(--te-border)] bg-[var(--te-surface-alt)] px-4 py-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-extrabold text-[var(--te-text)]">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-2 rounded-full bg-[var(--te-red-soft)] px-2 py-0.5 text-xs font-bold text-[var(--te-red)]">
                                        {unreadCount} new
                                    </span>
                                )}
                            </h3>
                            {notifications.length > 0 && (
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="flex items-center gap-1 text-xs font-bold text-[var(--te-accent)] hover:text-[var(--te-accent-hover)]"
                                        >
                                            <CheckIcon className="h-3.5 w-3.5" />
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={clearAll}
                                        className="te-icon-btn h-7 w-7"
                                        title="Clear all"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="te-scroll max-h-96 overflow-y-auto">
                        {notifications.filter(n => !n.read).length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[var(--te-surface-alt)]">
                                    <BellIcon className="h-5 w-5 text-[var(--te-text-dim)]" />
                                </span>
                                <p className="text-sm font-bold text-[var(--te-text)]">You&apos;re all caught up</p>
                                <p className="mt-1 text-xs text-[var(--te-text-dim)]">New updates will appear here.</p>
                            </div>
                        ) : (
                            notifications.filter(n => !n.read).map((notification) => (
                                <div
                                    key={notification.id}
                                    className="border-b border-[var(--te-border)] bg-[var(--te-red-soft)]/35 px-4 py-3 transition-colors last:border-0"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--te-red)]"></span>
                                        <div className="flex-1 min-w-0">
                                            <p className="mb-0.5 text-sm font-bold text-[var(--te-text)]">
                                                {notification.title}
                                            </p>
                                            <p className="mb-1 text-xs text-[var(--te-text-dim)]">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] font-semibold text-[var(--te-text-dim)] opacity-75">
                                                {formatTimestamp(notification.timestamp)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                                            className="te-icon-btn h-8 w-8 flex-shrink-0 text-[var(--te-accent)]"
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
