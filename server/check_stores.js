const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const { dokaConnection } = require('./config/db');
const fs = require('fs');

const User = dokaConnection.model('User', new mongoose.Schema({}, { strict: false }));
const Order = dokaConnection.model('Order', new mongoose.Schema({}, { strict: false }));

dokaConnection.on('open', async () => {
    try {
        const u = await User.findOne({ email: 'store@cake.com' });
        const factoryAuth = await User.findOne({ email: 'factory@cake.com' });
        const areaAuth = await User.findOne({ email: 'area@cake.com' });

        const orders = await Order.find({ storeId: { $in: u?.assignedOutlets || [] } }).limit(5);
        const allOrders = await Order.find().limit(5);

        const output = {
            storeManager: { email: u?.email, assignedOutlets: u?.assignedOutlets, assignedBrand: u?.assignedBrand },
            factoryManager: { email: factoryAuth?.email, assignedFactory: factoryAuth?.assignedFactory },
            areaManager: { email: areaAuth?.email, assignedOutlets: areaAuth?.assignedOutlets },
            matchingOrdersForStoreManager: orders.length,
            sampleOrderStoreIds: allOrders.map(o => o.storeId)
        };
        fs.writeFileSync('check_output.json', JSON.stringify(output, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('ERR:', err);
        process.exit(1);
    }
});
