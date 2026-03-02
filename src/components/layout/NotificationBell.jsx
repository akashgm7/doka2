import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, ExternalLink } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Badge from '../ui/Badge';

const NotificationBell = () => {
    const { user } = useSelector(state => state.auth);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    // Initial load and polling fallback
    useEffect(() => {
        if (!user) return;

        const fetchNotifications = async () => {
            try {
                const data = await notificationService.getNotificationsForUser();
                setNotifications(data);

                const lastRead = localStorage.getItem(`lastReadNotif_${user._id}`) || 0;
                const count = data.filter(n => new Date(n.sentAt).getTime() > parseInt(lastRead)).length;
                setUnreadCount(count);
            } catch (error) {
                console.error("Failed to fetch notifications");
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Less frequent polling when socket is active
        return () => clearInterval(interval);
    }, [user]);

    // Socket.io for Real-time Notifications
    useEffect(() => {
        if (!user) return;

        const socket = io(`http://${window.location.hostname}:5002`);

        socket.on('new_notification', (notif) => {
            console.log('Real-time notification received:', notif);

            // Client-side filtering logic matching notificationController.js
            let shouldShow = false;

            if (user.role === 'Super Admin') {
                shouldShow = notif.target === 'All Users' || notif.target === 'Staff';
            } else if (user.role === 'Brand Admin') {
                shouldShow = (notif.target === 'Brand Staff' || notif.target === 'Staff') &&
                    (notif.brandId === user.assignedBrand || notif.brandId === user.brandId);
            } else if (['Store Manager', 'Area Manager', 'Store User'].includes(user.role)) {
                const isCorrectTarget = notif.target === 'Store Manager' || notif.target === 'Staff';
                const isCorrectBrand = notif.brandId === (user.assignedBrand || user.brandId || 'brand-001');

                if (isCorrectTarget && isCorrectBrand) {
                    if (!notif.storeId) {
                        shouldShow = true;
                    } else if (user.assignedOutlets?.includes(notif.storeId)) {
                        shouldShow = true;
                    }
                }
            }

            if (shouldShow) {
                setNotifications(prev => [notif, ...prev]);
                setUnreadCount(prev => prev + 1);
            }
        });

        return () => socket.disconnect();
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

    const handleViewOrder = (orderId) => {
        setIsOpen(false);
        navigate(`/orders?id=${orderId}`);
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
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-neutral-400 hover:text-neutral-600"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 text-sm">
                                No notifications yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-50">
                                {notifications.map(notif => (
                                    <div key={notif._id || Math.random()} className="p-3 hover:bg-neutral-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-medium text-neutral-900 line-clamp-1">{notif.title}</h4>
                                            <span className="text-[10px] text-neutral-400 whitespace-nowrap ml-2">
                                                {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-600 mb-2">{notif.message}</p>
                                        <div className="flex items-center justify-between">
                                            <Badge variant={notif.type === 'Automated' ? 'neutral' : 'primary'} size="sm">
                                                {notif.type}
                                            </Badge>

                                            {notif.orderId && (
                                                <button
                                                    onClick={() => handleViewOrder(notif.orderId)}
                                                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors"
                                                >
                                                    View Order <ExternalLink size={12} />
                                                </button>
                                            )}
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
