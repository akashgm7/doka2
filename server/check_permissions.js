const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const checkPermissions = async () => {
    try {
        console.log("Connecting to DB...");
        if (dokaConnection.readyState !== 1) {
            await new Promise(resolve => dokaConnection.once('open', resolve));
        }

        const Role = dokaConnection.model('Role', new mongoose.Schema({
            name: String,
            permissions: [String]
        }));

        const brandAdminRole = await Role.findOne({ name: 'Brand Admin' });
        if (brandAdminRole) {
            console.log("Permissions for Brand Admin:", brandAdminRole.permissions);
        } else {
            console.log("Brand Admin role not found.");
        }

        const storeManagerRole = await Role.findOne({ name: 'Store Manager' });
        if (storeManagerRole) {
            console.log("Permissions for Store Manager:", storeManagerRole.permissions);
        } else {
            console.log("Store Manager role not found.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Failed to check permissions:", error);
        process.exit(1);
    }
};

checkPermissions();
