const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { adminConnection } = require('./config/db');

async function check() {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }
        console.log("Connected to Admin DB");

        const User = adminConnection.model('User', new mongoose.Schema({ email: String, role: String }));
        const Role = adminConnection.model('Role', new mongoose.Schema({ name: String, permissions: [String] }));

        const roles = await Role.find({});
        console.log("\nRoles in DB:");
        for (const r of roles) {
            console.log(`- Role: '${r.name}', Perms=[${r.permissions.join(', ')}]`);
        }

        const users = await User.find({});
        console.log("\nUser Roles:");
        for (const u of users) {
            console.log(`- ${u.email}: Role='${u.role}'`);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
