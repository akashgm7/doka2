const mongoose = require('mongoose');
require('dotenv').config();
const { dokaConnection } = require('./config/db');
const User = require('./models/User');
const Order = require('./models/Order');

async function check() {
    try {
        console.log("Waiting for DB connection...");
        await new Promise(r => setTimeout(r, 2000));

        const user = await User.findOne({ role: 'Brand Admin' });
        console.log('--- Brand Admin User ---');
        console.log('Email:', user ? user.email : 'N/A');
        console.log('Assigned Brand:', user ? user.assignedBrand : 'N/A');

        const totalOrders = await Order.countDocuments({});
        console.log('\n--- Orders ---');
        console.log('Total Orders:', totalOrders);

        if (user && user.assignedBrand) {
            const brandOrders = await Order.countDocuments({ brandId: user.assignedBrand });
            console.log(`Orders matching brandId "${user.assignedBrand}":`, brandOrders);
        }

        const nullBrandOrders = await Order.countDocuments({ brandId: { $exists: false } });
        console.log('Orders with no brandId field:', nullBrandOrders);

        const sampleOrder = await Order.findOne({});
        console.log('Sample Order brandId:', sampleOrder ? sampleOrder.brandId : 'N/A');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
