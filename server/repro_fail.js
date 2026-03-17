const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { dokaConnection } = require('./config/db');
const User = require('./models/User');

async function testCreateUser() {
    try {
        console.log('Connecting to DB...');
        // Wait for connection
        await new Promise((resolve) => {
            if (dokaConnection.readyState === 1) resolve();
            else dokaConnection.once('open', resolve);
        });
        console.log('DB Connected.');

        const payload = {
            name: 'fhh',
            email: 'akashrocks843@gmail.com',
            role: 'Brand Admin',
            brandId: 'DOKA', // From screenshot
            assignedOutlets: [],
            assignedFactory: '',
            status: 'Active'
        };

        console.log('Attempting to create user with payload:', payload);

        // Simulate the controller logic
        const tempPassword = 'temp123Password!';

        const user = await User.create({
            name: payload.name,
            email: payload.email,
            password: tempPassword,
            role: payload.role,
            assignedBrand: payload.brandId,
            assignedOutlets: payload.assignedOutlets,
            assignedFactory: payload.assignedFactory,
            status: 'Active'
        });

        console.log('Successfully created user:', user);
    } catch (error) {
        console.error('FAILED to create user:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
}

testCreateUser();
