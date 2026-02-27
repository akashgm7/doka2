const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');
require('./models/User');

const diagnose = async () => {
    try {
        if (dokaConnection.readyState !== 1) {
            await new Promise(resolve => dokaConnection.once('open', resolve));
        }
        const User = dokaConnection.model('User');

        console.log("--- Dashboard User Count Diagnosis ---");

        // Assume checking for Area Manager area@cake.com
        const manager = await User.findOne({ email: 'area@cake.com' });
        if (!manager) {
            console.log("Area Manager 'area@cake.com' not found.");
            process.exit(1);
        }

        console.log(`Current User: ${manager.name} (${manager.role})`);
        console.log(`Assigned Outlets:`, manager.assignedOutlets);

        // 1. Total users in DB
        const totalUsers = await User.countDocuments({});
        console.log(`Total Users in DB: ${totalUsers}`);

        // 2. Users by role
        const roleCounts = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);
        console.log("Users by Role:", roleCounts);

        // 3. The query being used in controller
        const userQuery = {
            role: 'Store Manager',
            assignedOutlets: { $in: manager.assignedOutlets || [] }
        };
        const controllerCount = await User.countDocuments(userQuery);
        console.log(`\nQuery:`, JSON.stringify(userQuery, null, 2));
        console.log(`Count result: ${controllerCount}`);

        const foundUsers = await User.find(userQuery).select('name email role assignedOutlets');
        console.log("Users matching query:", foundUsers);

        // 4. Check if assignedOutlets in User model are stored differently (IDs vs Names)
        const allUsers = await User.find({}).limit(50).select('email role assignedOutlets');
        console.log("\nSample Users and their assignments:");
        allUsers.forEach(u => {
            console.log(`- ${u.email} (${u.role}): [${u.assignedOutlets.join(', ')}]`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Diagnosis failed:", error);
        process.exit(1);
    }
};

diagnose();
