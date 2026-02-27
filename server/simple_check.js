const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
    const uri = process.env.MONGODB_URI;
    console.log("Connecting to:", uri);
    const conn = await mongoose.createConnection(uri, { dbName: 'doka_admin_db' }).asPromise();

    const User = conn.model('User', new mongoose.Schema({ email: String, role: String }));
    const users = await User.find({});

    console.log("User Roles:");
    users.forEach(u => console.log(`- ${u.email}: '${u.role}'`));

    const Role = conn.model('Role', new mongoose.Schema({ name: String, permissions: [String] }));
    const roles = await Role.find({});
    console.log("Roles in DB:");
    roles.forEach(r => {
        console.log(`- '${r.name}' (${r.permissions.length} perms)`);
        if (r.name === 'Super Admin') {
            console.log("Super Admin Perms:", r.permissions);
        }
    });

    process.exit();
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
