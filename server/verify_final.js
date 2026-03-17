const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { dokaConnection } = require('./config/db');
const User = require('./models/User');

async function verifySuccess() {
    const testEmail = `test_success_${Date.now()}@example.com`;
    try {
        console.log('Connecting to DB...');
        await new Promise((resolve) => {
            if (dokaConnection.readyState === 1) resolve();
            else dokaConnection.once('open', resolve);
        });
        console.log('DB Connected.');

        const payload = {
            name: 'Success Test',
            email: testEmail,
            role: 'Brand Admin',
            brandId: 'brand-001',
            assignedOutlets: [],
            assignedFactory: '',
            status: 'Active'
        };

        console.log('Attempting to create user with NEW email:', testEmail);

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

        console.log('SUCCESS: User created with ID:', user._id);

        // Cleanup
        await User.deleteOne({ _id: user._id });
        console.log('Cleanup: Test user deleted.');
    } catch (error) {
        console.error('FAILED even with new email:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
}

verifySuccess();
