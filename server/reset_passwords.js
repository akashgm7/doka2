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
        // We set it to 'password', since quick login sends 'password' for all roles
        const hashedPassword = await bcrypt.hash('password', salt);

        const roles = ['Super Admin', 'Brand Admin', 'Area Manager', 'Store Manager', 'Factory Manager'];
        const res = await User.updateMany(
            { role: { $in: roles } },
            { $set: { password: hashedPassword } }
        );

        console.log('Successfully updated passwords for', res.modifiedCount, 'users.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating passwords:', err);
        process.exit(1);
    }
});
