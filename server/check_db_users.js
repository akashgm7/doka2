const mongoose = require('mongoose');
require('dotenv').config();

const checkUsers = async () => {
    try {
        const { dokaConnection } = require('./config/db');
        const User = require('./models/User');

        console.log('Fetching users from database...');
        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        const roles = [...new Set(users.map(u => u.role))];
        console.log('Unique roles found in database:', roles);

        users.forEach(u => {
            console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, BrandId: ${u.assignedBrand}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsers();
