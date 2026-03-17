const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { dokaConnection } = require('./config/db');
const User = require('./models/User');

async function checkUser() {
    try {
        console.log('Connecting to DB...');
        await new Promise((resolve) => {
            if (dokaConnection.readyState === 1) resolve();
            else dokaConnection.once('open', resolve);
        });
        console.log('DB Connected.');

        const email = 'akashrocks843@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User FOUND:', JSON.stringify(user, null, 2));
        } else {
            console.log('User NOT found.');
        }
    } catch (error) {
        console.error('Error checking user:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
}

checkUser();
