const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const baseUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doka_cake_app';

const run = async () => {
    try {
        const conn = await mongoose.createConnection(baseUri, { dbName: 'doka_cake_app' }).asPromise();
        console.log('Connected to doka_cake_app');

        const Order = conn.model('Order', new mongoose.Schema({}, { strict: false }));
        const User = conn.model('User', new mongoose.Schema({}, { strict: false }));

        const orderCount = await Order.countDocuments();
        console.log(`Total Orders: ${orderCount}`);

        if (orderCount > 0) {
            const latestOrder = await Order.findOne().sort({ createdAt: -1 }).lean();
            console.log('Latest Order Structure:');
            console.log(JSON.stringify(latestOrder, null, 2));
        }

        const userCount = await User.countDocuments();
        console.log(`Total Users: ${userCount}`);

        if (userCount > 0) {
            const latestUser = await User.findOne().sort({ createdAt: -1 }).lean();
            console.log('Latest User Structure:');
            console.log(JSON.stringify(latestUser, null, 2));
        }

        await conn.close();
    } catch (error) {
        console.error('Error:', error);
    }
};

run();
