const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { adminConnection } = require('./config/db');

async function updatePermissions() {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }
        console.log("Connected to Admin DB");

        const Role = adminConnection.model('Role', new mongoose.Schema({ name: String, permissions: [String] }));

        const rolesToUpdate = ['Super Admin', 'Brand Admin'];

        for (const roleName of rolesToUpdate) {
            const role = await Role.findOne({ name: roleName });
            if (role) {
                if (!role.permissions.includes('manage_menu')) {
                    role.permissions.push('manage_menu');
                    await role.save();
                    console.log(`SUCCESS: Added 'manage_menu' to ${roleName}`);
                } else {
                    console.log(`INFO: ${roleName} already has 'manage_menu'`);
                }
            } else {
                console.log(`WARNING: Role ${roleName} not found`);
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updatePermissions();
