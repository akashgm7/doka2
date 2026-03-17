const mongoose = require('mongoose');
require('dotenv').config();

const checkRoles = async () => {
    try {
        const { dokaConnection } = require('./config/db');
        const Role = require('./models/Role');

        console.log('Fetching roles from database...');
        const roles = await Role.find({});
        console.log(`Found ${roles.length} roles.`);

        roles.forEach(r => {
            console.log(`- Role Name: ${r.name}, Description: ${r.description}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkRoles();
