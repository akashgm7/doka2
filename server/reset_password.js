const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const User = require('./models/User');

const resetPass = async () => {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }

        const user = await User.findOne({ email: 'super@admin.com' });
        if (user) {
            user.password = 'password123'; // Will be hashed by pre-save hook
            await user.save();
            console.log('Password reset for super@admin.com');
        } else {
            console.log('User not found');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetPass();
