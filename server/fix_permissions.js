const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { adminConnection } = require('./config/db');

const fixPermissions = async () => {
    try {
        console.log("Connecting to DB...");
        if (adminConnection.readyState !== 1) {
            await new Promise(resolve => adminConnection.once('open', resolve));
        }

        const Role = adminConnection.model('Role', new mongoose.Schema({
            name: String,
            permissions: [String]
        }));

        // Roles that should have manage_orders
        const rolesToUpdate = ['Brand Admin', 'Area Manager'];

        for (const roleName of rolesToUpdate) {
            const role = await Role.findOne({ name: roleName });
            if (role) {
                if (!role.permissions.includes('manage_orders')) {
                    console.log(`Adding 'manage_orders' to ${roleName}...`);
                    role.permissions.push('manage_orders');
                    await role.save();
                    console.log(`${roleName} updated successfully.`);
                } else {
                    console.log(`${roleName} already has 'manage_orders'.`);
                }
            } else {
                console.log(`${roleName} role not found.`);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error("Failed to fix permissions:", error);
        process.exit(1);
    }
};

fixPermissions();
