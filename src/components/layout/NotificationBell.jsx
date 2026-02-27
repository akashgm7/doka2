import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useSelector } from 'react-redux';
import Badge from '../ui/Badge';

const NotificationBell = () => {
    const { user } = useSelector(state => state.auth);
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    // Initial load and polling
    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            try {
                const data = await notificationService.getNotificationsForUser();
                setNotifications(data);

                // Persist unread status using localStorage
                const lastRead = localStorage.getItem(`lastReadNotif_${user._id}`) || 0;

                const count = data.filter(n => {
                    return new Date(n.sentAt).getTime() > parseInt(lastRead);
                }).length;

                setUnreadCount(count);
            } catch (error) {
                console.error("Failed to fetch notifications");
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000);
        return () => clearInterval(interval);
    }, [user]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = () => {
        if (user) {
            const now = Date.now().toString();
            localStorage.setItem(`lastReadNotif_${user._id}`, now);
            setUnreadCount(0);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="relative p-2 text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) markAsRead();
                }}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-3 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                        <h3 className="font-semibold text-sm text-neutral-900">Notifications</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-neutral-400 hover:text-neutral-600"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 text-sm">
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-50">
                                {notifications.map(notif => (
                                    <div key={notif._id} className="p-3 hover:bg-neutral-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-medium text-neutral-900 line-clamp-1">{notif.title}</h4>
                                            <span className="text-[10px] text-neutral-400 whitespace-nowrap ml-2">
                                                {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-600 line-clamp-2">{notif.message}</p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <Badge variant={notif.type === 'Automated' ? 'neutral' : 'primary'} size="sm">
                                                {notif.type}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-2 border-t border-neutral-100 bg-neutral-50 text-center">
                        <button
                            className="text-xs text-primary font-medium hover:text-primary-dark"
                            onClick={() => setIsOpen(false)}
                        >
                            View All Activity
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
