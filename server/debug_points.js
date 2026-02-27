const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');
const Order = require('./models/Order');
const User = require('./models/User');

dokaConnection.on('open', async () => {
    try {
        console.log('--- ORDERS WITH POINTS ---');
        const orders = await Order.find({ earnedLoyaltyPoints: { $gt: 0 } })
            .select('orderId totalAmount totalPrice earnedLoyaltyPoints createdAt')
            .lean();
        orders.forEach(o => {
            console.log(`Order: ${o.orderId || o._id}, Points: ${o.earnedLoyaltyPoints}, Date: ${o.createdAt}`);
        });

        console.log('\n--- USERS WITH POINTS ---');
        const users = await User.find({ loyaltyPoints: { $gt: 0 } })
            .select('name email loyaltyPoints')
            .lean();
        console.log(JSON.stringify(users, null, 2));

        const totalPointsSum = orders.reduce((sum, o) => sum + (o.earnedLoyaltyPoints || 0), 0);
        console.log('\nTOTAL SUM OF EARNED POINTS:', totalPointsSum);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
