const mongoose = require('mongoose');
require('dotenv').config();

async function cleanup() {
    const uri = process.env.MONGODB_URI;
    const conn = await mongoose.createConnection(uri, { dbName: 'doka_admin_db' }).asPromise();

    const Role = conn.model('Role', new mongoose.Schema({ name: String, permissions: [String] }));
    const User = conn.model('User', new mongoose.Schema({ email: String, role: String }));

    console.log("Migrating users from 'Factory User' to 'Factory Manager'...");
    const userResult = await User.updateMany({ role: 'Factory User' }, { role: 'Factory Manager' });
    console.log(`Updated ${userResult.modifiedCount} users.`);

    console.log("Deleting old 'Factory User' role...");
    const roleResult = await Role.deleteOne({ name: 'Factory User' });
    console.log(`Deleted role: ${roleResult.deletedCount}`);

    process.exit();
}

cleanup().catch(err => {
    console.error(err);
    process.exit(1);
});
