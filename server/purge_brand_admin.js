const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const Role = require('./models/Role');

const fix = async () => {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }

        console.log('Deleting "Brand Admin" role...');
        const res = await Role.deleteOne({ name: 'Brand Admin' });
        console.log(`Deleted: ${res.deletedCount}`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fix();
