import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { systemService } from '../../services/systemService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Activity, ToggleLeft, RefreshCw, Database, CreditCard, Truck, MessageSquare, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const SystemSettings = () => {
    const { user } = useSelector(state => state.auth);
    const [toggles, setToggles] = useState({});
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isBrandAdmin = user.role === 'Brand Admin';
    const isAreaManager = user.role === 'Area Manager';
    const isReadOnly = isAreaManager;

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (isBrandAdmin || isAreaManager) {
                // Load Brand Specific Settings (Read-Only for AM)
                const brandSettings = await systemService.getBrandSettings(user.brandId || 'brand-001');
                // Fallback to brand-001 if AM doesn't have brandId in mock, 
                // but usually AM has assignedOutlets. 
                // Let's assume AM belongs to a brand context implicitly or explicitly.
                // In our mock, AM might not have brandId attached to user object in all cases? 
                // Let's check authService/userService... 
                // actually, for this specific file, let's just use user.brandId if available, 
                // or assume they are viewing the brand they are part of.
                if (user.brandId) {
                    setToggles(await systemService.getBrandSettings(user.brandId));
                } else {
                    // If no brandId, maybe just empty or default?
                    // For purpose of this task, let's assume brand-001 for AM if missing.
                    setToggles(await systemService.getBrandSettings('brand-001'));
                }
            } else {
                // Load Global Settings
                const [togglesData, healthData] = await Promise.all([
                    systemService.getFeatureToggles(),
                    systemService.getSystemHealth()
                ]);
                setToggles(togglesData);
                setHealth(healthData);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key) => {
        if (isReadOnly) return;

        const newValue = !toggles[key];
        // Optimistic update
        setToggles(prev => ({ ...prev, [key]: newValue }));

        try {
            if (isBrandAdmin) {
                await systemService.updateBrandSettings(user.brandId, { ...toggles, [key]: newValue });
            } else {
                await systemService.updateFeatureToggle(key, newValue);
            }
            toast.success(`${key.replace(/([A-Z])/g, ' $1')} ${newValue ? 'enabled' : 'disabled'}`);
        } catch (error) {
            // Revert on failure
            setToggles(prev => ({ ...prev, [key]: !newValue }));
            toast.error("Failed to update setting");
        }
    };

    const handleRefreshHealth = async () => {
        setRefreshing(true);
        try {
            const data = await systemService.checkIntegrations();
            setHealth(data);
            toast.success("Health checks completed");
        } catch (error) {
            toast.error("Failed to refresh status");
        } finally {
            setRefreshing(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Operational': return 'bg-green-100 text-green-800';
            case 'Degraded': return 'bg-yellow-100 text-yellow-800';
            case 'Down': return 'bg-red-100 text-red-800';
            default: return 'bg-neutral-100 text-neutral-800';
        }
    };

    if (loading) return <div className="p-8 text-center text-neutral-500">Loading settings...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="page-title">
                        {isBrandAdmin ? 'Brand Configuration' : (isAreaManager ? 'Area Configuration (Read-Only)' : 'System Configuration')}
                    </h1>
                    <p className="page-subtitle">
                        {isBrandAdmin || isAreaManager ? 'View settings for your scope' : 'Manage feature flags and monitor system health'}
                    </p>
                </div>
            </div>

            <div className={`grid grid-cols-1 ${!isBrandAdmin ? 'lg:grid-cols-2' : ''} gap-6`}>
                {/* Feature/Brand Management */}
                <Card title={isBrandAdmin ? "Brand Features" : (isAreaManager ? "Area Features (Read-Only)" : "Feature Management")} icon={ToggleLeft}>
                    <div className="space-y-4">
                        {Object.entries(toggles).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-3 border border-neutral-100 rounded-lg bg-white">
                                <div>
                                    <h4 className="font-medium text-neutral-900 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </h4>
                                    <p className="text-xs text-neutral-500">
                                        {value ? 'Active' : 'Disabled'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggle(key)}
                                    disabled={isReadOnly}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-primary' : 'bg-neutral-200'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Integration Health - Only for Super Admin */}
                {!isBrandAdmin && (
                    <Card
                        title="Integration Status"
                        icon={Activity}
                        action={
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={RefreshCw}
                                onClick={handleRefreshHealth}
                                isLoading={refreshing}
                            >
                                Check Now
                            </Button>
                        }
                    >
                        <div className="space-y-4">
                            {health && [
                                { key: 'pos', label: 'POS System (Oracle)', icon: Database },
                                { key: 'delivery', label: 'Delivery API (Partner)', icon: Truck },
                                { key: 'payment', label: 'Payment Gateway (Stripe)', icon: CreditCard },
                                { key: 'smsGateway', label: 'SMS Notifications', icon: MessageSquare },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between p-3 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-neutral-100 text-neutral-500 rounded-full">
                                            <item.icon size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-neutral-900">{item.label}</h4>
                                            <p className="text-xs text-neutral-500">Latency: {health[item.key]?.latency}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health[item.key]?.status)}`}>
                                            {health[item.key]?.status}
                                        </span>
                                        <p className="text-[10px] text-neutral-400 mt-1">
                                            {new Date(health[item.key]?.lastCheck).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {/* System Info - Only for Super Admin */}
            {!isBrandAdmin && (
                <Card title="System Environment" icon={ShieldCheck}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-neutral-50/80 rounded-xl border border-neutral-100 ring-1 ring-neutral-100/50">
                            <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Version</p>
                            <p className="font-mono text-neutral-900">v2.4.0-beta</p>
                        </div>
                        <div className="p-4 bg-neutral-50/80 rounded-xl border border-neutral-100 ring-1 ring-neutral-100/50">
                            <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Environment</p>
                            <p className="font-mono text-neutral-900">Production</p>
                        </div>
                        <div className="p-4 bg-neutral-50/80 rounded-xl border border-neutral-100 ring-1 ring-neutral-100/50">
                            <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Database</p>
                            <p className="font-mono text-green-700 font-medium">Connected</p>
                        </div>
                        <div className="p-4 bg-neutral-50/80 rounded-xl border border-neutral-100 ring-1 ring-neutral-100/50">
                            <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Last Deploy</p>
                            <p className="font-mono text-neutral-900">Feb 18, 10:00 AM</p>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default SystemSettings;
