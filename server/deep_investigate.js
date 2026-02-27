const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { adminConnection, dokaConnection } = require('./config/db');

const investigate = async () => {
    try {
        console.log("Connecting to DBs...");
        if (adminConnection.readyState !== 1) await new Promise(r => adminConnection.once('open', r));
        if (dokaConnection.readyState !== 1) await new Promise(r => dokaConnection.once('open', r));

        const Order = dokaConnection.collection('orders');
        const Store = dokaConnection.collection('stores');

        const allOrders = await Order.find({}).toArray();
        console.log(`Total Orders: ${allOrders.length}`);

        const storeIdCounts = {};
        allOrders.forEach(o => {
            const sid = String(o.storeId);
            storeIdCounts[sid] = (storeIdCounts[sid] || 0) + 1;
        });
        console.log("Store ID counts in orders:", storeIdCounts);

        const allStores = await Store.find({}).toArray();
        console.log(`Total Stores: ${allStores.length}`);
        allStores.forEach(s => {
            console.log(` - ${s.name} (ID: ${s._id})`);
        });

        const users = await adminConnection.collection('users').find({ role: { $in: ['Store Manager', 'Area Manager'] } }).toArray();
        console.log(`Managers found: ${users.length}`);
        users.forEach(u => {
            console.log(` - ${u.email} (${u.role}) Assigned: ${JSON.stringify(u.assignedOutlets)}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Investigation failed:", error);
        process.exit(1);
    }
};

investigate();
