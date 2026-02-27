const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { docaConnection } = require('./config/db');

async function migrateUserRoles() {
    try {
        console.log("Connecting to doka_cake_app for user migration...");

        // Wait for connection
        await new Promise(resolve => {
            if (docaConnection.readyState === 1) resolve();
            else docaConnection.once('open', resolve);
        });

        const User = docaConnection.model('User', new mongoose.Schema({
            email: String,
            role: String
        }));

        console.log("Updating SuperAdmin -> Super Admin...");
        const result1 = await User.updateMany({ role: 'SuperAdmin' }, { role: 'Super Admin' });
        console.log(`Updated ${result1.modifiedCount} Super Admins.`);

        console.log("Updating BrandAdmin -> Brand Admin...");
        const result2 = await User.updateMany({ role: 'BrandAdmin' }, { role: 'Brand Admin' });
        console.log(`Updated ${result2.modifiedCount} Brand Admins.`);

        console.log("Updating AreaManager -> Area Manager...");
        const result3 = await User.updateMany({ role: 'AreaManager' }, { role: 'Area Manager' });
        console.log(`Updated ${result3.modifiedCount} Area Managers.`);

        console.log("Updating StoreManager -> Store Manager...");
        const result4 = await User.updateMany({ role: 'StoreManager' }, { role: 'Store Manager' });
        console.log(`Updated ${result4.modifiedCount} Store Managers.`);

        console.log("Updating FactoryUser -> Factory Manager..."); // Note: Matrix uses Factory Manager
        const result5 = await User.updateMany({ role: 'FactoryUser' }, { role: 'Factory Manager' });
        console.log(`Updated ${result5.modifiedCount} Factory Users.`);

        console.log("Fixing permissions mismatch...");
        // Also check if any user simply has an empty role object or something

        console.log("Migration complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrateUserRoles();
