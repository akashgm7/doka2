const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });
const { dokaConnection } = require('./config/db');

const User = dokaConnection.model('User', new mongoose.Schema({
    email: String,
    assignedOutlets: [String],
    assignedFactory: String
}, { strict: false }));

dokaConnection.on('open', async () => {
    try {
        await User.updateOne(
            { email: 'store@cake.com' },
            { $addToSet: { assignedOutlets: { $each: ['store-001', 'store-002'] } } }
        );

        await User.updateOne(
            { email: 'area@cake.com' },
            { $addToSet: { assignedOutlets: { $each: ['store-001', 'store-002', 'store-003'] } } }
        );

        // factory expects a single code, not an array. we will just set it if it's missing or push it
        await User.updateOne(
            { email: 'factory@cake.com' },
            { $set: { assignedFactory: 'factory-001' } } // Assuming 'factory-001' is what orders might use
        );

        console.log('Successfully patched manager assigned IDs to match legacy orders');
        process.exit(0);
    } catch (err) {
        console.error('ERR:', err);
        process.exit(1);
    }
});
