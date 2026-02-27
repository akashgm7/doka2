import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { paymentService } from '../services/paymentService';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Download, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentManagement = () => {
    const { user } = useSelector(state => state.auth);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [paymentsData, statsData] = await Promise.all([
                paymentService.getPayments(user.brandId),
                paymentService.getPaymentStats(user.brandId)
            ]);
            setPayments(paymentsData);
            setStats(statsData);
        } catch (error) {
            console.error(error);
        } finally { setLoading(false); }
    };

    const columns = [
        { header: 'Transaction', render: (row) => <span className="text-sm font-mono font-medium text-neutral-700">{row.id}</span> },
        { header: 'Order', render: (row) => <span className="text-sm font-semibold text-neutral-800">{row.orderId}</span> },
        { header: 'Date', render: (row) => <span className="text-xs text-neutral-500">{new Date(row.date).toLocaleDateString()}</span> },
        { header: 'Customer', render: (row) => <span className="text-sm text-neutral-700">{row.customer}</span> },
        { header: 'Method', render: (row) => <Badge variant="neutral">{row.method}</Badge> },
        { header: 'Amount', render: (row) => <span className="text-sm font-bold text-neutral-800">${row.amount?.toFixed(0)}</span> },
        {
            header: 'Status',
            render: (row) => {
                const variantMap = { 'Paid': 'success', 'Delivered': 'success', 'Pending': 'warning', 'Failed': 'error' };
                return <Badge variant={variantMap[row.status] || 'neutral'} dot>{row.status}</Badge>;
            }
        }
    ];

    const statCards = [
        { title: 'Total Revenue', value: `$${stats?.totalRevenue?.toLocaleString() ?? '0'}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
        { title: 'Transactions', value: stats?.transactionCount ?? 0, icon: CreditCard, color: 'bg-primary-50 text-primary' },
        { title: 'Failed', value: stats?.failedCount ?? 0, icon: AlertCircle, color: 'bg-red-50 text-red-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="page-title">Payment Management</h1>
                    <p className="page-subtitle">View and manage transaction history</p>
                </div>
                <Button variant="secondary" icon={Download} size="sm">Export</Button>
            </div>

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

            <div className="bg-white rounded-2xl shadow-card border border-neutral-100/80 overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100">
                    <h3 className="text-sm font-semibold text-neutral-800">Recent Transactions</h3>
                </div>
                <Table columns={columns} data={payments} isLoading={loading} emptyMessage="No transactions found." />
            </div>
        </div>
    );
};

export default PaymentManagement;
