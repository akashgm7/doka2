import React, { useState, useEffect } from 'react';
import { reportsService } from '../services/reportsService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import { Download, DollarSign, ShoppingBag, TrendingUp, CreditCard, FileText } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import toast from 'react-hot-toast';

import { useSelector } from 'react-redux';

const Reports = () => {
    const { user } = useSelector(state => state.auth);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null); // Analytics data
    const [dateRange, setDateRange] = useState('This Month');
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        loadData();
    }, [dateRange, user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await reportsService.getAnalyticsData(
                dateRange,
                user.role === 'Brand Admin' ? user.brandId : null,
                ['Area Manager', 'Store Manager'].includes(user.role) ? user.assignedOutlets : null,
                user.role === 'Factory User' ? user.assignedFactory : null
            );
            setData(result);
        } catch (error) {
            console.error("Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (type) => {
        setDownloading(true);
        const toastId = toast.loading(`Generating ${type} report...`);
        try {
            await reportsService.downloadReport(type, dateRange);
            toast.success(`${type} Report downloaded successfully`, { id: toastId });
        } catch (error) {
            toast.error("Failed to generate report", { id: toastId });
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-neutral-500">Loading analytics...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-title">Analytics & Reports</h1>
                    <p className="page-subtitle">Business insights, financial metrics, and operational reports</p>
                </div>
                <div className="flex items-center gap-3">
                    <DateRangeFilter value={dateRange} onChange={setDateRange} />
                    <Button
                        variant="outline"
                        icon={Download}
                        onClick={() => handleDownload('Summary')}
                        isLoading={downloading}
                    >
                        Export Data
                    </Button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-white to-neutral-50 border-neutral-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 mb-1">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-neutral-900">${data?.overview?.totalRevenue?.toLocaleString()}</h3>
                            <span className="text-xs text-green-600 font-medium flex items-center mt-1">
                                <TrendingUp size={12} className="mr-1" /> +{data?.overview?.growth}%
                            </span>
                        </div>
                        <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-white to-neutral-50 border-neutral-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 mb-1">Total Orders</p>
                            <h3 className="text-2xl font-bold text-neutral-900">{data?.overview?.totalOrders?.toLocaleString()}</h3>
                        </div>
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                            <ShoppingBag size={20} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-white to-neutral-50 border-neutral-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-neutral-500 mb-1">Avg. Order Value</p>
                            <h3 className="text-2xl font-bold text-neutral-900">${data?.overview?.avgOrderValue}</h3>
                        </div>
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
                            <CreditCard size={20} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card
                    title="Revenue Trends"
                    className="lg:col-span-2"
                    action={
                        <button onClick={() => handleDownload('Revenue_Trends')} className="p-1.5 text-neutral-400 hover:text-primary hover:bg-neutral-50 rounded-md transition-colors">
                            <Download size={16} />
                        </button>
                    }
                >
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.revenueTrend}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} prefix="$" />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card
                    title="Payment Methods"
                    action={
                        <button onClick={() => handleDownload('Payment_Methods')} className="p-1.5 text-neutral-400 hover:text-primary hover:bg-neutral-50 rounded-md transition-colors">
                            <Download size={16} />
                        </button>
                    }
                >
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.paymentMethods}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data?.paymentMethods?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Charts Row 2 & Export */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card
                    title="Popular Items"
                    className="lg:col-span-2"
                    action={
                        <button onClick={() => handleDownload('Popular_Items')} className="p-1.5 text-neutral-400 hover:text-primary hover:bg-neutral-50 rounded-md transition-colors">
                            <Download size={16} />
                        </button>
                    }
                >
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.popularItems} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Bar dataKey="orders" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Download Reports">
                    <div className="space-y-3">
                        <div className="p-3 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => handleDownload('Sales')}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-neutral-900">Sales Report</h4>
                                    <p className="text-xs text-neutral-500">Detailed transactions & revenue</p>
                                </div>
                            </div>
                            <Download size={16} className="text-neutral-400 group-hover:text-primary transition-colors" />
                        </div>

                        <div className="p-3 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => handleDownload('Inventory')}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
                                    <ShoppingBag size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-neutral-900">Product Analysis</h4>
                                    <p className="text-xs text-neutral-500">Bestsellers & low stock</p>
                                </div>
                            </div>
                            <Download size={16} className="text-neutral-400 group-hover:text-primary transition-colors" />
                        </div>

                        <div className="p-3 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => handleDownload('Audit')}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-neutral-900">System Audit</h4>
                                    <p className="text-xs text-neutral-500">User logs & permissions</p>
                                </div>
                            </div>
                            <Download size={16} className="text-neutral-400 group-hover:text-primary transition-colors" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
