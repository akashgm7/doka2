const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const run = async () => {
    try {
        const conn = await mongoose.createConnection(process.env.MONGODB_URI, { dbName: 'doka_cake_app' }).asPromise();
        const Order = conn.model('Order', new mongoose.Schema({}, { strict: false }));

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        console.log('Today Start (Local):', startOfToday);
        console.log('Today Start (UTC):', startOfToday.toISOString());

        const todayOrders = await Order.find({
            brandId: 'brand-001',
            createdAt: { $gte: startOfToday }
        }).sort({ createdAt: -1 });

        console.log('--- Today Orders for brand-001 ---');
        console.log('Count:', todayOrders.length);

        let total = 0;
        todayOrders.forEach(o => {
            const price = o.totalPrice || o.totalAmount || 0;
            total += price;
            console.log(`Order ${o._id}: Price=${price}, CreatedAt=${o.createdAt.toISOString()}`);
        });

        console.log('Total Revenue:', total);

        await conn.close();
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
