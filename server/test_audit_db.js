const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const AuditLog = require('./models/AuditLog');

const test = async () => {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }
        console.log('Connected to admin db');
        const count = await AuditLog.countDocuments({});
        console.log('Audit Log Count:', count);
        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err);
        process.exit(1);
    }
};

test();
