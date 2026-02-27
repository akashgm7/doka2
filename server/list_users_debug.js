const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const User = require('./models/User');

const listUsers = async () => {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }
        console.log('Connected to DB');

        const users = await User.find({}).lean();
        console.log('--- User List ---');
        users.forEach(u => {
            console.log(`Email: ${u.email}, Role: ${u.role}, BrandID: ${u.assignedBrand}, FactID: ${u.assignedFactory}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
