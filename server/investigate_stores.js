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

        const User = adminConnection.model('User', new mongoose.Schema({
            email: String,
            role: String,
            assignedOutlets: [String]
        }));

        const Store = dokaConnection.model('Store', new mongoose.Schema({
            name: String,
            brandId: String
        }));

        const storeManager = await User.findOne({ email: 'store@cake.com' });
        console.log("Store Manager (store@cake.com) assignedOutlets:", storeManager ? storeManager.assignedOutlets : "Not found");

        const stores = await Store.find({});
        console.log("Available Stores (Name and _id):");
        stores.forEach(s => {
            console.log(` - ${s.name} (${s._id})`);
        });

        const orders = await dokaConnection.collection('orders').find({}).limit(5).toArray();
        console.log("Sample Orders (storeId property):");
        orders.forEach(o => {
            console.log(` - Order ${o.orderId || o._id}: storeId="${o.storeId}"`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Investigation failed:", error);
        process.exit(1);
    }
};

investigate();
