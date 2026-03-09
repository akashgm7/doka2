const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const { dokaConnection } = require('./config/db');
const User = require('./models/User');

const dumpUsers = async () => {
    try {
        const users = await User.find({}).sort({ role: 1 });
        let currentRole = '';
        users.forEach(u => {
            if (u.role !== currentRole) {
                console.log(`\n\nROLE: ${u.role}`);
                currentRole = u.role;
            }
            console.log(`- ${u.name} (${u.email})`);
        });
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
};

dokaConnection.on('connected', dumpUsers);
