const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

// Explicitly register schemas to the connection
require('./models/User');
require('./models/Store');

const finalVerify = async () => {
    try {
        if (dokaConnection.readyState !== 1) {
            await new Promise(resolve => dokaConnection.once('open', resolve));
        }
        if (adminConnection.readyState !== 1) {
            await new Promise(resolve => adminConnection.once('open', resolve));
        }

        const User = dokaConnection.model('User');
        const Store = adminConnection.model('Store');

        console.log("--- Final Team Count Verification ---");

        const areaManager = await User.findOne({ email: 'area@cake.com' });
        if (!areaManager) {
            console.log("Area Manager not found.");
            process.exit(1);
        }

        const role = areaManager.role;
        const assignedOutlets = areaManager.assignedOutlets;

        let userQuery = {};
        let allAssignedIds = [...(assignedOutlets || [])];
        if (assignedOutlets && assignedOutlets.length > 0) {
            const assignedStores = await Store.find({ name: { $in: assignedOutlets } }).select('_id');
            const mappedIds = assignedStores.map(s => s._id.toString());
            allAssignedIds = [...allAssignedIds, ...mappedIds];
        }

        if (role === 'Area Manager') {
            userQuery.role = 'Store Manager';
            userQuery.assignedOutlets = { $in: allAssignedIds };
        }

        console.log(`Role: ${role}`);
        console.log(`Assigned Outlets (Names):`, assignedOutlets);
        console.log(`Mapped IDs:`, allAssignedIds);
        console.log(`User Query:`, JSON.stringify(userQuery, null, 2));

        const count = await User.countDocuments(userQuery);
        console.log(`\nFINAL COUNT FOR AREA MANAGER: ${count}`);

        const foundUsers = await User.find(userQuery).select('name email role');
        console.log("Found Users:", foundUsers);

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
};

finalVerify();
