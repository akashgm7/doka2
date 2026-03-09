import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Package, Clock, CheckCircle, Calendar as CalendarIcon, Activity } from 'lucide-react';
import Card from '../../components/ui/Card';
import { dashboardService } from '../../services/dashboardService';
import toast from 'react-hot-toast';
import DateRangeFilter from '../../components/dashboard/DateRangeFilter';

const FactoryDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const getTodayStr = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('Today');
    const [customDates, setCustomDates] = useState({
        startDate: getTodayStr(),
        endDate: getTodayStr()
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const isFiltered = dateRange !== 'Today' && dateRange !== 'All Time';

    useEffect(() => {
        const fetchStats = async () => {
            if ((dateRange === 'Custom Date' || dateRange === 'Date Range') && !customDates.startDate) return;

            setIsRefreshing(true);
            try {
                const apiRange = dateRange === 'Custom Date' || dateRange === 'Date Range' ? 'Custom' : dateRange;
                const data = await dashboardService.getDashboardStats('Factory Manager', undefined, apiRange, customDates);
                setStats(data);
                if (loading) setLoading(false);
            } catch (error) {
                console.error("Failed to fetch factory dashboard stats:", error);
            } finally {
                setIsRefreshing(false);
            }
        };
        fetchStats();
    }, [dateRange, customDates]);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse"><Activity className="w-5 h-5 text-primary" /></div>
            <span className="text-sm text-neutral-400 font-medium">Loading production data...</span>
        </div>
    );

    const statCards = [
        { title: 'MMC Queue', value: stats?.mmcQueueCount || 0, sub: 'Processing', icon: Package, color: 'bg-primary-50 text-primary' },
        { title: 'For Delivery', value: stats?.calendar?.length || 0, sub: 'Today', icon: CalendarIcon, color: 'bg-amber-50 text-amber-600' },
        { title: 'Slot Utilization', value: stats?.slotUtilization || '85%', sub: 'Optimal', icon: Activity, color: 'bg-emerald-50 text-emerald-600' },
        { title: 'Completed', value: stats?.orderBreakdown?.delivered || stats?.orderBreakdown?.completed || 0, sub: 'Shipped', icon: CheckCircle, color: 'bg-cyan-50 text-cyan-600' },
    ];

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="page-title">Factory Production</h1>
                    <p className="page-subtitle">Managing: {user?.assignedFactory || 'Central Kitchen'}</p>
                </div>
                <DateRangeFilter
                    value={dateRange}
                    onChange={setDateRange}
                    customDates={customDates}
                    onCustomChange={setCustomDates}
                />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 animate-stagger">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 ${stat.color} rounded-xl`}>
                                <stat.icon size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{stat.value}</h3>
                                <p className="text-[11px] text-neutral-400 mt-0.5">{stat.sub}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Production Queue */}
                <Card title="MMC Production Queue">
                    <div className="space-y-3 mt-2">
                        {(stats?.mmcQueue || []).map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-neutral-50/80 border border-neutral-100/50 hover:shadow-soft transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shadow-soft">
                                        <Package size={20} className="text-neutral-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-800">Custom Order #{item.orderNumber}</p>
                                        <p className="text-xs text-neutral-400">{item.details || 'Special Request'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200/50">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        In Queue
                                    </span>
                                    <p className="text-[11px] text-neutral-400 mt-1">Due: {item.dueDate || 'Today'}</p>
                                </div>
                            </div>
                        ))}
                        {(!stats?.mmcQueue || stats.mmcQueue.length === 0) && (
                            <div className="text-center py-12">
                                <Package size={40} className="mx-auto mb-3 text-neutral-200" />
                                <p className="text-sm text-neutral-400 font-medium">No custom orders in queue</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Calendar */}
                <Card title="Today's Fulfillment">
                    <div className="space-y-3 mt-2">
                        {(stats?.calendar || []).map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100/50 bg-white hover:shadow-soft transition-all">
                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary-50 text-primary">
                                    <span className="text-xs font-bold">{item.time || '10:00'}</span>
                                    <span className="text-[9px] font-medium opacity-60">AM</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-800 truncate">{item.outletName || 'Store Order'}</p>
                                    <p className="text-xs text-neutral-400">{item.itemsCount} Items • #{item.orderNumber}</p>
                                </div>
                                <CheckCircle size={18} className="text-neutral-200 shrink-0" />
                            </div>
                        ))}
                        {(!stats?.calendar || stats.calendar.length === 0) && (
                            <div className="text-center py-12">
                                <CalendarIcon size={40} className="mx-auto mb-3 text-neutral-200" />
                                <p className="text-sm text-neutral-400 font-medium">No shipments scheduled today</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default FactoryDashboard;
