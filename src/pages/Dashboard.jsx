import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Card from '../components/ui/Card';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import { dashboardService } from '../services/dashboardService';

const Dashboard = () => {
    const getTodayStr = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const [dateRange, setDateRange] = useState('This Week');
    const [customDates, setCustomDates] = useState({
        startDate: getTodayStr(),
        endDate: getTodayStr()
    });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchStats = async () => {
            if ((dateRange === 'Custom Date' || dateRange === 'Date Range') && !customDates.startDate) return;

            setIsRefreshing(true);
            try {
                const apiRange = dateRange === 'Custom Date' || dateRange === 'Date Range' ? 'Custom' : dateRange;
                const data = await dashboardService.getDashboardStats(user.role, undefined, apiRange, customDates);
                setStats(data);
                if (loading) setLoading(false);
            } catch (error) {
                console.error("Failed to fetch dashboard stats:", error);
            } finally {
                setIsRefreshing(false);
            }
        };
        fetchStats();
    }, [dateRange, user.role, customDates]);

    const isFiltered = dateRange !== 'Today' && dateRange !== 'All Time';

    const statCards = [
        {
            title: isFiltered ? 'Period Revenue' : 'Total Revenue',
            value: `₹${stats?.revenue?.toLocaleString() || 0}`,
            change: '+12.5%',
            isPositive: true,
            icon: DollarSign,
            color: 'bg-purple-500'
        },
        {
            title: isFiltered ? 'Period Orders' : 'Total Orders',
            value: stats?.totalOrders || 0,
            change: '+8.2%',
            isPositive: true,
            icon: ShoppingBag,
            color: 'bg-indigo-500'
        },
        {
            title: 'Active Users',
            value: stats?.usersCount?.toLocaleString() || '0',
            change: '-2.1%',
            isPositive: false,
            icon: Users,
            color: 'bg-blue-500'
        },
        {
            title: 'Avg Order Value',
            value: `₹${stats?.avgOrderValue?.toFixed(2) || '0.00'}`,
            change: '+1.2%',
            isPositive: true,
            icon: TrendingUp,
            color: 'bg-emerald-500'
        }
    ];

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
                    <Activity className="w-6 h-6 text-primary" />
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping opacity-25" />
            </div>
            <span className="text-sm text-neutral-400 font-medium">Loading analysis...</span>
        </div>
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
                    <p className="text-neutral-500">Welcome back, {user?.name}. Here's what's happening {dateRange.toLowerCase()}.</p>
                </div>
                <div className="flex items-center gap-3">
                    <DateRangeFilter
                        value={dateRange}
                        onChange={setDateRange}
                        customDates={customDates}
                        onCustomChange={setCustomDates}
                    />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Card key={index} className="overflow-hidden">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-500">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-neutral-900 mt-1">{stat.value}</h3>
                                <div className="flex items-center mt-2">
                                    {stat.isPositive ? (
                                        <ArrowUpRight size={16} className="text-green-500" />
                                    ) : (
                                        <ArrowDownRight size={16} className="text-red-500" />
                                    )}
                                    <span className={`text-xs font-medium ml-1 ${stat.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                        {stat.change}
                                    </span>
                                    <span className="text-xs text-neutral-400 ml-1.5 font-medium tracking-wide">vs last period</span>
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl text-white ${stat.color} shadow-lg shadow-neutral-100`}>
                                <stat.icon size={24} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <Card title={`Revenue Growth (${dateRange === 'Custom' ? 'Period' : dateRange === 'This Week' || dateRange === 'Week' ? '7 Days' : dateRange})`} extra={<TrendingUp size={20} className="text-neutral-400" />}>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.revenueTrend || []}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Orders Breakdown */}
                <Card title="Order Volume" extra={<ShoppingBag size={20} className="text-neutral-400" />}>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.revenueTrend || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Dashboard;
