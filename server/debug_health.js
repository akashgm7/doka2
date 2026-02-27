const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const debug = async () => {
    try {
        await new Promise(resolve => dokaConnection.on('open', resolve));
        const Order = dokaConnection.model('Order', new mongoose.Schema({ status: String, createdAt: Date }));

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const baseQuery = { createdAt: { $gte: startOfToday } };

        const deliveredCount = await Order.countDocuments({ ...baseQuery, status: 'Delivered' });
        const failedCount = await Order.countDocuments({ ...baseQuery, status: 'Cancelled' });
        const meaningfulOrders = deliveredCount + failedCount;
        const successRate = meaningfulOrders > 0 ? Math.round((deliveredCount / meaningfulOrders) * 100) : 100;

        console.log('--- DEBUG DELIVERY HEALTH ---');
        console.log('Delivered Count:', deliveredCount);
        console.log('Failed Count:', failedCount);
        console.log('Meaningful Orders:', meaningfulOrders);
        console.log('Success Rate:', successRate);
        console.log('--- ALL TODAY ORDERS ---');
        const orders = await Order.find(baseQuery);
        orders.forEach(o => console.log(`ID: ${o._id}, Status: [${o.status}]`));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debug();
