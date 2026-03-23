import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { orderService } from '../services/orderService';
import { Star, MessageSquare, User, Calendar } from 'lucide-react';
import { io } from 'socket.io-client';

const StarRating = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
            <Star
                key={n}
                size={14}
                className={n <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
            />
        ))}
    </div>
);

const ratingLabel = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Great', 5: 'Excellent' };

const FeedbackDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const [feedbackItems, setFeedbackItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Access control
    const canView = ['Brand Admin', 'Store Manager', 'Super Admin'].includes(user?.role);

    useEffect(() => {
        if (!canView) return;
        loadFeedback();

        const getSocketURL = () => {
            const apiUrl = import.meta.env.VITE_API_URL;
            if (apiUrl) return apiUrl.replace(/\/api\/?$/, '');
            return `http://${window.location.hostname}:5002`;
        };

        const socket = io(getSocketURL());
        socket.on('connect', () => console.log('[Feedback Dashboard] Socket connected'));

        socket.on('feedbackAdded', (data) => {
            console.log('[Feedback Dashboard] New feedback received:', data);
            // Append in real time if it belongs to this store/brand
            const isRelevant =
                user.role === 'Super Admin' ||
                (user.role === 'Brand Admin' && data.brandId === user.assignedBrand) ||
                (user.role === 'Store Manager' && data.storeId === user.assignedOutlets?.[0]);

            if (isRelevant) {
                setFeedbackItems((prev) => [
                    {
                        _id: data.orderId,
                        orderId: data.orderRef,
                        customerName: data.customerName,
                        feedback: data.feedback,
                    },
                    ...prev,
                ]);
            }
        });

        return () => socket.disconnect();
    }, [user]);

    const loadFeedback = async () => {
        setLoading(true);
        try {
            const orders = await orderService.getOrders(user.role, {
                brandId: user.assignedBrand,
                assignedOutlets: user.assignedOutlets,
            });
            const withFeedback = orders.filter((o) => o.feedback && o.feedback.rating);
            setFeedbackItems(withFeedback);
        } catch (err) {
            console.error('[Feedback] Failed to load:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!canView) {
        return (
            <div className="text-center py-16 text-neutral-400">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">You don't have access to view feedback.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-neutral-100 rounded-2xl" />
                ))}
            </div>
        );
    }

    if (feedbackItems.length === 0) {
        return (
            <div className="text-center py-16 text-neutral-400">
                <Star size={40} className="mx-auto mb-3 opacity-20" />
                <p className="font-semibold text-neutral-500">No feedback yet</p>
                <p className="text-sm mt-1">Customer feedback will appear here once orders are delivered.</p>
            </div>
        );
    }

    const avgRating = feedbackItems.reduce((acc, o) => acc + (o.feedback?.rating || 0), 0) / feedbackItems.length;

    return (
        <div className="space-y-5">
            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{avgRating.toFixed(1)}</p>
                    <p className="text-xs text-amber-500 font-semibold uppercase tracking-widest mt-1">Avg Rating</p>
                </div>
                <div className="bg-white border border-neutral-100 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-neutral-800">{feedbackItems.length}</p>
                    <p className="text-xs text-neutral-400 font-semibold uppercase tracking-widest mt-1">Total Reviews</p>
                </div>
                <div className="bg-white border border-neutral-100 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                        {feedbackItems.filter((o) => (o.feedback?.rating || 0) >= 4).length}
                    </p>
                    <p className="text-xs text-neutral-400 font-semibold uppercase tracking-widest mt-1">Positive (4–5 ★)</p>
                </div>
            </div>

            {/* Feedback list */}
            <div className="space-y-3">
                {feedbackItems.map((item, idx) => (
                    <div
                        key={item._id || idx}
                        className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                                    <User size={16} className="text-amber-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-neutral-800 text-sm">
                                        {item.user?.name || item.customerName || 'Customer'}
                                    </p>
                                    <p className="text-[10px] text-neutral-400 font-mono">
                                        Order #{item.orderId || String(item._id).slice(-8)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <StarRating rating={item.feedback.rating} />
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                                    {ratingLabel[item.feedback.rating]}
                                </span>
                            </div>
                        </div>

                        {item.feedback.comment && (
                            <div className="mt-3 pl-13">
                                <p className="text-sm text-neutral-600 leading-relaxed italic bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100">
                                    "{item.feedback.comment}"
                                </p>
                            </div>
                        )}

                        {item.feedback.submittedAt && (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-neutral-300">
                                <Calendar size={10} />
                                <span>{new Date(item.feedback.submittedAt).toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeedbackDashboard;
