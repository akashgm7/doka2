import React, { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Search, Filter, RefreshCw, Calendar, MapPin, Download, ChevronDown, ChevronRight, Info, Eye } from 'lucide-react';
import DateRangeFilter from '../../components/dashboard/DateRangeFilter';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import Modal from '../../components/ui/Modal';

const AuditLogs = () => {
    const { user } = useSelector(state => state.auth);
    const [searchTerm, setSearchTerm] = useState('');
    const dispatch = useDispatch();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [dateRange, setDateRange] = useState('Today');
    const [customDates, setCustomDates] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [filters, setFilters] = useState({
        status: 'All',
        action: 'All'
    });

    const handleLogClick = (log) => {
        setSelectedLog(log);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const socket = io(`http://${window.location.hostname}:5002`);

        socket.on('new_audit_log', (newLog) => {
            console.log('New audit log received via socket:', newLog);

            // Apply current filters to the new log
            const matchesSearch = !searchTerm || [newLog.user, newLog.action, newLog.resource].some(field =>
                field?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const matchesStatus = filters.status === 'All' || newLog.status === filters.status;
            const matchesAction = filters.action === 'All' || newLog.action === filters.action;

            if (matchesSearch && matchesStatus && matchesAction) {
                setLogs(prev => [newLog, ...prev.slice(0, 199)]);
                toast.success(`Action: ${newLog.action}`, { icon: '🛡️', duration: 3000 });
            }
        });

        return () => socket.disconnect();
    }, [searchTerm, filters]);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const data = await auditService.getLogs({
                    search: searchTerm,
                    range: dateRange === 'Custom Date' || dateRange === 'Date Range' ? 'Custom' : dateRange,
                    startDate: customDates.startDate,
                    endDate: customDates.endDate,
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
    }, [searchTerm, filters, dateRange, customDates]);

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
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <DateRangeFilter
                                value={dateRange}
                                onChange={setDateRange}
                                customDates={customDates}
                                onCustomChange={setCustomDates}
                            />
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
                                                    <option value="Create">Create (Any)</option>
                                                    <option value="Update">Update (Any)</option>
                                                    <option value="Login">Login</option>
                                                    <option value="Logout">Logout</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setFilters({ status: 'All', action: 'All' });
                                                    setSearchTerm('');
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
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-100">
                                <th className="p-4 font-medium text-neutral-500 text-sm">Timestamp</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">User</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Action</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Resource</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Status</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm text-right">View</th>
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
                                    <tr
                                        key={log._id}
                                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 cursor-pointer transition-colors"
                                        onClick={() => handleLogClick(log)}
                                    >
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
                                        <td className="p-4">
                                            <Badge variant={log.status === 'Success' ? 'success' : 'error'} size="sm">
                                                {log.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="p-2 text-neutral-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Log Details Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Audit Log Details"
                size="lg"
            >
                {selectedLog && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Performer Info */}
                            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-3">
                                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                                    <Info size={14} className="text-primary" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Performer Details</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-500">User Email</span>
                                        <span className="text-sm font-medium text-neutral-900">{selectedLog.user}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-500">Role</span>
                                        <Badge variant="secondary" size="sm">{selectedLog.role || 'Unknown'}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-500">IP Address</span>
                                        <span className="text-xs font-mono text-neutral-600">{selectedLog.ip || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Info */}
                            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-3">
                                <div className="flex items-center gap-2 text-neutral-500 mb-1">
                                    <RefreshCw size={14} className="text-primary" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Action & Resource</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-500">Action Type</span>
                                        <span className="text-sm font-bold text-primary">{selectedLog.action}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-500">Resource</span>
                                        <span className="text-sm font-medium text-neutral-900">{selectedLog.resource}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-neutral-500">Status</span>
                                        <Badge variant={selectedLog.status === 'Success' ? 'success' : 'error'} size="sm">
                                            {selectedLog.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-neutral-400" />
                                <span className="text-xs text-neutral-500">Event Timestamp</span>
                            </div>
                            <span className="text-sm font-medium text-neutral-900">
                                {new Date(selectedLog.timestamp).toLocaleString()}
                            </span>
                        </div>

                        {/* Modification Details */}
                        {selectedLog.details && Object.keys(selectedLog.details).length > 0 ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-neutral-500">
                                    <Info size={14} />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">Modification Details</span>
                                </div>
                                <div className="bg-neutral-900 rounded-xl p-4 overflow-x-auto border border-neutral-800 shadow-inner">
                                    <pre className="text-xs font-mono text-primary-200 leading-relaxed">
                                        {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        ) : (selectedLog.action.includes('Create') || selectedLog.action.includes('Update')) && (
                            <div className="p-4 rounded-xl bg-neutral-50 border border-dashed border-neutral-200 text-center">
                                <p className="text-xs text-neutral-400italic">No specific field modifications captured for this event.</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AuditLogs;
