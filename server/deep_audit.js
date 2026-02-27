const mongoose = require('mongoose');
require('dotenv').config();

async function deepAudit() {
    try {
        const uri = process.env.MONGODB_URI;
        const conn = await mongoose.createConnection(uri, { dbName: 'doka_cake_app' }).asPromise();
        console.log('Connected to doka_cake_app');

        const Order = conn.model('Order', new mongoose.Schema({
            isMMC: Boolean,
            totalPrice: Number,
            totalAmount: Number,
            createdAt: Date,
            orderId: String,
            status: String
        }, { timestamps: true }));

        const allOrders = await Order.find({
            createdAt: {
                $gte: new Date('2026-02-01T00:00:00.000Z'),
                $lt: new Date('2026-03-01T00:00:00.000Z')
            }
        }).sort({ createdAt: 1 });

        console.log(`Found ${allOrders.length} orders in February.`);

        const daily = {};
        allOrders.forEach(o => {
            const date = o.createdAt.toISOString().split('T')[0];
            const rev = (o.totalPrice || o.totalAmount || 0);
            if (!daily[date]) daily[date] = { count: 0, revenue: 0, ids: [] };
            daily[date].count++;
            daily[date].revenue += rev;
            daily[date].ids.push({ id: o._id, rev, status: o.status });
        });

        Object.keys(daily).forEach(date => {
            console.log(`${date}: ${daily[date].count} orders, Total Revenue: ${daily[date].revenue}`);
            // If revenue is suspicious (like 9190 and I thought I deleted it), investigate
            if (daily[date].revenue === 9190) {
                console.log(`[!] Suspicious revenue match on ${date}`);
            }
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

deepAudit();
