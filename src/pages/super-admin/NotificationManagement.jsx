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
        target: [] // Now an array
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
                target: []
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
                                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                                    <Users size={18} /> Target Audience (Select multiple)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-neutral-200 rounded-lg bg-neutral-50/50">
                                    {!isBrandAdmin && !isAreaManager && !isStoreManager && (
                                        <>
                                            <div className="col-span-full font-medium text-xs text-neutral-400 uppercase tracking-wider mb-1">Broadcast</div>
                                            {[
                                                { id: 'All Users', label: 'All Users (Staff + Customers)', icon: '📢' },
                                                { id: 'Staff', label: 'All Staff Only', icon: '👷' },
                                                { id: 'Customers', label: 'All Customers Only', icon: '🛍️' }
                                            ].map(opt => (
                                                <label key={opt.id} className="flex items-center gap-3 p-2 bg-white border border-neutral-100 rounded-md cursor-pointer hover:border-primary/30 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                                                        checked={composeData.target.includes(opt.id)}
                                                        onChange={(e) => {
                                                            const newTargets = e.target.checked
                                                                ? [...composeData.target, opt.id]
                                                                : composeData.target.filter(t => t !== opt.id);
                                                            setComposeData({ ...composeData, target: newTargets });
                                                        }}
                                                    />
                                                    <span className="text-sm text-neutral-700 flex items-center gap-2">
                                                        <span>{opt.icon}</span> {opt.label}
                                                    </span>
                                                </label>
                                            ))}

                                            <div className="col-span-full font-medium text-xs text-neutral-400 uppercase tracking-wider mt-4 mb-1">By Role</div>
                                            {[
                                                { id: 'Brand Admins', label: 'Brand Admins' },
                                                { id: 'Area Manager', label: 'Area Managers' },
                                                { id: 'Store Manager', label: 'Store Managers' },
                                                { id: 'Factory Manager', label: 'Factory Managers' }
                                            ].map(opt => (
                                                <label key={opt.id} className="flex items-center gap-3 p-2 bg-white border border-neutral-100 rounded-md cursor-pointer hover:border-primary/30 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                                                        checked={composeData.target.includes(opt.id)}
                                                        onChange={(e) => {
                                                            const newTargets = e.target.checked
                                                                ? [...composeData.target, opt.id]
                                                                : composeData.target.filter(t => t !== opt.id);
                                                            setComposeData({ ...composeData, target: newTargets });
                                                        }}
                                                    />
                                                    <span className="text-sm text-neutral-700">🔑 {opt.label}</span>
                                                </label>
                                            ))}
                                        </>
                                    )}

                                    {isBrandAdmin && (
                                        <>
                                            <div className="col-span-full font-medium text-xs text-neutral-400 uppercase tracking-wider mb-1">Brand Audience</div>
                                            {[
                                                { id: 'Brand Users', label: 'All Brand Users', icon: '📢' },
                                                { id: 'Brand Staff', label: 'Brand Staff Only', icon: '👷' },
                                                { id: 'Brand Customers', label: 'Brand Customers Only', icon: '🛍️' }
                                            ].map(opt => (
                                                <label key={opt.id} className="flex items-center gap-3 p-2 bg-white border border-neutral-100 rounded-md cursor-pointer hover:border-primary/30 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 text-primary rounded focus:ring-primary"
                                                        checked={composeData.target.includes(opt.id)}
                                                        onChange={(e) => {
                                                            const newTargets = e.target.checked
                                                                ? [...composeData.target, opt.id]
                                                                : composeData.target.filter(t => t !== opt.id);
                                                            setComposeData({ ...composeData, target: newTargets });
                                                        }}
                                                    />
                                                    <span className="text-sm text-neutral-700 flex items-center gap-2">
                                                        <span>{opt.icon}</span> {opt.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </>
                                    )}

                                    {isAreaManager && (
                                        <label className="flex items-center gap-3 p-2 bg-white border border-neutral-100 rounded-md cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-primary rounded"
                                                checked={composeData.target.includes('Area Staff')}
                                                onChange={(e) => {
                                                    const newTargets = e.target.checked ? ['Area Staff'] : [];
                                                    setComposeData({ ...composeData, target: newTargets });
                                                }}
                                            />
                                            <span className="text-sm text-neutral-700">📍 My Area Staff Only</span>
                                        </label>
                                    )}

                                    {isStoreManager && (
                                        <label className="flex items-center gap-3 p-2 bg-white border border-neutral-100 rounded-md cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-primary rounded"
                                                checked={composeData.target.includes('Store Staff')}
                                                onChange={(e) => {
                                                    const newTargets = e.target.checked ? ['Store Staff'] : [];
                                                    setComposeData({ ...composeData, target: newTargets });
                                                }}
                                            />
                                            <span className="text-sm text-neutral-700">🏪 My Store Staff Only</span>
                                        </label>
                                    )}
                                </div>
                                {composeData.target.length === 0 && (
                                    <p className="mt-1 text-xs text-red-500">Please select at least one target audience.</p>
                                )}
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
                                <Button
                                    type="submit"
                                    icon={Send}
                                    isLoading={sending}
                                    disabled={composeData.target.length === 0}
                                >
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
                                        <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1 flex-wrap">
                                            <Users size={12} /> Target: {Array.isArray(item.target) ? item.target.join(', ') : item.target}
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
