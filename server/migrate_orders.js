const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const { dokaConnection } = require('./config/db');

const migrate = async () => {
    try {
        await new Promise(resolve => dokaConnection.on('open', resolve));
        console.log('Connected to DOKA database for migration');

        const Order = dokaConnection.model('Order', new mongoose.Schema({ status: String }));

        const result = await Order.updateMany(
            { status: 'Completed' },
            { $set: { status: 'Delivered' } }
        );

        console.log(`Migration successful: Updated ${result.modifiedCount} orders from 'Completed' to 'Delivered'`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
