const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const check = async () => {
    try {
        await new Promise(resolve => dokaConnection.on('open', resolve));
        const Order = dokaConnection.model('Order', new mongoose.Schema({ status: String, brandId: String, createdAt: Date }));

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const orders = await Order.find({ createdAt: { $gte: startOfToday } }, 'status brandId');
        console.log('Today\'s Orders:', JSON.stringify(orders, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

check();
