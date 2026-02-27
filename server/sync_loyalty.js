const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

// Explicitly require models
const User = require('./models/User');
const Order = require('./models/Order');

dokaConnection.on('open', async () => {
    try {
        console.log('--- STARTING LOYALTY SYNC ---');

        // Find all users who have placed orders
        const users = await User.find({ role: 'Customer' });
        console.log(`Checking ${users.length} customers...`);

        for (const user of users) {
            // Calculate total points earned from orders
            const orders = await Order.find({ user: user._id, earnedLoyaltyPoints: { $gt: 0 } }).lean();
            const totalEarned = orders.reduce((sum, o) => sum + (o.earnedLoyaltyPoints || 0), 0);

            if (totalEarned !== user.loyaltyPoints) {
                console.log(`Syncing user ${user.email}: ${user.loyaltyPoints} -> ${totalEarned}`);
                await User.updateOne(
                    { _id: user._id },
                    { $set: { loyaltyPoints: totalEarned } }
                );
            } else {
                console.log(`User ${user.email} is already in sync (${totalEarned} pts).`);
            }
        }

        // Also check if there are any "N/A" users in orders that might belong to a real user
        // (This happens if user ID was stored as string vs ObjectId, but they are both on the same DB here)

        console.log('--- SYNC COMPLETED ---');
        process.exit(0);
    } catch (e) {
        console.error('SYNC ERROR:', e);
        process.exit(1);
    }
});
