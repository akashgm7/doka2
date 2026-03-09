import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { paymentService } from '../services/paymentService';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Download, CreditCard, DollarSign, AlertCircle, Filter, X, Search } from 'lucide-react';
import DateRangeFilter from '../components/dashboard/DateRangeFilter';
import toast from 'react-hot-toast';

const PaymentManagement = () => {
    const { user } = useSelector(state => state.auth);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [dateRange, setDateRange] = useState('This Month');
    const [customDates, setCustomDates] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterMethod, setFilterMethod] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(true);

    useEffect(() => { loadData(); }, [user, dateRange, customDates, filterStatus, filterMethod]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {
                range: dateRange === 'Custom Date' || dateRange === 'Date Range' ? 'Custom' : dateRange,
                startDate: customDates.startDate,
                endDate: customDates.endDate,
                status: filterStatus,
                method: filterMethod
            };

            const [paymentsData, statsData] = await Promise.all([
                paymentService.getPayments(params),
                paymentService.getPaymentStats(params)
            ]);
            setPayments(paymentsData);
            setStats(statsData);
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch payment records");
        } finally { setLoading(false); }
    };

    const filteredPayments = React.useMemo(() => {
        if (!searchTerm) return payments;
        const lower = searchTerm.toLowerCase();
        return payments.filter(p =>
            (p.id || '').toLowerCase().includes(lower) ||
            (p.orderId || '').toLowerCase().includes(lower) ||
            (p.customer || '').toLowerCase().includes(lower)
        );
    }, [payments, searchTerm]);

    const columns = [
        { header: 'Transaction', render: (row) => <span className="text-sm font-mono font-medium text-neutral-700">{row.id}</span> },
        { header: 'Order', render: (row) => <span className="text-sm font-semibold text-neutral-800">{row.orderId}</span> },
        { header: 'Date', render: (row) => <span className="text-xs text-neutral-500">{new Date(row.date).toLocaleDateString()}</span> },
        { header: 'Customer', render: (row) => <span className="text-sm text-neutral-700">{row.customer}</span> },
        { header: 'Method', render: (row) => <Badge variant="neutral">{row.method}</Badge> },
        { header: 'Amount', render: (row) => <span className="text-sm font-bold text-neutral-800">₹{row.amount?.toLocaleString()}</span> },
        {
            header: 'Status',
            render: (row) => {
                const variantMap = { 'Paid': 'success', 'Delivered': 'success', 'Pending': 'warning', 'Failed': 'error' };
                return <Badge variant={variantMap[row.status] || 'neutral'} dot>{row.status}</Badge>;
            }
        }
    ];

    const statCards = [
        { title: 'Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() ?? '0'}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
        { title: 'Transactions', value: stats?.transactionCount ?? 0, icon: CreditCard, color: 'bg-primary-50 text-primary' },
        { title: 'Failed', value: stats?.failedCount ?? 0, icon: AlertCircle, color: 'bg-red-50 text-red-500' },
    ];

    const resetFilters = () => {
        setDateRange('This Month');
        setFilterStatus('All');
        setFilterMethod('All');
        setSearchTerm('');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="page-title">Payment Management</h1>
                    <p className="page-subtitle">View and manage transaction history</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={showFilters ? "primary" : "secondary"}
                        icon={showFilters ? X : Filter}
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? "Hide Filters" : "Filters"}
                    </Button>
                    <Button variant="secondary" icon={Download} size="sm">Export</Button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-stagger">
                {statCards.map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 ${stat.color} rounded-xl`}><stat.icon size={20} /></div>
                            <div>
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{stat.title}</p>
                                <p className="text-xl font-bold text-neutral-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <DateRangeFilter
                        value={dateRange}
                        onChange={setDateRange}
                        customDates={customDates}
                        onCustomChange={setCustomDates}
                    />

                    <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200">
                        <span className="text-xs font-bold text-neutral-400 uppercase">Status:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-neutral-700 outline-none border-none focus:ring-0 p-0 cursor-pointer"
                        >
                            <option value="All">All Status</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200">
                        <span className="text-xs font-bold text-neutral-400 uppercase">Method:</span>
                        <select
                            value={filterMethod}
                            onChange={(e) => setFilterMethod(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-neutral-700 outline-none border-none focus:ring-0 p-0 cursor-pointer"
                        >
                            <option value="All">All Methods</option>
                            <option value="Razorpay">Razorpay</option>
                            <option value="COD">Cash on Delivery</option>
                        </select>
                    </div>

                    <button
                        onClick={resetFilters}
                        className="text-xs font-bold text-primary hover:underline ml-auto transition-all"
                    >
                        Reset Filters
                    </button>
                </div>
            )}

            {/* Data Table with Search */}
            <div className="bg-white rounded-2xl shadow-card border border-neutral-100/80 overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by Transaction, Order ID, or Customer..."
                            className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                </div>
                <Table
                    columns={columns}
                    data={filteredPayments}
                    isLoading={loading}
                    emptyMessage="No transactions found matching filters."
                />
            </div>
        </div>
    );
};

export default PaymentManagement;
