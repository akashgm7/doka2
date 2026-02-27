const PERMISSIONS = [
    // System & Configuration
    { id: 'view_dashboard', label: 'Access Dashboard', category: 'System' },
    { id: 'manage_roles', label: 'Role & Permission Definition', category: 'System' },
    { id: 'manage_brands', label: 'Brand Creation / Management', category: 'System' },
    { id: 'manage_locations', label: 'Location (Outlet) Creation', category: 'System' },
    { id: 'view_audit_logs', label: 'Audit Logs', category: 'System' },
    { id: 'system_config', label: 'System Configuration', category: 'System' },
    { id: 'feature_toggles', label: 'Feature Toggle (Config)', category: 'System' },

    // Users
    { id: 'manage_users', label: 'User Management', category: 'Users' },

    // Menu & Inventory
    { id: 'manage_master_menu', label: 'Master Menu Management', category: 'Menu' },
    { id: 'manage_outlet_menu', label: 'Outlet-Level Menu Control', category: 'Menu' },
    { id: 'view_menu', label: 'View Menu & Ingredients', category: 'Menu' },

    // Orders
    { id: 'view_orders', label: 'View Orders', category: 'Orders' },
    { id: 'manage_orders', label: 'Update Order Status', category: 'Orders' },
    { id: 'cancel_orders', label: 'Cancel Orders', category: 'Orders' },

    // Production
    { id: 'view_production', label: 'Factory Visibility', category: 'Production' },
    { id: 'manage_production', label: 'Production Execution', category: 'Production' },
    { id: 'manage_factory_calendar', label: 'Factory Calendar Management', category: 'Production' },

    // Notifications
    { id: 'notifications_manual', label: 'Push Notifications (Manual)', category: 'Notifications' },
    { id: 'notifications_automated', label: 'Push Notifications (Automated)', category: 'Notifications' },

    // Financial & Reports
    { id: 'view_reports', label: 'Analytics & Reports', category: 'Financial' },
    { id: 'view_payments', label: 'Payments & Transactions View', category: 'Financial' },
    { id: 'manage_refunds', label: 'Refund / Payment Intervention', category: 'Financial' },
    { id: 'download_invoices', label: 'Invoice Download', category: 'Financial' },
];

module.exports = PERMISSIONS;
