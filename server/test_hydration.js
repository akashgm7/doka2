const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const testHydration = async () => {
    try {
        const { adminConnection } = require('./config/db');
        const User = require('./models/User');
        const Role = require('./models/Role');

        // Wait for connection
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }

        const testEmails = ['brand@cake.com', 'area@cake.com', 'factory@cake.com'];

        for (const email of testEmails) {
            console.log(`\nTesting: ${email}`);
            const user = await User.findOne({ email });
            if (!user) {
                console.log(`- User not found`);
                continue;
            }

            console.log(`- Role: ${user.role}`);
            const roleDetails = await Role.findOne({ name: user.role });
            if (!roleDetails) {
                console.log(`- Role details NOT FOUND for '${user.role}'`);
            } else {
                console.log(`- Role: ${roleDetails.name}, Permissions: ${roleDetails.permissions.length}`);
                console.log(`- ${roleDetails.permissions.join(', ')}`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

testHydration();
