const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Simple random helpers
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Load env vars
dotenv.config();
require('./config/db');

const Order = require('./models/Order');
const Store = require('./models/Store');
const Product = require('./models/Product');

const seedAnalytics = async () => {
    try {
        console.log('Connecting to DB...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Fetching existing metadata (Stores, Products)...');
        const stores = await Store.find({ type: 'Outlet' });
        const factories = await Store.find({ type: 'Factory' });
        const products = await Product.find({});

        if (stores.length === 0 || products.length === 0) {
            console.error('Please run seed.js first to ensure Stores/Products exist.');
            process.exit(1);
        }

        const orders = [];
        const statuses = ['Completed', 'Completed', 'Completed', 'Pending', 'In Production', 'Cancelled'];
        const types = ['Standard', 'Standard', 'Standard', 'MMC'];
        const brands = ['brand-001']; // Assuming single brand for now

        console.log('Generating 100 historical orders...');

        for (let i = 0; i < 100; i++) {
            // Random date within last 30 days
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            const isMMC = types[Math.floor(Math.random() * types.length)] === 'MMC';
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const store = stores[Math.floor(Math.random() * stores.length)];
            const factory = factories[0]; // Assuming one factory for simplicity
            const product = products[Math.floor(Math.random() * products.length)];

            const quantity = Math.floor(Math.random() * 3) + 1;
            const price = product.basePrice || 25;
            const total = quantity * price;

            orders.push({
                orderId: `ORD-${date.getTime()}-${i}`,
                customerId: `CUST-${Math.floor(Math.random() * 1000)}`,
                customerName: `Customer ${i}`,
                items: [{
                    productId: product._id,
                    name: product.name,
                    quantity: quantity,
                    price: price
                }],
                totalAmount: total,
                status: status,
                paymentStatus: status === 'Cancelled' ? 'Failed' : 'Paid',
                storeId: isMMC ? null : store._id,
                factoryId: isMMC ? factory._id : null,
                brandId: 'brand-001',
                isMMC: isMMC,
                mmcConfig: isMMC ? { shape: 'Round', flavor: 'Chocolate', size: '1kg', tiers: '1', message: 'HBD' } : null,
                createdAt: date,
                updatedAt: date
            });
        }

        await Order.insertMany(orders);
        console.log('Analytics data seeded successfully!');
        process.exit();

    } catch (error) {
        console.error('Error seeding analytics:', error);
        process.exit(1);
    }
};

seedAnalytics();
