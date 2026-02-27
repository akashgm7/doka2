const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const Role = require('./models/Role');

const PERMISSIONS = [
    'view_dashboard', 'manage_roles', 'manage_brands', 'manage_locations', 'view_audit_logs',
    'system_config', 'feature_toggles', 'manage_users', 'manage_master_menu',
    'manage_outlet_menu', 'manage_menu', 'view_menu', 'view_orders', 'manage_orders',
    'cancel_orders', 'view_production', 'manage_production',
    'manage_factory_calendar', 'notifications_manual', 'notifications_automated',
    'view_reports', 'view_payments', 'manage_refunds', 'download_invoices'
];

const initialRoles = [
    {
        name: 'Super Admin',
        description: 'Full system access',
        permissions: [
            'view_dashboard', 'manage_roles', 'manage_brands', 'manage_locations', 'view_audit_logs',
            'system_config', 'feature_toggles', 'manage_users', 'manage_master_menu',
            'manage_menu', 'view_menu', 'view_orders', 'manage_orders', 'cancel_orders',
            'view_production', 'notifications_manual', 'notifications_automated',
            'view_reports', 'view_payments', 'manage_refunds', 'download_invoices'
        ],
        isSystem: true
    },
    {
        name: 'Brand Admin',
        description: 'Manage specific brand',
        permissions: [
            'view_dashboard', 'manage_users', 'manage_locations', 'manage_master_menu', 'manage_outlet_menu',
            'manage_menu', 'view_menu', 'view_orders', 'cancel_orders', 'view_production',
            'manage_factory_calendar', 'notifications_automated', 'view_reports',
            'view_payments', 'manage_refunds', 'download_invoices', 'view_audit_logs',
            'feature_toggles'
        ],
        isSystem: true
    },
    {
        name: 'Area Manager',
        description: 'Oversee multiple stores',
        permissions: [
            'view_dashboard', 'view_menu', 'view_orders', 'cancel_orders', 'notifications_manual',
            'notifications_automated', 'view_reports', 'view_payments',
            'manage_refunds', 'download_invoices', 'view_audit_logs'
        ],
        isSystem: true
    },
    {
        name: 'Store Manager',
        description: 'Manage single store',
        permissions: [
            'view_dashboard', 'manage_outlet_menu', 'view_menu', 'view_orders', 'manage_orders',
            'cancel_orders', 'notifications_manual', 'notifications_automated',
            'view_reports', 'view_payments', 'download_invoices'
        ],
        isSystem: true
    },
    {
        name: 'Factory Manager',
        description: 'Manage production',
        permissions: [
            'view_dashboard', 'view_menu', 'view_orders', 'manage_orders', 'cancel_orders',
            'view_production', 'manage_production', 'manage_factory_calendar',
            'view_reports', 'view_payments', 'download_invoices', 'view_audit_logs'
        ],
        isSystem: true
    },
    {
        name: 'Store User',
        description: 'Basic store operations',
        permissions: ['view_dashboard', 'view_menu', 'view_orders'],
        isSystem: true
    }
];

const seedRoles = async () => {
    try {
        console.log('Seeding roles...');

        // Wait for connection to be ready
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }

        for (const roleData of initialRoles) {
            await Role.findOneAndUpdate(
                { name: roleData.name },
                roleData,
                { upsert: true, new: true }
            );
            console.log(`Role seeded/updated: ${roleData.name}`);
        }

        console.log('All roles seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding roles:', error);
        process.exit(1);
    }
};

seedRoles();
