const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const check = async () => {
    try {
        console.log("Connecting...");
        if (dokaConnection.readyState !== 1) {
            await new Promise(resolve => dokaConnection.once('open', resolve));
        }
        console.log("Connected to Doka DB");

        const User = dokaConnection.model('User', new mongoose.Schema({
            email: String,
            role: String,
            assignedOutlets: [String],
            assignedBrand: String
        }));

        const user = await User.findOne({ email: 'area@cake.com' });
        console.log("USER DATA:", JSON.stringify(user, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
