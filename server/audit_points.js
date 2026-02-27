const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

// Explicitly require models so they are registered on the connections
const User = require('./models/User');
const Order = require('./models/Order');

dokaConnection.on('open', async () => {
    try {
        const orders = await Order.find({ earnedLoyaltyPoints: { $gt: 0 } }).lean();
        let total = 0;
        for (const o of orders) {
            const user = await User.findById(o.user).select('email').lean();
            console.log(`ORDER:${o._id}|USER:${user?.email || 'N/A'}|PTS:${o.earnedLoyaltyPoints}|AMT:${o.totalPrice}|DATE:${o.createdAt.toISOString()}`);
            total += (o.earnedLoyaltyPoints || 0);
        }
        console.log(`GRAND_TOTAL:${total}`);
        process.exit(0);
    } catch (e) {
        console.error('AUDIT ERROR:', e);
        process.exit(1);
    }
});
