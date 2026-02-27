const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const fixData = async () => {
    try {
        if (dokaConnection.readyState !== 1) await new Promise(r => dokaConnection.once('open', r));
        const Order = dokaConnection.collection('orders');

        // Assign some orders to Downtown Bakery (6996a03e2360532bcd99781e)
        // and some to Uptown Café (6996a03e2360532bcd99781f)

        console.log("Updating orders for Store Manager visibility...");

        // Update 10 orders to Downtown Bakery
        const ordersToUpdate = await Order.find({ storeId: "undefined" }).limit(10).toArray();
        const ids = ordersToUpdate.map(o => o._id);

        await Order.updateMany(
            { _id: { $in: ids.slice(0, 5) } },
            { $set: { storeId: "6996a03e2360532bcd99781e" } }
        );

        await Order.updateMany(
            { _id: { $in: ids.slice(5, 10) } },
            { $set: { storeId: "6996a03e2360532bcd99781f" } }
        );

        console.log("Updated 5 orders to Downtown Bakery and 5 to Uptown Café.");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fixData();
