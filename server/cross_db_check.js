const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { adminConnection, dokaConnection } = require('./config/db');

const check = async () => {
    let output = "--- DB Check ---\n";
    const log = (msg) => { console.log(msg); output += msg + "\n"; };

    try {
        if (adminConnection.readyState !== 1) await new Promise(r => adminConnection.once('open', r));
        if (dokaConnection.readyState !== 1) await new Promise(r => dokaConnection.once('open', r));

        log("Checking Users in both DBs...");
        const adminUsers = await adminConnection.collection('users').find({ email: 'store@cake.com' }).toArray();
        log(`Users in doka_admin_db: ${adminUsers.length}`);
        adminUsers.forEach(u => log(` - ${u.email} (Role: ${u.role}) Assigned: ${JSON.stringify(u.assignedOutlets)}`));

        const dokaUsers = await dokaConnection.collection('users').find({ email: 'store@cake.com' }).toArray();
        log(`Users in doka_cake_app: ${dokaUsers.length}`);
        dokaUsers.forEach(u => log(` - ${u.email} (Role: ${u.role}) Assigned: ${JSON.stringify(u.assignedOutlets)}`));

        log("\nChecking Stores in both DBs...");
        const adminStores = await adminConnection.collection('stores').find({}).toArray();
        log(`Stores in doka_admin_db: ${adminStores.length}`);
        adminStores.forEach(s => log(` - ${s.name} (${s._id})`));

        const dokaStores = await dokaConnection.collection('stores').find({}).toArray();
        log(`Stores in doka_cake_app: ${dokaStores.length}`);
        dokaStores.forEach(s => log(` - ${s.name} (${s._id})`));

        log("\nChecking Orders in doka_cake_app...");
        const orders = await dokaConnection.collection('orders').find({ storeId: { $ne: "undefined" } }).toArray();
        log(`Orders with defined storeId: ${orders.length}`);
        orders.slice(0, 5).forEach(o => log(` - Order ${o.orderId || o._id}: storeId="${o.storeId}" (type: ${typeof o.storeId})`));

        fs.writeFileSync('cross_db_check.txt', output);
        process.exit(0);
    } catch (error) {
        log("Check failed: " + error);
        process.exit(1);
    }
};

check();
