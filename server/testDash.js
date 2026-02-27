const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { dokaConnection } = require('./config/db');

async function testQuery() {
    await new Promise(r => setTimeout(r, 2000));
    const Order = dokaConnection.model('Order', new mongoose.Schema({}, { strict: false }));

    // Exact dashboard query for 'Week'
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 7);

    let baseQuery = {};
    baseQuery.createdAt = { $gte: startDate };
    baseQuery.$or = [
        { storeId: { $in: ['6996a03e2360532bcd99781e', '6996a03e2360532bcd99781f'] } },
        { storeId: { $exists: false }, brandId: 'brand-001' },
        { storeId: null, brandId: 'brand-001' }
    ];

    const count = await Order.countDocuments(baseQuery);
    console.log('Count for Week query:', count);

    // What are the createdAt dates of the newest 5 orders?
    const newest = await Order.find().sort({ createdAt: -1 }).limit(5).lean();
    newest.forEach(o => console.log(o.createdAt));

    process.exit(0);
}
testQuery().catch(e => { console.error(e); process.exit(1); });
