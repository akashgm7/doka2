const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const Role = require('./models/Role');

const checkDB = async () => {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }
        const count = await Role.countDocuments();
        const roles = await Role.find({});
        console.log(`Total roles in DB: ${count}`);
        roles.forEach(r => console.log(`- ${r.name} (${r.permissions.length} perms)`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
