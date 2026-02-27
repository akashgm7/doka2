import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Search, FileText, Shield, Filter, Download } from 'lucide-react';
import toast from 'react-hot-toast';

import { useSelector, useDispatch } from 'react-redux';
import { setGlobalSearch, clearGlobalSearch } from '../../features/ui/uiSlice';

const AuditLogs = () => {
    const { user } = useSelector(state => state.auth);
    const searchTerm = useSelector(state => state.ui?.globalSearch || '');
    const dispatch = useDispatch();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: 'All',
        action: 'All'
    });

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const data = await auditService.getLogs({
                    search: searchTerm,
                    brandId: user.role === 'Brand Admin' ? user.assignedBrand : null,
                    assignedOutlets: ['Area Manager', 'Store Manager'].includes(user.role) ? user.assignedOutlets : null,
                    assignedFactory: user.role === 'Factory Manager' ? user.assignedFactory : null,
                    role: user.role, // Pass role for hierarchy filtering
                    ...filters
                });
                setLogs(data);
            } catch (error) {
                toast.error("Failed to load audit logs");
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(fetchLogs, 500);
        return () => clearTimeout(debounce);
    }, [searchTerm, filters]);

    const handleExport = () => {
        if (logs.length === 0) {
            toast.error("No logs to export");
            return;
        }

        const headers = ["Timestamp", "User", "Action", "Resource", "IP Address", "Status"];
        const csvContent = [
            headers.join(","),
            ...logs.map(log => [
                new Date(log.timestamp).toLocaleString().replace(/,/g, ' '),
                log.user,
                log.action,
                log.resource,
                log.ip,
                log.status
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Audit logs exported successfully");
    };

    const uniqueActions = ['All', ...new Set(logs.map(log => log.action))];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="page-title">Audit Logs</h1>
                    <p className="page-subtitle">Track system activity and user actions for compliance</p>
                </div>
            </div>

            <Card className="overflow-visible">
                <div className="p-4 border-b border-neutral-100 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative flex-1 max-w-md w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by user, action, or resource..."
                                className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary hover:border-neutral-300 transition-all"
                                value={searchTerm}
                                onChange={(e) => dispatch(setGlobalSearch(e.target.value))}
                            />
                        </div>
                        <div className="flex gap-2 relative">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-neutral-50 transition-colors ${showFilters ? 'border-primary text-primary bg-primary/5' : 'border-neutral-200 text-neutral-600'}`}
                            >
                                <Filter size={18} />
                                <span className="hidden sm:inline">Filter</span>
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50"
                            >
                                <Download size={18} />
                                <span className="hidden sm:inline">Export</span>
                            </button>

                            {/* Filter Dropdown */}
                            {showFilters && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                                            <select
                                                className="w-full p-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-primary"
                                                value={filters.status}
                                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                            >
                                                <option value="All">All Statuses</option>
                                                <option value="Success">Success</option>
                                                <option value="Failed">Failed</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Action Type</label>
                                            <select
                                                className="w-full p-2 border border-neutral-200 rounded-lg text-sm outline-none focus:border-primary"
                                                value={filters.action}
                                                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                                            >
                                                <option value="All">All Actions</option>
                                                <option value="Login">Login</option>
                                                <option value="Logout">Logout</option>
                                                <option value="Update Order">Update Order</option>
                                                <option value="Create User">Create User</option>
                                                <option value="Update Settings">Update Settings</option>
                                            </select>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setFilters({ status: 'All', action: 'All' });
                                                dispatch(clearGlobalSearch());
                                            }}
                                            className="w-full py-2 text-sm text-neutral-500 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-lg"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-100">
                                <th className="p-4 font-medium text-neutral-500 text-sm">Timestamp</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">User</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Action</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Resource</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">IP Address</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-neutral-500">Loading logs...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-neutral-500">No logs found matching your criteria.</td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                                        <td className="p-4 text-sm text-neutral-600 whitespace-nowrap">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                    {log.user.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-neutral-900">{log.user}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-neutral-900 font-medium">
                                            {log.action}
                                        </td>
                                        <td className="p-4 text-sm text-neutral-600">
                                            {log.resource}
                                        </td>
                                        <td className="p-4 text-sm text-neutral-500 font-mono">
                                            {log.ip}
                                        </td>
                                        <td className="p-4">
                                            <Badge variant={log.status === 'Success' ? 'success' : 'error'} size="sm">
                                                {log.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default AuditLogs;
