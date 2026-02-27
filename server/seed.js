const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars via dotenv *before* loading db config
dotenv.config();

// Import db config to establish connections
require('./config/db');

const User = require('./models/User');
const Store = require('./models/Store');
const Product = require('./models/Product');
const Order = require('./models/Order');

const seedData = async () => {
    try {
        // Wait briefly for connections to open (simple approach for script)
        console.log('Connecting to Databases...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Use the connection from the model for bulk operations if needed, 
        // or just use the model directly as it is bound to the connection.

        console.log('Clearing existing data...');
        await User.deleteMany();
        await Order.deleteMany(); // Uses dokaConnection
        await Store.deleteMany(); // Uses adminConnection
        await Product.deleteMany(); // Uses adminConnection

        // --- STORES (Admin DB) ---
        const stores = await Store.insertMany([
            { name: 'Downtown Bakery', type: 'Outlet', address: '123 Main St', brandId: 'brand-001' },
            { name: 'Uptown Café', type: 'Outlet', address: '456 High St', brandId: 'brand-001' },
            { name: 'Central Kitchen', type: 'Factory', address: '789 Ind. Park', brandId: 'brand-001' }
        ]);
        const loc1 = stores[0]._id;
        const loc2 = stores[1]._id;
        const factory = stores[2]._id;
        console.log('Stores Seeded (Admin DB)');

        // --- USERS (Doka App DB) ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password', salt);

        const userDocs = [
            { name: 'Super Admin', email: 'super@admin.com', password: hashedPassword, role: 'Super Admin' },
            { name: 'Brand Admin', email: 'brand@cake.com', password: hashedPassword, role: 'Brand Admin', assignedBrand: 'brand-001' },
            { name: 'Area Manager', email: 'area@cake.com', password: hashedPassword, role: 'Area Manager', assignedBrand: 'brand-001', assignedOutlets: [loc1, loc2] },
            { name: 'Store Manager', email: 'store@cake.com', password: hashedPassword, role: 'Store Manager', assignedBrand: 'brand-001', assignedOutlets: [loc1] },
            { name: 'Factory Lead', email: 'factory@cake.com', password: hashedPassword, role: 'Factory User', assignedFactory: factory }
        ];
        await User.insertMany(userDocs);
        console.log('Users Seeded (Doka App DB)');

        // --- PRODUCTS (Admin DB) ---
        const products = await Product.insertMany([
            { name: 'Chocolate Truffle', category: 'Standard', basePrice: 25, sku: 'CK-001' },
            { name: 'Red Velvet', category: 'Standard', basePrice: 30, sku: 'CK-002' },
            { name: 'Custom Shape Base', category: 'MMC', basePrice: 50, sku: 'MMC-001' }
        ]);
        console.log('Products Seeded (Admin DB)');

        // --- ORDERS (Doka App DB) ---
        await Order.insertMany([
            {
                orderId: 'ORD-001',
                customerId: 'CUST-01',
                customerName: 'Alice Brown',
                totalAmount: 50,
                status: 'Pending',
                storeId: loc1,
                items: [{ productId: products[0]._id, name: 'Chocolate Truffle', quantity: 2, price: 25 }]
            },
            {
                orderId: 'ORD-MMC-01',
                customerId: 'CUST-02',
                customerName: 'Bob White',
                totalAmount: 150,
                status: 'Confirmed',
                isMMC: true,
                factoryId: factory,
                mmcConfig: { shape: 'Heart', flavor: 'Vanilla', size: '2kg', tiers: '1', message: 'Love You' },
                items: [{ productId: products[2]._id, name: 'Custom Cake', quantity: 1, price: 150 }]
            }
        ]);
        console.log('Orders Seeded (Doka App DB)');

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedData();
