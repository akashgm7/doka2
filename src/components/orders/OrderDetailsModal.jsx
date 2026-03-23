import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Package, CheckCircle, XCircle, Play, Truck, Check, DollarSign, MapPin, Navigation, AlertCircle, AlertTriangle, Megaphone } from 'lucide-react';
import { deliveryService } from '../../services/deliveryService';
import { getSocket } from '../../utils/socketConfig';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
    const colors = {
        'PENDING': 'bg-yellow-100 text-yellow-800',
        'CONFIRMED': 'bg-blue-100 text-blue-800',
        'IN_PRODUCTION': 'bg-purple-100 text-purple-800',
        'READY': 'bg-indigo-100 text-indigo-800',
        'OUT_FOR_DELIVERY': 'bg-orange-100 text-orange-800',
        'DELIVERED': 'bg-green-100 text-green-800',
        'CANCELLED': 'bg-red-100 text-red-800',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
            {status}
        </span>
    );
};

const OrderDetailsModal = ({ isOpen, onClose, order, onUpdateStatus, onCancelOrder, userRole }) => {
    const [delivery, setDelivery] = useState(null);
    const [loadingDelivery, setLoadingDelivery] = useState(false);
    const [internalNotes, setInternalNotes] = useState('');
    const [currentOrder, setCurrentOrder] = useState(order); // Local state for immediate updates
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && order) {
            fetchDeliveryInfo();
            setInternalNotes(order.internalNotes || '');
            setCurrentOrder(order); // Sync with prop when order changes

            // Direct Socket Listener for real-time tracking
            const socket = getSocket();
            const orderId = order._id || order.id;

            const handleOrderUpdate = (data) => {
                if (data.id === orderId || data.orderId === orderId) {
                    console.log('[Socket] Real-time modal update received:', data);
                    // Update state with new fields if present in updates (from server.js) 
                    // or full status (from orderController.js)
                    setCurrentOrder(prev => {
                        const newStatus = data.status || (data.updates && data.updates.status);
                        if (newStatus && newStatus !== prev.status) {
                            toast.success(`Order Status Updated: ${newStatus}`, { icon: '🔔' });
                            return { ...prev, status: newStatus, ...data.updates };
                        }
                        return { ...prev, ...data.updates };
                    });
                }
            };

            socket.on('order_updated', handleOrderUpdate);
            socket.on('orderStatusUpdated', handleOrderUpdate);

            return () => {
                socket.off('order_updated', handleOrderUpdate);
                socket.off('orderStatusUpdated', handleOrderUpdate);
            };
        } else {
            setDelivery(null);
            setInternalNotes('');
        }
    }, [isOpen, order]);

    const displayOrder = currentOrder || order;

    if (!displayOrder) return null;

    const getOrderId = () => {
        const id = displayOrder._id || displayOrder.id || (typeof displayOrder === 'string' ? displayOrder : null);
        console.log('[DEBUG] getOrderId:', id, 'from:', displayOrder);
        return id;
    };

    const fetchDeliveryInfo = async () => {
        setLoadingDelivery(true);
        try {
            const orderId = getOrderId();
            if (!orderId) return;
            const data = await deliveryService.getDeliveryDetails(orderId);
            setDelivery(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDelivery(false);
        }
    };

    const handleAssignDriver = async () => {
        try {
            const newDelivery = await deliveryService.assignDriver(getOrderId());
            setDelivery(newDelivery);
            toast.success("Driver assigned successfully");
        } catch (error) {
            toast.error("Failed to assign driver");
        }
    };

    const handleSimulateWebhook = async (status) => {
        try {
            const updated = await deliveryService.simulateWebhook(getOrderId(), status);
            setDelivery(updated);

            // Sync with main order status if applicable
            if (status === 'DELIVERED') {
                onUpdateStatus(displayOrder.id, 'Delivered');
            }
            toast.success(`Webhook: ${status} Received`);
        } catch (error) {
            toast.error("Simulation failed");
        }
    };

    const handleEscalate = async () => {
        const reason = window.prompt("Reason for escalation:");
        if (!reason) return;

        const toastId = toast.loading("Escalating order...");
        try {
            await orderService.updateOrderStatus(getOrderId(), displayOrder.status, { isEscalated: true, escalationReason: reason });
            toast.success("Order escalated to Area Manager", { id: toastId });
            onClose();
        } catch (error) {
            toast.error("Failed to escalate", { id: toastId });
        }
    };

    const handleSendUpdate = async () => {
        const templates = [
            "Order is slightly delayed due to high demand.",
            "Items are ready for pickup!",
            "Substitution required for one of the items.",
            "Order successfully handed over to rider."
        ];

        const selection = window.prompt(
            "Select a template (1-4):\n" +
            templates.map((t, i) => `${i + 1}. ${t}`).join('\n')
        );

        if (selection && templates[selection - 1]) {
            toast.success(`Notification sent: "${templates[selection - 1]}"`);
        }
    };

    const handleSaveInternalNotes = async () => {
        const toastId = toast.loading("Saving notes...");
        try {
            await orderService.updateOrderInternalNotes(getOrderId(), internalNotes);
            toast.success("Internal notes saved!", { id: toastId });
        } catch (error) {
            console.error("Failed to save internal notes:", error);
            toast.error("Failed to save notes.", { id: toastId });
        }
    };

    const handleStatusUpdate = async (status) => {
        if (isProcessing) return;
        
        const id = getOrderId();
        console.log('[DEBUG] handleStatusUpdate initiating:', { id, status });
        
        setIsProcessing(true);
        try {
            if (onUpdateStatus && id) {
                const updatedOrder = await onUpdateStatus(id, status);
                if (updatedOrder) {
                    setCurrentOrder(updatedOrder);
                }
            }
        } catch (error) {
            console.error("Status update failed", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const Actions = () => {
        const STATUS_FLOW = ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

        // Aliases for mapping legacy or dashboard-level statuses
        const statusMap = {
            'PREPARING': 'IN_PRODUCTION',
            'PREPARATION': 'IN_PRODUCTION',
            'BAKING': 'IN_PRODUCTION',
            'PICKUP_READY': 'READY'
        };

        const currentStatusRaw = displayOrder.status?.toUpperCase();
        const normalizedStatus = statusMap[currentStatusRaw] || currentStatusRaw;
        
        const currentIndex = STATUS_FLOW.indexOf(normalizedStatus);
        
        // Determination of next logical status
        let nextStatus = currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIndex + 1] : null;

        // Specialized logic for Delivery Mode
        if (normalizedStatus === 'READY' && displayOrder.deliveryMode === 'Pickup') {
            nextStatus = 'DELIVERED';
        }

        const canProgress = ['Brand Admin', 'Store Manager', 'Area Manager', 'Factory User', 'Factory Manager'].includes(userRole);
        const canCancel = ['PENDING', 'CONFIRMED'].includes(normalizedStatus);

        return (
            <div className="flex gap-2 items-center w-full">
                {nextStatus && canProgress && (
                    <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStatusUpdate(nextStatus)}
                        isLoading={isProcessing}
                    >
                        Next Process: {nextStatus}
                    </Button>
                )}

                <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="ghost" icon={Megaphone} onClick={handleSendUpdate}>
                        Notify
                    </Button>
                    <Button size="sm" variant="secondary" icon={AlertTriangle} onClick={handleEscalate}>
                        Escalate
                    </Button>
                    {canCancel && canProgress && (
                        <Button size="sm" variant="danger" icon={XCircle} onClick={() => {
                            const reason = window.prompt("Enter cancellation reason:");
                            if (reason) {
                                if (onCancelOrder) onCancelOrder(getOrderId(), reason);
                                else handleStatusUpdate('CANCELLED');
                            }
                        }}>Cancel</Button>
                    )}
                </div>
            </div>
        );
    };

    const calculateTotal = () => {
        const items = displayOrder.orderItems || displayOrder.items || [];
        return items.reduce((acc, item) => acc + ((item.price || 0) * (item.qty || item.quantity || 0)), 0);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Order #${displayOrder.orderId || displayOrder.id || displayOrder._id}`}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="text-neutral-400" size={20} />
                        <h3 className="text-lg font-semibold text-neutral-900">Order Status</h3>
                    </div>
                    <StatusBadge status={displayOrder.status} />
                </div>

                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-lg text-sm">
                    <div>
                        <p className="text-neutral-500">Store</p>
                        <p className="font-medium text-neutral-900">{displayOrder.storeName}</p>
                    </div>
                    <div>
                        <p className="text-neutral-500">Customer</p>
                        <p className="font-medium text-neutral-900">{displayOrder.user?.name || 'Guest'}</p>
                        <p className="text-[10px] text-neutral-500">{displayOrder.user?.email || ''}</p>
                    </div>
                    <div>
                        <p className="text-neutral-500">Brand ID</p>
                        <p className="font-medium text-neutral-900">{displayOrder.brandId || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-neutral-500">Date</p>
                        <p className="font-medium text-neutral-900">
                            {displayOrder.createdAt || displayOrder.date
                                ? new Date(displayOrder.createdAt || displayOrder.date).toLocaleString()
                                : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-neutral-500">Delivery Mode</p>
                        <p className="font-medium text-neutral-900">{displayOrder.deliveryMode || 'Standard'}</p>
                    </div>
                    {displayOrder.loyaltyPoints && (
                        <div className="col-span-2 sm:col-span-1">
                            <p className="text-neutral-500">Loyalty Points</p>
                            <div className="flex gap-2 text-sm">
                                <span className="text-green-600 font-medium">Earned: {displayOrder.loyaltyPoints.earned || 0}</span>
                                <span className="text-blue-600 font-medium">Redeemed: {displayOrder.loyaltyPoints.redeemed || 0}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Custom Notes */}
                {displayOrder.notes && (
                    <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg flex gap-2 items-start shrink-0">
                        <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={16} />
                        <div>
                            <p className="text-[10px] uppercase font-bold text-yellow-700 tracking-wider">Customer Instructions</p>
                            <p className="text-sm text-yellow-900 leading-relaxed font-medium mt-0.5">{displayOrder.notes}</p>
                        </div>
                    </div>
                )}

                {/* MMC Specific Configuration */}
                {order.isMMC && (() => {
                    const mmcItem = (order.orderItems || order.items || []).find(item => item.isMMC || item.customization);
                    const mmcConfig = mmcItem?.customization || order.mmcConfig || {};
                    return (
                        <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg">
                            <h4 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                                <Package size={16} /> MMC Custom Selections
                            </h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div className="flex justify-between border-b border-purple-100/50 py-1">
                                    <span className="text-purple-700/70">Shape:</span>
                                    <span className="font-semibold text-purple-900 capitalize">{mmcConfig.shape || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b border-purple-100/50 py-1">
                                    <span className="text-purple-700/70">Flavour:</span>
                                    <span className="font-semibold text-purple-900 capitalize">{mmcConfig.flavour || mmcConfig.flavor || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b border-purple-100/50 py-1">
                                    <span className="text-purple-700/70">Size:</span>
                                    <span className="font-semibold text-purple-900 capitalize">{mmcConfig.size || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between border-b border-purple-100/50 py-1">
                                    <span className="text-purple-700/70">Design/Tiers:</span>
                                    <span className="font-semibold text-purple-900 capitalize">{mmcConfig.design || mmcConfig.tiers || 'Standard'}</span>
                                </div>
                                <div className="col-span-2 pt-2">
                                    <p className="text-xs font-bold text-purple-700 uppercase mb-1">Cake Message:</p>
                                    <p className="p-2 bg-white rounded border border-purple-100 italic">
                                        "{mmcConfig.message || 'No message provided'}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Internal Production Notes (Factory User only) */}
                {userRole === 'Factory User' && (
                    <div className="bg-neutral-50 border border-neutral-200 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Internal Production Remarks</p>
                            <button
                                onClick={handleSaveInternalNotes}
                                className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors bg-white px-2 py-0.5 rounded border border-neutral-200"
                            >
                                SAVE NOTES
                            </button>
                        </div>
                        <textarea
                            className="w-full text-sm bg-white border border-neutral-200 rounded p-2 h-20 outline-none focus:border-primary"
                            placeholder="Add production notes here..."
                            value={internalNotes}
                            onChange={(e) => setInternalNotes(e.target.value)}
                        />
                    </div>
                )}

                {/* Status & Timeline */}
                <div className="space-y-4 border-b border-neutral-100 pb-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-neutral-700">Current Status</span>
                        <StatusBadge status={order.status} />
                    </div>

                    {/* Order Timeline */}
                    <div className="relative flex items-center justify-between mt-2 px-2">
                        {['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'].map((step, index) => {
                            const steps = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
                            const labels = {
                                'PENDING': 'Pending',
                                'CONFIRMED': 'Confirmed',
                                'IN_PRODUCTION': 'Production',
                                'READY': 'Ready',
                                'OUT_FOR_DELIVERY': 'Delivery',
                                'DELIVERED': 'Delivered'
                            };

                            const currentStatusRaw = displayOrder.status?.toUpperCase();
                            const statusMap = { 'PREPARING': 'IN_PRODUCTION', 'PICKUP_READY': 'READY' };
                            const normalizedCurrent = statusMap[currentStatusRaw] || currentStatusRaw;
                            
                            const currentIdx = steps.indexOf(normalizedCurrent);
                            const stepIdx = steps.indexOf(step);
                            const isCompleted = stepIdx <= currentIdx;
                            const isCurrent = stepIdx === currentIdx;

                            return (
                                <div key={step} className="flex flex-col items-center relative z-10 w-full">
                                    <div className={`w-3 h-3 rounded-full mb-1 border-2 transition-all duration-500 ${isCompleted ? 'bg-primary border-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white border-neutral-200'
                                        } ${isCurrent ? 'ring-4 ring-primary/20 scale-125 animate-live-pulse' : ''}`} />
                                    <span className={`text-[10px] uppercase font-bold tracking-tight transition-colors duration-300 ${isCompleted ? 'text-primary' : 'text-neutral-400'
                                        }`}>{labels[step]}</span>

                                    {/* Connector Line */}
                                    {index < steps.length - 1 && (
                                        <div className={`absolute top-1.5 left-[50%] w-full h-[2px] -z-10 ${stepIdx < currentIdx ? 'bg-primary' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {order.status === 'CANCELLED' && (
                        <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                            <span className="font-bold">Cancelled:</span> {order.cancellationReason || 'No reason provided'}
                        </div>
                    )}
                </div>

                {/* Delivery Tracker Section */}
                {(delivery || (order.status?.toUpperCase() !== 'CANCELLED' && (order.status?.toUpperCase() === 'READY' || order.status?.toUpperCase() === 'DELIVERED'))) && (
                    <div className="border border-blue-100 bg-blue-50/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <Truck size={16} /> Delivery Tracking
                        </h4>

                        {!delivery ? (
                            <p className="text-sm text-blue-600 italic">No tracking information yet.</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <div>
                                        <p className="text-neutral-500">Tracking ID</p>
                                        <p className="font-medium">{delivery.trackingId}</p>
                                    </div>
                                    <div>
                                        <p className="text-neutral-500">Rider</p>
                                        <p className="font-medium">{delivery.rider?.name}</p>
                                        <p className="text-xs text-neutral-500">{delivery.rider?.vehicle}</p>
                                    </div>
                                </div>

                                {/* Delivery History Timeline */}
                                <div className="space-y-2">
                                    {delivery.history?.slice().reverse().map((event, idx) => (
                                        <div key={idx} className="flex gap-3 text-sm">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2 h-2 rounded-full mt-1.5 ${idx === 0 ? 'bg-blue-600' : 'bg-neutral-300'}`}></div>
                                                {idx !== delivery.history.length - 1 && <div className="w-0.5 h-full bg-neutral-200 my-0.5"></div>}
                                            </div>
                                            <div className="pb-2">
                                                <p className={`font-medium ${idx === 0 ? 'text-neutral-900' : 'text-neutral-500'}`}>{event.note}</p>
                                                <p className="text-xs text-neutral-400">{new Date(event.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Dev Simulation Tools */}
                                <div className="pt-3 border-t border-blue-100 mt-2">
                                    <p className="text-xs font-mono text-neutral-400 mb-2 uppercase tracking-wider">Dev: Simulate Webhook</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => handleSimulateWebhook('PICKED_UP')}
                                            className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs hover:bg-neutral-50"
                                            disabled={delivery.status === 'PICKED_UP' || delivery.status === 'DELIVERED'}
                                        >
                                            Picked Up
                                        </button>
                                        <button
                                            onClick={() => handleSimulateWebhook('DELIVERED')}
                                            className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs hover:bg-neutral-50"
                                            disabled={delivery.status === 'DELIVERED'}
                                        >
                                            Delivered
                                        </button>
                                        <button
                                            onClick={() => handleSimulateWebhook('CANCELLED')}
                                            className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs hover:bg-neutral-50 text-red-600"
                                        >
                                            Cancelled
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Items List */}
                <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">Order Items</h4>
                    <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase">Item</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase">Price</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase">Qty</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-neutral-500 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                                {(order.orderItems || order.items || []).map((item, idx) => (
                                    <tr key={item._id || idx}>
                                        <td className="px-4 py-3 text-sm text-neutral-900">
                                            <div className="flex items-center gap-3">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-neutral-100 border border-neutral-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary border border-primary-100">
                                                        <Package size={18} />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-semibold text-neutral-800">{item.name}</div>
                                                    {item.customization && !order.isMMC && (
                                                        <div className="text-[11px] text-neutral-500 font-medium tracking-wide mt-0.5">
                                                            {Object.entries(item.customization).map(([k, v]) => v ? `${k}: ${v}` : '').filter(Boolean).join(' • ')}
                                                        </div>
                                                    )}
                                                    {!item.customization && !order.isMMC && (item.size || item.weight) && (
                                                        <div className="text-[11px] text-neutral-500 font-medium tracking-wide mt-0.5">
                                                            {[item.size, item.weight, item.flavor].filter(Boolean).join(' • ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-neutral-600 text-right">₹{item.price || 0}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-neutral-900 text-right">x{item.qty || item.quantity}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-primary text-right">
                                            ₹{((item.price || 0) * (item.qty || item.quantity)).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-neutral-50">
                                    <td colSpan="3" className="px-4 py-2 text-sm font-bold text-neutral-900 text-right">Total Amount</td>
                                    <td className="px-4 py-2 text-sm font-bold text-neutral-900 text-right">
                                        ₹{(order.totalPrice || order.totalAmount) ? (order.totalPrice || order.totalAmount).toLocaleString() : calculateTotal().toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                    <Button variant="ghost" onClick={onClose}>Close</Button>
                    <Actions />
                </div>
            </div>
        </Modal>
    );
};

export default OrderDetailsModal;
export { StatusBadge };
