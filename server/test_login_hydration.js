const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '.env') });

const testLoginHydration = async () => {
    try {
        const { adminConnection } = require('./config/db');
        const User = require('./models/User');
        const Role = require('./models/Role');

        // Wait for connection
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }

        const email = 'brand@cake.com';
        console.log(`Simulating login for: ${email}`);

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        // Simulating the logic in authController.js
        const roleDetails = await Role.findOne({ name: user.role });
        const permissions = roleDetails ? roleDetails.permissions : [];

        console.log('Login Response Payload (Simulation):');
        console.log(JSON.stringify({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: permissions, // This is what we care about
            assignedBrand: user.assignedBrand
        }, null, 2));

        if (permissions.length === 0) {
            console.log('CRITICAL: Permissions array is empty for a Brand Admin!');
            console.log('Role found in DB:', roleDetails ? 'Yes' : 'No');
            if (roleDetails) console.log('Permissions in Role doc:', roleDetails.permissions);
        } else {
            console.log(`SUCCESS: Found ${permissions.length} permissions for ${user.role}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testLoginHydration();
