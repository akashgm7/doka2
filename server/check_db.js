const mongoose = require('mongoose');
require('dotenv').config();
const { dokaConnection } = require('./config/db');
const fs = require('fs');

const orderSchema = new mongoose.Schema({}, { strict: false });
const Order = dokaConnection.model('Order', orderSchema);

async function checkOrders() {
    try {
        await new Promise(r => setTimeout(r, 2000));

        let out = '';
        out += '--- LATEST MMC ORDER ---\n';
        const mmcOrder = await Order.findOne({ isMMC: true }).sort({ createdAt: -1 }).lean();
        out += JSON.stringify(mmcOrder, null, 2) + '\n';

        out += '\n--- LATEST STD ORDER ---\n';
        const stdOrder = await Order.findOne({ isMMC: { $ne: true } }).sort({ createdAt: -1 }).lean();
        out += JSON.stringify(stdOrder, null, 2) + '\n';

        fs.writeFileSync('order_samples.json', out);
        console.log('Done writing order_samples.json');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkOrders();
