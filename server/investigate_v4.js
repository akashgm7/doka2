const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { adminConnection, dokaConnection } = require('./config/db');

const investigate = async () => {
    let output = "";
    const log = (msg) => {
        console.log(msg);
        output += msg + "\n";
    };

    try {
        log("Connecting to DBs...");
        if (adminConnection.readyState !== 1) await new Promise(r => adminConnection.once('open', r));
        if (dokaConnection.readyState !== 1) await new Promise(r => dokaConnection.once('open', r));

        const Order = dokaConnection.collection('orders');
        const Store = adminConnection.collection('stores');

        const allStores = await Store.find({}).toArray();
        log(`Total Stores in admin_db: ${allStores.length}`);
        allStores.forEach(s => {
            log(` - ${s.name} (ID: ${s._id})`);
        });

        const storeManager = await adminConnection.collection('users').findOne({ email: 'store@cake.com' });
        log(`Store Manager Assigned Outlets: ${JSON.stringify(storeManager.assignedOutlets)}`);

        // Check if any orders match the assigned outlets
        const matchingOrders = await Order.countDocuments({ storeId: { $in: storeManager.assignedOutlets } });
        log(`Orders matching assigned outlets directly: ${matchingOrders}`);

        process.exit(0);
    } catch (error) {
        log("Investigation failed: " + error);
        process.exit(1);
    }
};

investigate();
