const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Role = require('./models/Role');
const { dokaConnection } = require('./config/db');

const testCreate = async () => {
    try {
        console.log('Connecting...');
        await new Promise(resolve => dokaConnection.once('open', resolve));
        console.log('Connected.');

        // Payload similar to what Super Admin sends for a Brand Admin
        const payload = {
            name: 'Repro Test User',
            email: 'repro@test.com',
            role: 'Brand Admin',
            assignedOutlets: [],
            assignedFactory: '',
            status: 'Active',
            // brandId is undefined for Super Admin if they don't select one
        };

        console.log('Attempting to create user with payload:', payload);

        // This is exactly what the controller does
        const user = await User.create({
            name: payload.name,
            email: payload.email,
            password: 'temporaryPassword123', // Raw password (controller generates one)
            role: payload.role,
            assignedBrand: payload.brandId,
            assignedOutlets: payload.assignedOutlets,
            assignedFactory: payload.assignedFactory,
            status: payload.status
        });

        console.log('SUCCESS: User created with ID:', user._id);

        // Cleanup
        await User.deleteOne({ _id: user._id });
        console.log('Cleanup done.');
        process.exit(0);
    } catch (error) {
        console.error('FAILURE:', error);
        process.exit(1);
    }
};

testCreate();
