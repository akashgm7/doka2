import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { brandService } from '../services/brandService';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import OrderDetailsModal, { StatusBadge } from '../components/orders/OrderDetailsModal';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import { Search, Filter, MapPin, AlertCircle, RefreshCw, ShoppingBag, Clock, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSocket } from '../utils/socketConfig';
import FeedbackDashboard from './FeedbackDashboard';

const OrderManagement = () => {
    const { user } = useSelector(state => state.auth);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newOrderIds, setNewOrderIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'feedback'

    const [filterStatus, setFilterStatus] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');
    const [dietaryFilter, setDietaryFilter] = useState('All');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [dateRange, setDateRange] = useState('All Time');
    const [searchTerm, setSearchTerm] = useState('');
    const dispatch = useDispatch();
    const location = useLocation();
    const [locations, setLocations] = useState([]);

    useEffect(() => { loadOrders(); }, [user, filterStatus, typeFilter, dietaryFilter, paymentMethodFilter, selectedLocation, dateRange]);
    useEffect(() => { loadLocations(); }, []);

    // Handle initial order detail view from notification link
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const orderIdFromUrl = queryParams.get('id');

        if (orderIdFromUrl && orders.length > 0) {
            const orderToOpen = orders.find(o =>
                (o.orderId === orderIdFromUrl) || (o._id === orderIdFromUrl) || (o.id === orderIdFromUrl)
            );
            if (orderToOpen) {
                setSelectedOrder(orderToOpen);
                setIsModalOpen(true);
            }
        }
    }, [location.search, orders]);

    // Socket.io for Real-time Updates
    useEffect(() => {
        const socket = getSocket();

        socket.on('connect', () => {
            console.log('Socket Connected to backend for real-time updates');
        });

        socket.on('connect_error', (error) => {
            console.error('Socket Connection Error:', error);
        });

        socket.on('new_order', (order) => {
            console.log('New live order received via socket:', order);
            const id = order.orderId || order.id || order._id;
            toast.success("New Order Placed!", {
                icon: '🛍️',
                duration: 5000
            });

            // Track as new to show indicator
            setNewOrderIds(prev => new Set(prev).add(id));

            // Refresh order list
            loadOrders();
        });

        socket.on('order_updated', (data) => {
            console.log('Order update received via socket:', data);
            // Refresh order list to show status changes or new items
            loadOrders();
        });

        return () => socket.disconnect();
    }, []);

    const loadLocations = async () => {
        try {
            const allLocations = await brandService.getLocations();
            if (user.role === 'Area Manager') {
                setLocations(allLocations.filter(l => user.assignedOutlets.includes(l.name)));
            } else if (user.role === 'Store Manager' && user.assignedOutlets?.length > 0) {
                const myOutlet = allLocations.find(l => l.name === user.assignedOutlets[0]);
                if (myOutlet) setSelectedLocation(myOutlet.id);
                setLocations([myOutlet].filter(Boolean));
            } else {
                setLocations(allLocations);
            }
        } catch (error) { console.error("Failed to load locations"); }
    };

    const loadOrders = async () => {
        setLoading(true);
        try {
            const scope = { brandId: user.brandId || user.assignedBrand, assignedOutlets: user.assignedOutlets, assignedFactory: user.assignedFactory };
            const filters = {
                locationId: selectedLocation,
                dateRange,
                status: filterStatus !== 'All' ? filterStatus : undefined,
                type: typeFilter !== 'All' ? typeFilter : undefined,
                dietary: dietaryFilter !== 'All' ? dietaryFilter : undefined,
                paymentMethod: paymentMethodFilter !== 'All' ? paymentMethodFilter : undefined
            };
            const data = await orderService.getOrders(user.role, scope, filters);
            setOrders(data);
        } catch (error) {
            toast.error("Failed to load orders");
        } finally { setLoading(false); }
    };

    const filteredOrders = useMemo(() => {
        let filtered = orders;

        // Apply Status Filter
        if (filterStatus !== 'All') {
            filtered = filtered.filter(o => o.status === filterStatus);
        }

        // Apply Search Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(o =>
                (o.orderId || o.id || o._id || '').toLowerCase().includes(lower) ||
                (o.storeName || '').toLowerCase().includes(lower) ||
                (o.user?.name || o.customerName || '').toLowerCase().includes(lower)
            );
        }

        return filtered;
    }, [orders, searchTerm, filterStatus]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        if (user.role === 'Super Admin') return;
        const toastId = toast.loading("Updating status...");
        try {
            const updatedOrder = await orderService.updateOrderStatus(orderId, newStatus);
            toast.success(`Order ${newStatus}`, { id: toastId });

            // Update the selected order so the modal reflects the change immediately
            setSelectedOrder(updatedOrder);

            // Refresh order list in background
            loadOrders();
            return updatedOrder;
        } catch (error) { toast.error(error.message, { id: toastId }); }
    };

    const handleCancelOrder = async (orderId, reason) => {
        const toastId = toast.loading("Cancelling order...");
        try {
            await orderService.cancelOrder(orderId, reason);
            toast.success("Order cancelled", { id: toastId });
            setIsModalOpen(false);
            loadOrders();
        } catch (error) { toast.error(error.message, { id: toastId }); }
    };

    const isDelayed = (order) => {
        const orderTime = new Date(order.date || order.createdAt).getTime();
        const diffInMinutes = (Date.now() - orderTime) / (1000 * 60);
        if (order.status === 'PENDING' && diffInMinutes > 30) return true;
        if (order.status === 'IN_PRODUCTION' && diffInMinutes > 120) return true;
        return false;
    };

    const isNewArrival = (row) => {
        if (row.status !== 'PENDING') return false;
        const id = row.orderId || row.id || row._id;
        if (newOrderIds.has(id)) return true;
        // Also consider orders created in the last 5 minutes as "new" for visual persistence
        const created = new Date(row.createdAt || row.date).getTime();
        return (Date.now() - created) < 5 * 60 * 1000;
    };

    const columns = [
        {
            header: 'Order',
            render: (row) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-800">{row.orderId || row.id || row._id}</span>
                        {isDelayed(row) && <span title="Delayed" className="text-red-500 animate-pulse"><AlertCircle size={14} /></span>}
                        {isNewArrival(row) && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary text-white animate-pulse">NEW</span>
                        )}
                    </div>
                    {row.isMMC && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-violet-100 text-violet-700 w-fit ring-1 ring-violet-200/50">MMC</span>
                    )}
                </div>
            )
        },
        {
            header: 'Customer',
            render: (row) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary">{(row.user?.name || row.customerName || 'G').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{row.user?.name || row.customerName || 'Guest'}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{row.user?.email || ''}</p>
                    </div>
                </div>
            )
        },
        {
            header: 'Date',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">{new Date(row.createdAt || row.date).toLocaleDateString()}</span>
                    {isNewArrival(row) && (
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    )}
                </div>
            )
        },
        {
            header: 'Store',
            render: (row) => (
                <div>
                    <p className="text-sm font-medium text-neutral-800">{row.storeName || 'N/A'}</p>
                    {(user.role === 'Super Admin' || row.isMMC) && (
                        <p className="text-[11px] text-neutral-400 mt-0.5">{row.isMMC ? 'Factory' : row.brandId}</p>
                    )}
                </div>
            )
        },
        { header: 'Items', render: (row) => <span className="text-sm font-semibold text-neutral-700">{row.orderItems?.length || row.items?.length || 0}</span> },
        { header: 'Amount', render: (row) => <span className="text-sm font-bold text-neutral-800">${(row.totalPrice || row.totalAmount || 0).toLocaleString()}</span> },
        { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
        {
            header: 'Last Modified',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-neutral-700">{row.modifiedBy || 'System'}</span>
                    <span className="text-[10px] text-neutral-400">{row.modifiedDate ? new Date(row.modifiedDate).toLocaleString() : 'N/A'}</span>
                </div>
            )
        },
        {
            header: '',
            render: (row) => (
                <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedOrder(row); setIsModalOpen(true); }}>View</Button>
            )
        }
    ];

    const pendingCount = filteredOrders.filter(o => o.status === 'PENDING').length;
    const activeCount = filteredOrders.filter(o => ['IN_PRODUCTION', 'CONFIRMED', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status)).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="page-title">Order Management</h1>
                    <p className="page-subtitle">Track and monitor orders across all locations</p>
                </div>
                <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => { toast.loading("Refreshing..."); loadOrders().then(() => toast.dismiss()); }}>
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 animate-stagger">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary-50 text-primary rounded-xl"><ShoppingBag size={18} /></div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total</p>
                            <p className="text-xl font-bold text-neutral-900">{filteredOrders.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Pending</p>
                            <p className="text-xl font-bold text-neutral-900">{pendingCount}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><PackageCheck size={18} /></div>
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Active</p>
                            <p className="text-xl font-bold text-neutral-900">{activeCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100/50 rounded-2xl w-fit border border-neutral-200/50">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders'
                        ? 'bg-white text-neutral-800 shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-600'
                        }`}
                >
                    Orders
                </button>
                {['Brand Admin', 'Store Manager', 'Super Admin'].includes(user?.role) && (
                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'feedback'
                            ? 'bg-white text-neutral-800 shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-600'
                            }`}
                    >
                        Feedback
                    </button>
                )}
            </div>

            {activeTab === 'orders' ? (
                <>
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-soft flex flex-wrap gap-3 items-center">
                        {(user.role === 'Super Admin' || user.role === 'Brand Admin' || user.role === 'Area Manager') && (
                            <div className="relative min-w-[200px]">
                                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
                                <select className="w-full pl-10 pr-4 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none cursor-pointer" value={selectedLocation || ''} onChange={(e) => setSelectedLocation(e.target.value || null)}>
                                    <option value="">All Locations</option>
                                    {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                                </select>
                            </div>
                        )}
                        {user.role === 'Store Manager' && user.assignedOutlets?.length > 0 && (
                            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-600 font-medium">
                                <MapPin size={15} /> {user.assignedOutlets[0]}
                            </div>
                        )}
                        {user.role === 'Factory User' && (
                            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-700 font-medium">
                                <MapPin size={15} /> {user.assignedFactory}
                                <span className="px-1.5 py-0.5 bg-primary-100 rounded-md text-[10px] font-bold">MMC</span>
                            </div>
                        )}
                        <div className="hidden sm:block h-8 w-px bg-neutral-200" />
                        <DateRangeFilter value={dateRange} onChange={setDateRange} />
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-card border border-neutral-100/80 overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-center gap-3 p-5 border-b border-neutral-100">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                                <input type="text" placeholder="Search orders..." className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary hover:border-neutral-300 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                <Filter size={15} className="text-neutral-400 shrink-0" />
                                <select className="border border-neutral-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-primary w-full sm:w-auto text-sm font-medium cursor-pointer" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                                    <option value="All">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="IN_PRODUCTION">In Production</option>
                                    <option value="READY">Ready</option>
                                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>

                                <select className="border border-neutral-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-primary w-full sm:w-auto text-sm font-medium cursor-pointer" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                    <option value="All">All Types</option>
                                    <option value="Standard">Standard</option>
                                    <option value="MMC">MMC (Factory)</option>
                                </select>

                                <select className="border border-neutral-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-primary w-full sm:w-auto text-sm font-medium cursor-pointer" value={dietaryFilter} onChange={(e) => setDietaryFilter(e.target.value)}>
                                    <option value="All">All Dietary</option>
                                    <option value="Eggless">Eggless</option>
                                    <option value="Egg">With Egg</option>
                                    <option value="N/A">N/A</option>
                                </select>
                                <select className="border border-neutral-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-primary w-full sm:w-auto text-sm font-medium cursor-pointer" value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)}>
                                    <option value="All">All Methods</option>
                                    <option value="Razorpay">Razorpay</option>
                                    <option value="COD">COD</option>
                                </select>
                            </div>
                        </div>
                        <Table columns={columns} data={filteredOrders} isLoading={loading} emptyMessage="No orders found matching filters." onRowClick={(row) => { setSelectedOrder(row); setIsModalOpen(true); }} />
                    </div>
                </>
            ) : (
                <FeedbackDashboard />
            )}

            <OrderDetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} order={selectedOrder} userRole={user.role} onUpdateStatus={handleUpdateStatus} onCancelOrder={handleCancelOrder} />
        </div>
    );
};

export default OrderManagement;
