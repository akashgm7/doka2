const mongoose = require('mongoose');
require('dotenv').config();

const checkUsers = async () => {
    try {
        const { dokaConnection } = require('./config/db');
        const User = require('./models/User');

        const users = await User.find({});
        users.forEach(u => {
            console.log(JSON.stringify({
                name: u.name,
                email: u.email,
                role: u.role,
                brandId: u.assignedBrand
            }));
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsers();
