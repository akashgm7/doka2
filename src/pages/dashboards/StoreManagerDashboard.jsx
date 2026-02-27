import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingBag, DollarSign, Clock, CheckCircle, Package, Power, TrendingUp, BarChart2, AlertCircle, Activity } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DateRangeFilter from '../../components/dashboard/DateRangeFilter';
import { dashboardService } from '../../services/dashboardService';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-depth border border-neutral-100">
            <p className="text-xs font-semibold text-neutral-500 mb-1">{label}</p>
            {payload.map((entry, i) => (
                <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>{entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</p>
            ))}
        </div>
    );
};

const StoreManagerDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [storeStatus, setStoreStatus] = useState('Closed');
    const [statusLoading, setStatusLoading] = useState(false);
    const [dateRange, setDateRange] = useState('Today');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await dashboardService.getDashboardStats('Store Manager', undefined, dateRange);
                setStats(data);
                setStoreStatus(data.status || 'Open');
            } catch (error) {
                console.error("Failed to fetch store dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [dateRange]);

    const handleToggleStatus = async () => {
        setStatusLoading(true);
        try {
            const newStatus = storeStatus === 'Open' ? 'Closed' : 'Open';
            await dashboardService.updateStoreStatus(newStatus);
            setStoreStatus(newStatus);
            toast.success(`Store is now ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setStatusLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                <Activity className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-neutral-400 font-medium">Loading store data...</span>
        </div>
    );

    const statusCards = [
        { title: 'Pending', value: stats?.orderBreakdown?.pending || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200/50' },
        { title: 'Preparing', value: stats?.orderBreakdown?.preparing || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200/50' },
        { title: 'Ready', value: stats?.orderBreakdown?.ready || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200/50' },
        { title: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'text-neutral-600', bg: 'bg-neutral-50', ring: 'ring-neutral-200/50' },
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="page-title">Store Dashboard</h1>
                    <p className="page-subtitle">
                        Outlet: <span className="font-semibold text-primary">{user?.assignedOutlets?.[0] || 'Primary Outlet'}</span>
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <DateRangeFilter value={dateRange} onChange={setDateRange} />
                    <div className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold ring-1 ${storeStatus === 'Open' ? 'bg-emerald-50 ring-emerald-200 text-emerald-700' : 'bg-red-50 ring-red-200 text-red-700'}`}>
                        <span className={`w-2 h-2 rounded-full ${storeStatus === 'Open' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        {storeStatus}
                    </div>
                    <Button
                        variant={storeStatus === 'Open' ? 'secondary' : 'success'}
                        onClick={handleToggleStatus}
                        isLoading={statusLoading}
                        icon={Power}
                        size="sm"
                    >
                        {storeStatus === 'Open' ? 'Close Store' : 'Open Store'}
                    </Button>
                </div>
            </div>

            {/* Performance Hero */}
            <div className="bg-gradient-to-br from-primary via-primary-700 to-primary-800 rounded-2xl p-7 text-white shadow-depth-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-7">
                        <div>
                            <h2 className="text-lg font-bold text-white/90">Store Performance</h2>
                            <p className="text-sm text-white/60">{dateRange} Overview</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                            { label: 'Revenue', value: `$${stats?.revenue?.toLocaleString() || '0'}`, icon: TrendingUp },
                            { label: 'Orders', value: stats?.totalOrders || 0, icon: ShoppingBag },
                            { label: 'Avg Order', value: `$${stats?.avgOrderValue?.toFixed(0) || '0'}`, icon: BarChart2 },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                    <item.icon size={22} />
                                </div>
                                <div>
                                    <p className="text-[11px] uppercase tracking-widest font-semibold text-white/50">{item.label}</p>
                                    <p className="text-2xl font-bold">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
                {statusCards.map((card) => (
                    <Card key={card.title} className={`${card.bg} ring-1 ${card.ring} border-0`}>
                        <div className="flex items-center gap-3 mb-3">
                            <card.icon size={18} className={card.color} />
                            <span className={`text-sm font-semibold ${card.color}`}>{card.title}</span>
                        </div>
                        <span className="text-3xl font-bold text-neutral-900">{card.value}</span>
                    </Card>
                ))}
            </div>

            {/* Chart + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2" title="Weekly Sales Trend">
                    <div className="h-72 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.revenueTrend || []}>
                                <defs>
                                    <linearGradient id="colorStoreSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStoreSales)" dot={{ fill: '#4F46E5', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Notifications">
                    <div className="space-y-3 mt-2">
                        {stats?.pendingActions?.map((action, i) => (
                            <div key={i} className={`p-3 rounded-xl border flex items-start gap-3 ${action.severity === 'high' ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'}`}>
                                <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${action.severity === 'high' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                <div>
                                    <p className="text-sm font-medium text-neutral-800">{action.message}</p>
                                    <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">{action.type}</span>
                                </div>
                            </div>
                        ))}
                        {(!stats?.pendingActions || stats.pendingActions.length === 0) && (
                            <div className="text-center py-8">
                                <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                                <p className="text-sm text-neutral-400 font-medium">All clear — no urgent alerts</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card title="Recent Store Activity">
                <div className="overflow-x-auto mt-2">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-100">
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Order</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Customer</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {stats?.recentOrders?.map((order) => (
                                <tr key={order.orderNumber || order.id} className="hover:bg-primary-50/20 transition-colors">
                                    <td className="px-4 py-3 font-semibold text-neutral-800">#{order.orderNumber || order.id?.slice(-6)}</td>
                                    <td className="px-4 py-3 text-neutral-600">{order.customerName || order.customer}</td>
                                    <td className="px-4 py-3 font-semibold text-neutral-800">${order.totalAmount || order.total}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ring-1 ${order.status === 'Pending' ? 'bg-amber-50 text-amber-700 ring-amber-200/50' :
                                            order.status === 'Preparing' ? 'bg-blue-50 text-blue-700 ring-blue-200/50' :
                                                'bg-emerald-50 text-emerald-700 ring-emerald-200/50'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'Pending' ? 'bg-amber-500' :
                                                order.status === 'Preparing' ? 'bg-blue-500' :
                                                    'bg-emerald-500'
                                                }`} />
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-neutral-400 text-xs">{order.time || new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                </tr>
                            ))}
                            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                                <tr><td colSpan="5" className="text-center py-10 text-neutral-400">No recent orders</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default StoreManagerDashboard;
