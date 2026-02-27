const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const check = async () => {
    try {
        await new Promise(resolve => dokaConnection.on('open', resolve));
        const Order = dokaConnection.model('Order', new mongoose.Schema({ status: String, createdAt: Date }));

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const counts = await Order.aggregate([
            { $match: { createdAt: { $gte: startOfToday } } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        console.log('Today\'s Order Counts:', JSON.stringify(counts, null, 2));

        const allCounts = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        console.log('Total Order Counts (All Time):', JSON.stringify(allCounts, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

check();
