const mongoose = require('mongoose');
require('dotenv').config();

const normalizeRoles = async () => {
    try {
        const { dokaConnection } = require('./config/db');
        const User = require('./models/User');

        console.log('Normalizing user roles...');

        // Update 'Customer' to 'Customers'
        const singularResult = await User.updateMany(
            { role: 'Customer' },
            { $set: { role: 'Customers' } }
        );
        console.log(`Updated ${singularResult.modifiedCount} users from 'Customer' to 'Customers'.`);

        // Update 'Store User' to 'Customers'
        const storeUserResult = await User.updateMany(
            { role: 'Store User' },
            { $set: { role: 'Customers' } }
        );
        console.log(`Updated ${storeUserResult.modifiedCount} users from 'Store User' to 'Customers'.`);

        process.exit(0);
    } catch (error) {
        console.error('Error during normalization:', error);
        process.exit(1);
    }
};

normalizeRoles();
