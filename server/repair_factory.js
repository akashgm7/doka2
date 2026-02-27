const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
const { dokaConnection } = require('./config/db');

const User = dokaConnection.model('User', new mongoose.Schema({
    email: String,
    password: String,
    role: String
}, { strict: false }));

dokaConnection.on('open', async () => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password', salt);

        const res = await User.updateOne(
            { email: 'factory@cake.com' },
            { $set: { password: hashedPassword, role: 'Factory Manager' } }
        );

        console.log('Successfully updated factory user:', res.modifiedCount);
        process.exit(0);
    } catch (err) {
        console.error('Error updating factory user:', err);
        process.exit(1);
    }
});
