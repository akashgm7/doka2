const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { dokaConnection } = require('./config/db');
const User = require('./models/User');
const Role = require('./models/Role');
const PERMISSIONS = require('./constants/permissions');

const seedRBAC = async () => {
    try {
        console.log('Connecting to database...');

        // Clear existing roles and test users
        await Role.deleteMany({});
        // We don't delete all users, just the ones we are about to seed to avoid duplicates
        const testEmails = [
            'superadmin@doka.com',
            'brand@doka.com',
            'area@doka.com',
            'store@doka.com',
            'factory@doka.com',
            'customer@doka.com'
        ];
        await User.deleteMany({ email: { $in: testEmails } });

        console.log('Seeding Roles...');

        const allPermissionIds = PERMISSIONS.map(p => p.id);

        const roles = [
            {
                name: 'Super Admin',
                permissions: allPermissionIds,
                scopeLevel: 'System'
            },
            {
                name: 'Brand Admin',
                scopeLevel: 'Brand',
                permissions: [
                    'sys_login', 'sys_logout', 'manage_users', 'brand_switching',
                    'view_locations', 'view_audit_logs', 'manage_master_menu',
                    'view_menu', 'view_orders', 'manage_orders', 'view_reports',
                    'view_payments', 'notifications_automated', 'notifications_manual'
                ]
            },
            {
                name: 'Area Manager',
                scopeLevel: 'Outlet',
                permissions: [
                    'sys_login', 'sys_logout', 'view_locations', 'view_menu',
                    'view_orders', 'manage_orders', 'view_reports', 'notifications_automated'
                ]
            },
            {
                name: 'Store Manager',
                scopeLevel: 'Outlet',
                permissions: [
                    'sys_login', 'sys_logout', 'manage_outlet_menu', 'toggle_item_availability',
                    'view_menu', 'view_orders', 'manage_orders', 'update_order_status',
                    'cancel_orders', 'delivery_visibility', 'notifications_automated'
                ]
            },
            {
                name: 'Factory Manager',
                scopeLevel: 'Factory',
                permissions: [
                    'sys_login', 'sys_logout', 'factory_visibility', 'factory_calendar',
                    'production_execution', 'production_capacity', 'view_menu',
                    'view_orders', 'update_order_status'
                ]
            },
            {
                name: 'Customers',
                scopeLevel: 'None',
                permissions: [
                    'sys_login', 'sys_logout', 'view_menu', 'place_order_ready',
                    'place_order_custom', 'view_orders', 'order_history',
                    'loyalty_view', 'loyalty_earn_redeem'
                ]
            }
        ];

        await Role.insertMany(roles);
        console.log('Roles seeded successfully.');

        console.log('Seeding Users...');

        const users = [
            {
                name: 'Super Admin User',
                email: 'superadmin@doka.com',
                password: 'password123',
                role: 'Super Admin',
                status: 'Active'
            },
            {
                name: 'Brand Admin User',
                email: 'brand@doka.com',
                password: 'password123',
                role: 'Brand Admin',
                assignedBrand: 'brand-001',
                status: 'Active'
            },
            {
                name: 'Area Manager User',
                email: 'area@doka.com',
                password: 'password123',
                role: 'Area Manager',
                assignedBrand: 'brand-001',
                assignedOutlets: ['Main Store', 'Outlet A'],
                status: 'Active'
            },
            {
                name: 'Store Manager User',
                email: 'store@doka.com',
                password: 'password123',
                role: 'Store Manager',
                assignedBrand: 'brand-001',
                assignedOutlets: ['Main Store'],
                status: 'Active'
            },
            {
                name: 'Factory Manager User',
                email: 'factory@doka.com',
                password: 'password123',
                role: 'Factory Manager',
                assignedBrand: 'brand-001',
                assignedFactory: 'Factory Alpha',
                status: 'Active'
            },
            {
                name: 'Test Customer',
                email: 'customer@doka.com',
                password: 'password123',
                role: 'Customers',
                assignedBrand: 'brand-001',
                status: 'Active'
            }
        ];

        // We use create instead of insertMany to trigger pre-save hooks (though we manually hashed here)
        // Actually, since we hashed manually and want to be fast, insertMany is fine if we bypass the hook or adjust the model
        // To be safe, let's use the model's create
        for (const u of users) {
            await User.create(u);
        }

        console.log('\n=============================================');
        console.log('✅ Users seeded successfully!');
        console.log('=============================================');
        console.log('Login Credentials Summary:');
        console.table(users.map(u => ({
            Role: u.role,
            Email: u.email,
            Password: u.password,
            Scope: u.assignedBrand || u.assignedFactory || (u.assignedOutlets ? u.assignedOutlets.join(', ') : 'System/None')
        })));
        console.log('=============================================\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

dokaConnection.on('connected', seedRBAC);
