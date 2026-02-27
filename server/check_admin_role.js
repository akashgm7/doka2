const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const { docaConnection, adminConnection } = require('./config/db');
const User = require('./models/User');
const Role = require('./models/Role');

async function checkUser() {
    try {
        console.log("Waiting for DB connections...");
        await new Promise(resolve => {
            let count = 0;
            const check = () => {
                if (docaConnection.readyState === 1 && adminConnection.readyState === 1) resolve();
                else if (count > 50) resolve(); // Timeout
                else { count++; setTimeout(check, 100); }
            };
            check();
        });
        const adminUser = await User.findOne({ email: 'super@admin.com' });
        if (!adminUser) {
            console.log("Super Admin user not found!");
            process.exit(1);
        }

        console.log(`User: ${adminUser.email}, Role: '${adminUser.role}'`);

        const role = await Role.findOne({ name: adminUser.role });
        if (!role) {
            console.log(`Role '${adminUser.role}' NOT FOUND in Role collection!`);
            const allRoles = await Role.find({});
            console.log("Available roles:", allRoles.map(r => r.name));
        } else {
            console.log(`Role permissions (${role.permissions.length}):`, role.permissions);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUser();
