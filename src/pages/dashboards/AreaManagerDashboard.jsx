import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MapPin, ShoppingBag, DollarSign, Users, TrendingUp, Activity } from 'lucide-react';
import Card from '../../components/ui/Card';
import { dashboardService } from '../../services/dashboardService';

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

const AreaManagerDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('Week');

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const data = await dashboardService.getDashboardStats('Area Manager', undefined, dateRange);
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch area dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [dateRange]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse"><Activity className="w-5 h-5 text-primary" /></div>
            <span className="text-sm text-neutral-400 font-medium">Loading area data...</span>
        </div>
    );

    const statCards = [
        { title: 'Assigned Outlets', value: stats?.activeOutlets || user?.assignedOutlets?.length || 0, icon: MapPin, color: 'bg-primary-50 text-primary' },
        { title: 'Area Revenue', value: `$${stats?.revenue?.toLocaleString() || '0'}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
        { title: 'Area Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'bg-violet-50 text-violet-600' },
        { title: 'Team Members', value: stats?.usersCount || 0, icon: Users, color: 'bg-amber-50 text-amber-600' },
    ];

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="page-title">Area Performance</h1>
                    <p className="page-subtitle">Overview for your assigned outlets</p>
                </div>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 shadow-soft cursor-pointer"
                >
                    <option value="Today">Today</option>
                    <option value="Week">This Week</option>
                    <option value="Month">This Month</option>
                </select>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-stagger">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{stat.value}</h3>
                            </div>
                            <div className={`p-2.5 ${stat.color} rounded-xl`}>
                                <stat.icon size={20} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Area Revenue Trend">
                    <div className="h-72 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.revenueTrend || []}>
                                <defs>
                                    <linearGradient id="colorAreaRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAreaRev)" dot={{ fill: '#4F46E5', strokeWidth: 0, r: 3 }} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Outlet Performance">
                    <div className="h-72 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.outlets || []} barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} barSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Outlet Table */}
            <Card title="Outlet Operational Status">
                <div className="overflow-x-auto mt-2">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-100">
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Outlet</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Revenue</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Orders</th>
                                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50">
                            {(stats?.outlets || []).map((outlet, index) => (
                                <tr key={index} className="hover:bg-primary-50/20 transition-colors">
                                    <td className="px-4 py-3.5 font-semibold text-neutral-800">{outlet.name}</td>
                                    <td className="px-4 py-3.5">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ring-1 ${outlet.status === 'Open' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200/50' : 'bg-red-50 text-red-700 ring-red-200/50'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${outlet.status === 'Open' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            {outlet.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 font-bold text-neutral-800">${outlet.revenue?.toLocaleString() || '0'}</td>
                                    <td className="px-4 py-3.5 text-neutral-600 font-medium">{outlet.orders || 0}</td>
                                    <td className="px-4 py-3.5">
                                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                                            <TrendingUp size={14} /> Stable
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {(!stats?.outlets || stats.outlets.length === 0) && (
                                <tr><td colSpan="5" className="text-center py-10 text-neutral-400">No outlet data available</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AreaManagerDashboard;
