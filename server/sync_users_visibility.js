const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const sync = async () => {
    try {
        if (dokaConnection.readyState !== 1) await new Promise(r => dokaConnection.once('open', r));
        const User = dokaConnection.collection('users');

        console.log("Syncing store@cake.com and area@cake.com in doka_cake_app...");

        await User.updateOne(
            { email: 'store@cake.com' },
            { $set: { assignedOutlets: ["6996a03e2360532bcd99781e"] } }
        );

        await User.updateOne(
            { email: 'area@cake.com' },
            { $set: { assignedOutlets: ["6996a03e2360532bcd99781e", "6996a03e2360532bcd99781f"] } }
        );

        console.log("Sync complete.");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

sync();
