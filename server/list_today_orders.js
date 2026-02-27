const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const check = async () => {
    try {
        await new Promise(resolve => dokaConnection.on('open', resolve));
        const Order = dokaConnection.model('Order', new mongoose.Schema({ status: String, brandId: String, isMMC: Boolean, createdAt: Date }));

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const orders = await Order.find({ createdAt: { $gte: startOfToday } });
        console.log(`Found ${orders.length} orders from today:`);
        orders.forEach(o => {
            console.log(`ID: ${o._id}, Status: [${o.status}], Brand: [${o.brandId}], MMC: ${o.isMMC}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

check();
