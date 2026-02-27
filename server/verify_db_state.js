const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const Role = require('./models/Role');
const User = require('./models/User');

const verify = async () => {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }

        console.log('--- Roles ---');
        const roles = await Role.find({});
        for (const r of roles) {
            console.log(`\n>>> ROLE: "${r.name}"`);
            console.log(`Permissions (${r.permissions.length}):`);
            console.log(r.permissions);
        }

        console.log('\n--- Brand Admin Users ---');
        const brandAdmins = await User.find({ role: 'Brand Admin' });
        brandAdmins.forEach(u => {
            console.log(`User: ${u.email}`);
            console.log(`Role: ${u.role}`);
            // Check if permissions are stored on user (they shouldn't be, they should be in the role, but middleware fetches them)
            console.log('---');
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
