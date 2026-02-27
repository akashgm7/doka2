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
        const Store = dokaConnection.collection('stores');

        const allOrders = await Order.find({}).toArray();
        log(`Total Orders: ${allOrders.length}`);

        const storeIdCounts = {};
        allOrders.forEach(o => {
            const sid = String(o.storeId);
            storeIdCounts[sid] = (storeIdCounts[sid] || 0) + 1;
        });
        log("Store ID counts in orders: " + JSON.stringify(storeIdCounts));

        const allStores = await Store.find({}).toArray();
        log(`Total Stores: ${allStores.length}`);
        allStores.forEach(s => {
            log(` - ${s.name} (ID: ${s._id})`);
        });

        const users = await adminConnection.collection('users').find({ role: { $in: ['Store Manager', 'Area Manager'] } }).toArray();
        log(`Managers found: ${users.length}`);
        users.forEach(u => {
            log(` - ${u.email} (${u.role}) Assigned: ${JSON.stringify(u.assignedOutlets)}`);
        });

        fs.writeFileSync('investigation_results.txt', output);
        process.exit(0);
    } catch (error) {
        log("Investigation failed: " + error);
        process.exit(1);
    }
};

investigate();
