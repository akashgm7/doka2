const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const migrate = async () => {
    try {
        await new Promise(resolve => dokaConnection.on('open', resolve));
        console.log('Connected to DOKA database for status migration');

        const Order = dokaConnection.model('Order', new mongoose.Schema({ status: String }));

        const mapping = {
            'Pending': 'PENDING',
            'Confirmed': 'CONFIRMED',
            'In Production': 'IN_PRODUCTION',
            'Baking': 'IN_PRODUCTION',
            'Ready': 'READY',
            'Delivered': 'DELIVERED',
            'Cancelled': 'CANCELLED'
        };

        for (const [oldStatus, newStatus] of Object.entries(mapping)) {
            const result = await Order.updateMany(
                { status: oldStatus },
                { $set: { status: newStatus } }
            );
            console.log(`Updated ${result.modifiedCount} orders: ${oldStatus} -> ${newStatus}`);
        }

        console.log('Migration to ALL CAPS status complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
