const mongoose = require('mongoose');
require('dotenv').config();
const { dokaConnection } = require('./config/db');
const Order = require('./models/Order');

async function checkTodayOrders() {
    try {
        console.log("Waiting for DB connection...");
        await new Promise(r => setTimeout(r, 2000));

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const todayOrders = await Order.find({ createdAt: { $gte: startOfToday } });
        console.log(`Found ${todayOrders.length} orders created today.`);
        if (todayOrders.length > 0) {
            console.log("Sample today's order brandId:", todayOrders[0].brandId);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTodayOrders();
