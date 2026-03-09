import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import {
    LayoutDashboard,
    Users,
    ClipboardList,
    ShoppingBag,
    Settings,
    Factory,
    PieChart,
    LogOut,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Shield,
    Gift,
    Bell,
    FileText,
    CreditCard,
    Cake
} from 'lucide-react';
import clsx from 'clsx';
import ConfirmationModal from '../ui/ConfirmationModal';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const role = user?.role;

    const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
        setIsLogoutModalOpen(false);
    };

    const getDashboardPath = (role, scopeLevel) => {
        if (role === 'Area Manager') return '/area/dashboard'; // Keep explicit mapping for Area Manager if needed
        switch (scopeLevel) {
            case 'System': return '/super-admin/dashboard';
            case 'Brand': return '/brand/dashboard';
            case 'Outlet': return '/store/dashboard';
            case 'Factory': return '/factory/dashboard';
            default: return '/dashboard';
        }
    };

    const allMenuItems = [
        { title: 'Dashboard', path: getDashboardPath(user?.role, user?.scopeLevel), icon: LayoutDashboard, permission: 'sys_login' },
        { title: 'Location Management', path: '/locations', icon: MapPin, permission: 'manage_locations' },
        { title: 'Roles & Permissions', path: '/roles', icon: Shield, permission: 'manage_roles' },
        { title: 'Loyalty Program', path: '/loyalty', icon: Gift, permission: 'loyalty_view' },
        { title: 'Notifications', path: '/notifications', icon: Bell, permission: 'notifications_manual' },
        { title: 'Menu Management', path: '/menu', icon: ClipboardList, permission: 'view_menu' },
        { title: 'User Management', path: '/users', icon: Users, permission: 'manage_users' },
        { title: 'Orders', path: '/orders', icon: ShoppingBag, permission: 'view_orders' },
        { title: 'Production', path: '/production', icon: Factory, permission: 'factory_visibility' },
        { title: 'Payment History', path: '/payments', icon: CreditCard, permission: 'view_payments' },
        { title: 'Reports', path: '/reports', icon: PieChart, permission: 'view_reports' },
        { title: 'Audit Logs', path: '/audit-logs', icon: FileText, permission: 'view_audit_logs' },
        { title: 'Settings', path: '/settings', icon: Settings, permission: 'system_config' },
    ];

    const filteredItems = allMenuItems.filter(item => {
        if (!user) return false;
        if (user.scopeLevel === 'System' || user.role === 'Super Admin') return true;
        const userPerms = Array.isArray(user.permissions) ? user.permissions : [];
        if (item.title === 'Dashboard') return true;
        if (item.permission && userPerms.includes(item.permission)) return true;
        return false;
    });

    return (
        <aside
            className={clsx(
                "fixed inset-y-0 left-0 z-50 bg-white border-r border-neutral-100 shadow-sidebar transition-all duration-300 ease-in-out flex flex-col",
                isOpen ? "w-[260px]" : "w-[72px]"
            )}
        >
            {/* Logo */}
            <div className={clsx("h-[72px] flex items-center border-b border-neutral-100 shrink-0", isOpen ? "px-6" : "justify-center px-0")}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-400 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
                        <Cake size={22} />
                    </div>
                    {isOpen && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-lg font-bold text-neutral-900 tracking-tight leading-none">DOKA</span>
                            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">Admin</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex items-center rounded-xl transition-all duration-200 group relative",
                            isOpen ? "px-3 py-2.5 gap-3" : "px-0 py-2.5 justify-center",
                            isActive
                                ? "bg-primary/[0.08] text-primary font-semibold shadow-sm"
                                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                                )}
                                <item.icon className={clsx("w-[18px] h-[18px] shrink-0", isActive ? "text-primary" : "")} />
                                {isOpen && <span className="text-[13px] truncate">{item.title}</span>}
                                {!isOpen && (
                                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap z-50 shadow-dropdown font-medium">
                                        {item.title}
                                    </div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 border-t border-neutral-100 space-y-2 shrink-0">
                <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    className={clsx(
                        "flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-all duration-200",
                        isOpen ? "gap-3" : "justify-center"
                    )}
                >
                    <LogOut size={18} />
                    {isOpen && <span className="text-[13px]">Logout</span>}
                </button>

                <div className={clsx("flex items-center rounded-xl p-2", isOpen ? "justify-between bg-neutral-50" : "justify-center")}>
                    {isOpen && (
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-semibold text-neutral-800 truncate">{user?.name}</span>
                                <span className="text-[10px] text-neutral-400 truncate">{user?.role}</span>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-lg hover:bg-neutral-200/60 text-neutral-400 transition-colors shrink-0"
                    >
                        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isLogoutModalOpen}
                title="Logout"
                message="Are you sure you want to end your session?"
                confirmText="Logout"
                onConfirm={handleLogout}
                onCancel={() => setIsLogoutModalOpen(false)}
            />
        </aside>
    );
};

export default Sidebar;
