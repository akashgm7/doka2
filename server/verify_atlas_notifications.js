const mongoose = require('mongoose');
require('dotenv').config();
const { dokaConnection } = require('./config/db');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function verifyNotificationInsertion() {
    try {
        console.log("Waiting for database connection...");
        if (dokaConnection.readyState !== 1) {
            await new Promise((resolve) => dokaConnection.once('open', resolve));
        }
        console.log("Connected to:", dokaConnection.name);

        console.log("Finding an admin user for sending...");
        const adminUser = await User.findOne({ role: 'Super Admin' });
        if (!adminUser) {
            console.error("No Super Admin found. Please seed users first.");
            process.exit(1);
        }

        console.log("Attempting to insert a test notification...");
        const testNotif = await Notification.create({
            title: "Atlas Verification Test",
            message: "This is a test notification to verify collection creation in Atlas.",
            target: "All Users",
            sender: adminUser._id,
            type: 'Manual',
            status: 'Sent'
        });

        console.log("Insertion successful!");
        console.log("Document ID:", testNotif._id);
        console.log("Collection Name in Mongoose:", Notification.collection.name);
        console.log("Database Name in Mongoose:", Notification.db.name);

        console.log("\nListing all collections in", dokaConnection.name, ":");
        const collections = await dokaConnection.db.listCollections().toArray();
        collections.forEach(c => console.log(" -", c.name));

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verifyNotificationInsertion();
