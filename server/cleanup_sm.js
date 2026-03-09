const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const { dokaConnection } = require('./config/db');
const User = require('./models/User');

const cleanupStoreManagers = async () => {
    try {
        console.log('Connecting to database...');

        const storeManagers = await User.find({ role: 'Store Manager' });
        console.log(`Found ${storeManagers.length} Store Managers in the DB.`);

        let keptId = null;
        let deletedCount = 0;

        for (const sm of storeManagers) {
            if (sm.email === 'store@doka.com') {
                console.log(`Keeping primary Store Manager: ${sm.email}`);
                keptId = sm._id;
            }
        }

        // If the primary one wasn't found, just keep the first one
        if (!keptId && storeManagers.length > 0) {
            keptId = storeManagers[0]._id;
            console.log(`Primary not found, keeping: ${storeManagers[0].email}`);
        }

        for (const sm of storeManagers) {
            if (sm._id.toString() !== keptId.toString()) {
                console.log(`Deleting extra Store Manager: ${sm.email}`);
                await User.findByIdAndDelete(sm._id);
                deletedCount++;
            }
        }

        console.log(`Cleanup complete. Deleted ${deletedCount} extra Store Managers.`);
        process.exit(0);
    } catch (error) {
        console.error('Error cleaning up DB:', error);
        process.exit(1);
    }
};

dokaConnection.on('connected', cleanupStoreManagers);
