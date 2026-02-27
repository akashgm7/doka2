import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { loyaltyService } from '../../services/loyaltyService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Save, Gift, Award, Settings, Info, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const LoyaltyManagement = () => {
    const { user } = useSelector(state => state.auth);
    const [config, setConfig] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const isBrandAdmin = user.role === 'Brand Admin';

    useEffect(() => {
        loadData();
        // Polling for real-time stats
        const interval = setInterval(() => {
            refreshStats();
        }, 10000); // 10 seconds
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [configData, statsData] = await Promise.all([
                loyaltyService.getConfig(),
                loyaltyService.getLoyaltyStats(isBrandAdmin ? user.brandId : null)
            ]);
            setConfig(configData);
            setStats(statsData);
        } catch (error) {
            toast.error("Failed to load loyalty data");
        } finally {
            setLoading(false);
        }
    };

    const refreshStats = async () => {
        try {
            const statsData = await loyaltyService.getLoyaltyStats(isBrandAdmin ? user.brandId : null);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to refresh stats", error);
        }
    };

    const handleSave = async () => {
        if (isBrandAdmin) return; // Read-only for Brand Admin
        setSaving(true);
        try {
            await loyaltyService.updateConfig(config);
            toast.success("Loyalty settings updated successfully");
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        if (isBrandAdmin) return;
        setConfig(prev => ({
            ...prev,
            [field]: parseFloat(value) || value
        }));
    };

    const handleTierChange = (index, field, value) => {
        if (isBrandAdmin) return;
        const newTiers = [...config.tiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setConfig(prev => ({ ...prev, tiers: newTiers }));
    };

    if (loading) return <div className="p-8 text-center">Loading loyalty settings...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="page-title">Loyalty Program</h1>
                    <p className="page-subtitle">
                        {isBrandAdmin ? 'Monitor loyalty performance' : 'Configure points issuance, redemption rules, and tiers'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={refreshStats}
                        title="Refresh Stats"
                    >
                        <TrendingUp size={18} />
                    </Button>
                    {!isBrandAdmin && (
                        <Button
                            onClick={handleSave}
                            isLoading={saving}
                            icon={Save}
                        >
                            Save Changes
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Dashboard for Brand Admins (and Super Admin visibility) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded">
                            <Gift size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">Points Earned</p>
                            <h4 className="text-lg font-bold">{stats?.totalPointsEarned?.toLocaleString()}</h4>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded">
                            <Award size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">Points Redeemed</p>
                            <h4 className="text-lg font-bold">{stats?.totalPointsRedeemed?.toLocaleString()}</h4>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-600 rounded">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">Active Members</p>
                            <h4 className="text-lg font-bold">{stats?.activeMembers}</h4>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">Redemption Rate</p>
                            <h4 className="text-lg font-bold">{stats?.redemptionRate}%</h4>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Earning Rules" icon={Gift}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Earn Rate (Points per $1)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    disabled={isBrandAdmin}
                                    className="w-full pl-3 pr-12 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:bg-neutral-50 disabled:text-neutral-500"
                                    value={config.earnRate}
                                    onChange={(e) => handleChange('earnRate', e.target.value)}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">pts</span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                                A customer spending $100 will earn <strong>{100 * config.earnRate} points</strong>.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Minimum Order Value for Earning
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    disabled={isBrandAdmin}
                                    className="w-full pl-8 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:bg-neutral-50 disabled:text-neutral-500"
                                    value={config.minOrderValueForEarn}
                                    onChange={(e) => handleChange('minOrderValueForEarn', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Redemption Rules" icon={Award}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Redemption Value ($ per Point)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    disabled={isBrandAdmin}
                                    className="w-full pl-8 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:bg-neutral-50 disabled:text-neutral-500"
                                    value={config.redemptionValue}
                                    onChange={(e) => handleChange('redemptionValue', e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                                100 points = <strong>${(100 * config.redemptionValue).toFixed(2)}</strong> discount.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Minimum Points for Redemption
                            </label>
                            <input
                                type="number"
                                min="0"
                                disabled={isBrandAdmin}
                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:bg-neutral-50 disabled:text-neutral-500"
                                value={config.minRedemptionPoints}
                                onChange={(e) => handleChange('minRedemptionPoints', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Point Expiry (Months)
                            </label>
                            <input
                                type="number"
                                min="0"
                                disabled={isBrandAdmin}
                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:bg-neutral-50 disabled:text-neutral-500"
                                value={config.expiryMonths}
                                onChange={(e) => handleChange('expiryMonths', e.target.value)}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tiers Configuration */}
            <Card title="Loyalty Tiers" icon={Settings}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 border-b border-neutral-100">
                                <th className="p-4 font-medium text-neutral-500 text-sm">Tier Name</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Min Points Required</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Earning Multiplier</th>
                                <th className="p-4 font-medium text-neutral-500 text-sm">Badge Color Simulation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {config.tiers.map((tier, index) => (
                                <tr key={index} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            disabled={isBrandAdmin}
                                            className="w-full bg-transparent border-none focus:ring-0 font-medium text-neutral-900 disabled:text-neutral-500"
                                            value={tier.name}
                                            onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="number"
                                            disabled={isBrandAdmin}
                                            className="w-24 px-2 py-1 border border-neutral-200 rounded text-sm disabled:bg-neutral-50"
                                            value={tier.minPoints}
                                            onChange={(e) => handleTierChange(index, 'minPoints', parseInt(e.target.value))}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                disabled={isBrandAdmin}
                                                className="w-20 px-2 py-1 border border-neutral-200 rounded text-sm disabled:bg-neutral-50"
                                                value={tier.multiplier}
                                                onChange={(e) => handleTierChange(index, 'multiplier', parseFloat(e.target.value))}
                                            />
                                            <span className="text-xs text-neutral-400">x</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className={`w-8 h-8 rounded-full ${tier.color} flex items-center justify-center text-white text-xs font-bold`}>
                                            {tier.name[0]}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg mt-4 flex gap-2">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <p>Customers automatically move up tiers based on their total lifetime points earned.</p>
                </div>
            </Card>
        </div>
    );
};

export default LoyaltyManagement;
