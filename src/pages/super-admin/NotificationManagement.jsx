import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { notificationService } from '../../services/notificationService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Send, Settings, Bell, Clock, Users, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import PermissionModal from '../../components/ui/PermissionModal';
import { usePermission } from '../../hooks/usePermission';

const NotificationManagement = () => {
    const { user } = useSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState('compose'); // compose, history, settings
    const [settings, setSettings] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    const notifPermission = usePermission('notifications_manual');
    const isBrandAdmin = user.role === 'Brand Admin';
    const isAreaManager = user.role === 'Area Manager';
    const isStoreManager = user.role === 'Store Manager';

    // Compose State
    const [composeData, setComposeData] = useState({
        title: '',
        message: '',
        target: isBrandAdmin ? 'Brand Users' : (isAreaManager ? 'Area Staff' : (isStoreManager ? 'Store Staff' : 'All Users'))
    });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (activeTab === 'settings') loadSettings();
        if (activeTab === 'history') loadHistory();
    }, [activeTab]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getSettings();
            setSettings(data);
        } catch (error) {
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        setLoading(true);
        try {
            const scope = isBrandAdmin ? user.brandId : (isAreaManager ? 'area' : null);
            // For Area Manager, we might want to pass their ID or just a flag, 
            // but for now, let's keep it simple or update service to handle 'area'
            const data = await notificationService.getHistory(isBrandAdmin ? user.brandId : null);
            setHistory(data);
        } catch (error) {
            toast.error("Failed to load history");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            await notificationService.sendBulkNotification(
                composeData,
                isBrandAdmin ? user.brandId : null
            );
            toast.success("Notification sent successfully!");
            setComposeData({
                title: '',
                message: '',
                target: isBrandAdmin ? 'Brand Users' : (isAreaManager ? 'Area Staff' : (isStoreManager ? 'Store Staff' : 'All Users'))
            });
            setActiveTab('history');
        } catch (error) {
            toast.error("Failed to send notification");
        } finally {
            setSending(false);
        }
    };

    const handleSettingsUpdate = async () => {
        try {
            await notificationService.updateSettings(settings);
            toast.success("Settings updated");
        } catch (error) {
            toast.error("Failed to update settings");
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="page-title">Notification Operations</h1>
                    <p className="page-subtitle">Manage push notifications, announcements, and automation</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200">
                <button
                    onClick={() => setActiveTab('compose')}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'compose' ? 'border-primary text-primary' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                >
                    <Send size={16} /> Compose
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                >
                    <Clock size={18} /> History
                </button>
                {/* Hide Settings for Brand Admin, Area Manager, and Store Manager if they shouldn't edit it. */}
                {!isBrandAdmin && !isAreaManager && !isStoreManager && (
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                    >
                        <Settings size={18} /> Settings
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'compose' && (
                    <Card title="Send Bulk Notification">
                        <form onSubmit={handleSend} className="space-y-4 max-w-2xl">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Target Audience</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                                    <select
                                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                        value={composeData.target}
                                        onChange={(e) => setComposeData({ ...composeData, target: e.target.value })}
                                    >
                                        {!isBrandAdmin && !isAreaManager && !isStoreManager && (
                                            <>
                                                <optgroup label="Broadcast">
                                                    <option value="All Users">All Users (Staff + Customers)</option>
                                                    <option value="Staff">All Staff Only (No Customers)</option>
                                                    <option value="Customers">All Customers Only (No Staff)</option>
                                                </optgroup>
                                                <optgroup label="By Role (Staff Only)">
                                                    <option value="Brand Admins">Brand Admins Only</option>
                                                    <option value="Area Manager">Area Managers Only</option>
                                                    <option value="Store Manager">Store Managers Only</option>
                                                    <option value="Factory Manager">Factory Managers Only</option>
                                                </optgroup>
                                            </>
                                        )}

                                        {isBrandAdmin && (
                                            <>
                                                <option value="Brand Users">All Brand Users (Staff + Customers)</option>
                                                <option value="Brand Staff">Brand Staff Only</option>
                                                <option value="Brand Customers">Brand Customers Only</option>
                                            </>
                                        )}

                                        {isAreaManager && <option value="Area Staff">My Area Staff Only</option>}
                                        {isStoreManager && <option value="Store Staff">My Store Staff Only</option>}
                                    </select>
                                </div>
                                {/* Helper: show who will receive this notification */}
                                <p className="mt-1 text-xs text-neutral-500">
                                    {composeData.target === 'All Users' && '📢 Sent to everyone — all staff and all customers will see this.'}
                                    {composeData.target === 'Staff' && '👷 Sent to all internal staff only. Customers will NOT see this.'}
                                    {composeData.target === 'Customers' && '🛍️ Sent to all customers only. Staff will NOT see this.'}
                                    {composeData.target === 'Brand Admins' && '🔑 Sent only to users with the Brand Admin role.'}
                                    {composeData.target === 'Area Manager' && '📍 Sent only to users with the Area Manager role.'}
                                    {composeData.target === 'Store Manager' && '🏪 Sent only to users with the Store Manager role.'}
                                    {composeData.target === 'Factory Manager' && '🏭 Sent only to users with the Factory Manager role.'}
                                    {composeData.target === 'Brand Users' && '📢 Sent to all users (staff + customers) under this brand.'}
                                    {composeData.target === 'Brand Staff' && '👷 Sent to staff users under this brand only.'}
                                    {composeData.target === 'Brand Customers' && '🛍️ Sent to customers under this brand only.'}
                                    {composeData.target === 'Area Staff' && '📍 Sent to Area Managers and Store Managers in your area.'}
                                    {composeData.target === 'Store Staff' && '🏪 Sent to users assigned to your specific store(s).'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Weekend Flash Sale!"
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    value={composeData.title}
                                    onChange={(e) => setComposeData({ ...composeData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    placeholder="Enter your message here..."
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                                    value={composeData.message}
                                    onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" icon={Send} isLoading={sending}>
                                    Send Notification
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {activeTab === 'history' && (
                    <Card title="Notification Log">
                        {loading ? (
                            <div className="text-center p-8 text-neutral-500">Loading history...</div>
                        ) : (
                            <div className="space-y-4">
                                {history.length === 0 && <p className="text-center text-neutral-500">No notifications sent yet.</p>}
                                {history.map(item => (
                                    <div key={item._id} className="p-4 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={item.type === 'Automated' ? 'neutral' : 'primary'}>
                                                    {item.type}
                                                </Badge>
                                                <span className="text-xs text-neutral-400">
                                                    {new Date(item.sentAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full">
                                                {item.status}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                                        <p className="text-sm text-neutral-600 mt-1">{item.message}</p>
                                        <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
                                            <Users size={12} /> Target: {item.target}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {/* Settings Tab Content Omitted for brevity/RBAC logic check - assumes only rendered if tab is active, which is guarded above */}
                {activeTab === 'settings' && !isBrandAdmin && settings && (
                    <Card title="Configuration">
                        <div className="space-y-6 max-w-xl">
                            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                                <div>
                                    <h4 className="font-medium text-neutral-900">Push Notifications</h4>
                                    <p className="text-sm text-neutral-500">Enable global push delivery.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.pushEnabled}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                notifPermission.request();
                                            } else {
                                                setSettings({ ...settings, pushEnabled: false });
                                            }
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                                <PermissionModal
                                    isOpen={notifPermission.isModalOpen}
                                    type="notifications"
                                    title="Enable Push Notifications?"
                                    description="Stay updated with real-time alerts for new orders, stock levels, and system status across your devices."
                                    onConfirm={async () => {
                                        const granted = await notifPermission.confirm();
                                        if (granted) {
                                            setSettings({ ...settings, pushEnabled: true });
                                        }
                                    }}
                                    onCancel={notifPermission.cancel}
                                />
                            </div>

                            <div>
                                <h4 className="font-medium text-neutral-900 mb-3">Automated Triggers</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary"
                                            checked={settings.automatedEvents.orderStatus}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                automatedEvents: { ...settings.automatedEvents, orderStatus: e.target.checked }
                                            })}
                                        />
                                        <span className="text-sm text-neutral-700">Order Status Updates (Placed, Ready, Delivered)</span>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary"
                                            checked={settings.automatedEvents.cartAbandonment}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                automatedEvents: { ...settings.automatedEvents, cartAbandonment: e.target.checked }
                                            })}
                                        />
                                        <span className="text-sm text-neutral-700">Cart Abandonment Nudges (24h inactive)</span>
                                    </label>

                                    <label className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-primary border-neutral-300 rounded focus:ring-primary"
                                            checked={settings.automatedEvents.lowStock}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                automatedEvents: { ...settings.automatedEvents, lowStock: e.target.checked }
                                            })}
                                        />
                                        <span className="text-sm text-neutral-700">Low Stock Alerts (Staff Only)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button onClick={handleSettingsUpdate}>Save Configuration</Button>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default NotificationManagement;
