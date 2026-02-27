const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const User = require('./models/User');
const Role = require('./models/Role');

const test = async () => {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }
        console.log('Connected to admin db');

        const users = await User.find({}).lean();
        console.log('Users found:', users.length);

        for (const user of users) {
            const roleDoc = await Role.findOne({ name: user.role }).lean();
            console.log(`User: ${user.email}, Role: "${user.role}", Role Doc Found: ${!!roleDoc}`);
            if (roleDoc) {
                console.log(` - Permissions: ${roleDoc.permissions.join(', ')}`);
                console.log(` - Has 'view_audit_logs': ${roleDoc.permissions.includes('view_audit_logs')}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err);
        process.exit(1);
    }
};

test();
