const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const User = require('./models/User');
const { docaConnection } = require('./config/db');

async function debugFiltering() {
    try {
        console.log("Simulating feed for 'Store User'...");
        const role = 'Store User';

        let targets = ['All Users'];
        if (role !== 'Customer') targets.push('Staff');

        // This is the logic I WANT to implement
        console.log("Calculated Targets:", targets);

        const notifications = await Notification.find({ target: { $in: targets } }).sort({ sentAt: -1 });
        console.log("Count for Store User:", notifications.length);
        notifications.forEach(n => console.log(` - [${n.target}] ${n.title}`));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugFiltering();
