const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const check = async () => {
    try {
        await new Promise(resolve => dokaConnection.on('open', resolve));
        const Order = dokaConnection.model('Order', new mongoose.Schema({ status: String, createdAt: Date }));

        const order = await Order.findOne({ status: 'Delivered' }).sort({ createdAt: -1 });
        if (order) {
            console.log('Latest Delivered Order:', JSON.stringify(order, null, 2));
            console.log('Current Server Time:', new Date().toISOString());
        } else {
            console.log('No Delivered orders found.');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

check();
