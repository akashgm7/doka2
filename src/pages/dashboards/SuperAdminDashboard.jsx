import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { Users, Store, Factory, Activity, DollarSign, ShoppingBag, Truck, Server, ClipboardList, Shield, TrendingUp, ArrowUpRight } from 'lucide-react';
import DateRangeFilter from '../../components/dashboard/DateRangeFilter';
import { dashboardService } from '../../services/dashboardService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';

const COLORS = ['#4F46E5', '#06B6D4', '#F59E0B', '#EF4444'];

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

const SuperAdminDashboard = () => {
    const getTodayStr = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const [stats, setStats] = useState(null);
    const [dateRange, setDateRange] = useState('This Week');
    const [customDates, setCustomDates] = useState({
        startDate: getTodayStr(),
        endDate: getTodayStr()
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loading, setLoading] = useState(true); // Added loading state
    const isFiltered = dateRange !== 'Today' && dateRange !== 'All Time';
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            if ((dateRange === 'Custom Date' || dateRange === 'Date Range') && !customDates.startDate) return;

            setIsRefreshing(true);
            try {
                const scope = {}; // Keep scope for Super Admin
                const apiRange = dateRange === 'Custom Date' || dateRange === 'Date Range' ? 'Custom' : dateRange;
                const data = await dashboardService.getDashboardStats('Super Admin', scope, apiRange, customDates); // Keep Super Admin scope
                setStats(data);
                if (loading) setLoading(false);
            } catch (error) {
                console.error(error);
                // Removed toast.error and setStoreStatus as they are not for SuperAdminDashboard
            } finally {
                setIsRefreshing(false);
            }
        };
        fetchStats();
    }, [dateRange, customDates, loading]); // Added loading to dependencies

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                <Activity className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-neutral-400 font-medium">Loading dashboard...</span>
        </div>
    );

    const quickActions = [
        { title: 'User Management', desc: 'Manage users & access', path: '/users', icon: Users, color: 'bg-violet-50 text-violet-600', hoverColor: 'hover:border-violet-200' },
        { title: 'Roles & Permissions', desc: 'Configure system roles', path: '/roles', icon: Shield, color: 'bg-primary-50 text-primary-600', hoverColor: 'hover:border-primary-200' },
        { title: 'Menu Management', desc: 'Products & availability', path: '/menu', icon: ClipboardList, color: 'bg-cyan-50 text-cyan-600', hoverColor: 'hover:border-cyan-200' },
    ];

    const statCards = [
        { title: isFiltered ? "Period Orders" : "Total Orders", value: stats?.totalOrders?.toLocaleString() || '0', icon: ShoppingBag, color: 'bg-primary-50 text-primary', trend: stats?.totalOrders > 0 ? 'Live' : null },
        { title: isFiltered ? "Period Revenue" : "Total Revenue", value: `₹${stats?.revenue?.toLocaleString() || '0'}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', trend: stats?.revenue > 0 ? 'Live' : null },
        { title: 'Active Stores', value: stats?.activeOutlets || '0', icon: Store, color: 'bg-violet-50 text-violet-600', sub: `${stats?.brands?.length || 0} Brands` },
        { title: 'Active Factories', value: stats?.activeFactories || '0', icon: Factory, color: 'bg-amber-50 text-amber-600', sub: stats?.slotUtilization || 'Operational' },
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="page-title">System Overview</h1>
                    <p className="page-subtitle">Global monitoring and operational metrics</p>
                </div>
                <DateRangeFilter
                    value={dateRange}
                    onChange={setDateRange}
                    customDates={customDates}
                    onCustomChange={setCustomDates}
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-stagger">
                {quickActions.map((action) => (
                    <button
                        key={action.path}
                        onClick={() => navigate(action.path)}
                        className={`flex items-center gap-4 p-4 bg-white border border-neutral-100 rounded-2xl shadow-soft hover:shadow-card transition-all duration-300 group text-left ${action.hoverColor}`}
                    >
                        <div className={`p-3 ${action.color} rounded-xl transition-transform group-hover:scale-110`}>
                            <action.icon size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-neutral-800">{action.title}</h3>
                            <p className="text-xs text-neutral-400">{action.desc}</p>
                        </div>
                        <ArrowUpRight size={16} className="text-neutral-300 group-hover:text-primary transition-colors" />
                    </button>
                ))}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-stagger">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{stat.value}</h3>
                                {stat.trend && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-2 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> {stat.trend}
                                    </span>
                                )}
                                {stat.sub && <p className="text-[11px] text-neutral-400 mt-2">{stat.sub}</p>}
                            </div>
                            <div className={`p-2.5 ${stat.color} rounded-xl`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Orders Breakdown">
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <PieChart>
                                <Pie data={stats?.ordersByType} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" strokeWidth={0}>
                                    {stats?.ordersByType?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex justify-center gap-6 text-xs mt-2">
                            {stats?.ordersByType?.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-neutral-500 font-medium">{entry.name}</span>
                                    <span className="font-bold text-neutral-700">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                <Card title="Order Status" className="lg:col-span-2">
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <BarChart data={stats?.ordersByStatus} barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                                <Bar dataKey="value" fill="#4F46E5" radius={[8, 8, 0, 0]} barSize={36} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title={`Revenue Trend (${dateRange === 'Custom' ? 'Period' : dateRange === 'This Week' || dateRange === 'Week' ? '7 Days' : dateRange})`} className="lg:col-span-2">
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <AreaChart data={stats?.revenueTrend}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                                <RechartsTooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" dot={{ fill: '#4F46E5', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="space-y-6">
                    <Card title="Delivery Health">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Truck size={18} />
                                </div>
                                <div>
                                    <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Success Rate</p>
                                    <p className="text-xl font-bold text-neutral-900">{stats?.deliveryHealth?.successRate}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] text-neutral-400">Failures</p>
                                <p className="text-sm font-bold text-red-500">{stats?.deliveryHealth?.failure}</p>
                            </div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: stats?.deliveryHealth?.successRate }} />
                        </div>
                    </Card>

                    <Card title="Integration Status">
                        <div className="space-y-2.5">
                            {stats?.integrationHealth && Object.entries(stats.integrationHealth).map(([key, status]) => (
                                <div key={key} className="flex items-center justify-between p-3 bg-neutral-50/80 rounded-xl border border-neutral-100/50">
                                    <div className="flex items-center gap-2.5">
                                        <Server size={14} className="text-neutral-400" />
                                        <span className="text-sm font-medium text-neutral-600 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
