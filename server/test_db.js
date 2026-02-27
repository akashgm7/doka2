const mongoose = require('mongoose');
require('dotenv').config();
const { dokaConnection } = require('./config/db');
const Order = require('./models/Order');
async function test() {
    await new Promise(r => setTimeout(r, 2000));
    const orders = await Order.find({}, 'storeId');
    const storeIds = orders.map(o => o.storeId);
    console.log("Store IDs in Orders:", [...new Set(storeIds)]);
    process.exit(0);
}
test();
