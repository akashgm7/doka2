const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const Role = require('./models/Role');
const User = require('./models/User');

async function debugPermissions() {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }

        console.log("=== ROLE PERMISSIONS IN DB ===");
        const roles = await Role.find({});
        roles.forEach(r => {
            console.log(`Role: ${r.name}`);
            console.log(`Permissions: ${JSON.stringify(r.permissions)}`);
            console.log("---");
        });

        console.log("\n=== USER TO ROLE MAPPING ===");
        const users = await User.find({}).limit(10);
        users.forEach(u => {
            console.log(`User: ${u.email}`);
            console.log(`Role: ${u.role}`);
            console.log("---");
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugPermissions();
