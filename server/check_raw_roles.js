const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkRawRoles = async () => {
    try {
        const { adminConnection } = require('./config/db');
        const Role = require('./models/Role');

        // Wait for connection
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }

        const roles = await Role.find({}).lean();
        console.log('--- RAW ROLES DUMP ---');
        roles.forEach(r => {
            console.log(`Role: ${r.name}`);
            console.log(`Permissions (${Array.isArray(r.permissions) ? 'Array' : typeof r.permissions}):`, JSON.stringify(r.permissions));
            console.log('---');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkRawRoles();
