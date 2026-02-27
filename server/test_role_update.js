const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const Role = require('./models/Role');
const PERMISSIONS = require('./constants/permissions');

async function testUpdate() {
    try {
        console.log("Connecting...");
        await new Promise(r => adminConnection.once('open', r));

        const role = await Role.findOne({ name: 'Super Admin' });
        if (!role) {
            console.log("Super Admin role not found!");
            process.exit(1);
        }

        console.log(`Testing update for role: ${role.name}`);

        // Mock the logic inside updateRole controller
        const newPermissions = [...role.permissions];
        if (!newPermissions.includes('manage_roles')) {
            newPermissions.push('manage_roles');
        }

        // Validate permissions (logic from controller)
        const validPermIds = PERMISSIONS.map(p => p.id);
        const invalidPerms = newPermissions.filter(p => !validPermIds.includes(p));

        if (invalidPerms.length > 0) {
            console.log("Validation FAILED: Invalid permissions found:", invalidPerms);
        } else {
            console.log("Validation PASSED.");
        }

        role.permissions = newPermissions;
        await role.save();
        console.log("Update successful!");

        process.exit(0);
    } catch (err) {
        console.error("Update failed:", err);
        process.exit(1);
    }
}

testUpdate();
