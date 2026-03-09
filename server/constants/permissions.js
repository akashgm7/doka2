const PERMISSIONS = [
    // System & Configuration
    { id: 'sys_login', label: 'App / System Login', category: 'System' },
    { id: 'sys_logout', label: 'Logout / Session Control', category: 'System' },
    { id: 'manage_users', label: 'User Creation (Any Role)', category: 'System' },
    { id: 'manage_roles', label: 'Role & Permission Definition', category: 'System' },
    { id: 'manage_brands', label: 'Brand Creation / Management', category: 'System' },
    { id: 'brand_switching', label: 'Brand Switching', category: 'System' },
    { id: 'manage_locations', label: 'Location (Outlet) Creation', category: 'System' },
    { id: 'view_locations', label: 'View Locations', category: 'System' },
    { id: 'toggle_outlet', label: 'Enable / Disable Outlet', category: 'System' },
    { id: 'view_audit_logs', label: 'Audit Logs', category: 'System' },
    { id: 'feature_toggles', label: 'Feature Toggle (Config)', category: 'System' },
    { id: 'system_config', label: 'System Configuration', category: 'System' },

    // Menu & Inventory
    { id: 'manage_master_menu', label: 'Master Menu Management', category: 'Menu' },
    { id: 'manage_outlet_menu', label: 'Outlet-Level Menu Control', category: 'Menu' },
    { id: 'toggle_item_availability', label: 'Item Availability Toggle', category: 'Menu' },
    { id: 'view_menu', label: 'View Menu & Ingredients', category: 'Menu' },

    // Orders
    { id: 'place_order_ready', label: 'Place Order (Ready-Made)', category: 'Orders' },
    { id: 'place_order_custom', label: 'Place Order (Make My Cake)', category: 'Orders' },
    { id: 'combine_order', label: 'Combine MMC + Ready-Made', category: 'Orders' },
    { id: 'view_orders', label: 'View Orders', category: 'Orders' },
    { id: 'manage_orders', label: 'Accept / Reject Orders', category: 'Orders' },
    { id: 'update_order_status', label: 'Update Order Status', category: 'Orders' },
    { id: 'cancel_orders', label: 'Cancel Orders', category: 'Orders' },
    { id: 'delivery_visibility', label: 'Delivery Status Visibility', category: 'Orders' },
    { id: 'delivery_assignment', label: 'Delivery Partner Assignment', category: 'Orders' },
    { id: 'geo_boundary', label: 'Delivery Radius / Geo Boundary', category: 'Orders' },

    // Production
    { id: 'factory_visibility', label: 'Factory Visibility', category: 'Production' },
    { id: 'factory_calendar', label: 'Factory Calendar Management (MMC)', category: 'Production' },
    { id: 'production_execution', label: 'Production Execution', category: 'Production' },
    { id: 'production_capacity', label: 'MMC Capacity / Slot Control', category: 'Production' },

    // Financial & Reports
    { id: 'view_reports', label: 'Analytics & Reports', category: 'Financial' },
    { id: 'view_payments', label: 'Payments & Transactions View', category: 'Financial' },
    { id: 'manage_refunds', label: 'Refund / Payment Intervention', category: 'Financial' },
    { id: 'download_invoices', label: 'Invoice Download', category: 'Financial' },

    // Marketing & CRM
    { id: 'notifications_automated', label: 'Push Notifications (Automated)', category: 'Marketing' },
    { id: 'notifications_manual', label: 'Push Notifications (Manual)', category: 'Marketing' },
    { id: 'loyalty_earn_redeem', label: 'Loyalty Points - Earn / Redeem', category: 'Marketing' },
    { id: 'loyalty_view', label: 'Loyalty Points - View', category: 'Marketing' },
    { id: 'add_ons_config', label: 'Add-Ons (Manual Config)', category: 'Marketing' },
    { id: 'ai_recommendations', label: 'AI Recommendations (View)', category: 'Marketing' },
    { id: 'order_history', label: 'Order History', category: 'Marketing' }
];

module.exports = PERMISSIONS;
