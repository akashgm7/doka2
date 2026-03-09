const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const { dokaConnection } = require('./config/db');
const User = require('./models/User');

const migrateUsers = async () => {
    try {
        console.log('Connecting to database to check and migrate users...');

        // 1. Migrate old 'Store User' to 'Customers'
        const legacyResult = await User.updateMany(
            { role: 'Store User' },
            { $set: { role: 'Customers' } }
        );
        console.log(`Migrated ${legacyResult.modifiedCount} users from 'Store User' to 'Customers'.`);

        // 2. Fetch all users and display them so we know what we have
        const allUsers = await User.find({}).sort({ role: 1 });

        console.log('\n=== COMPLETE LIST OF USERS IN DATABASE ===');
        let currentRole = '';
        allUsers.forEach(u => {
            if (u.role !== currentRole) {
                console.log(`\n--- ROLE: ${u.role} ---`);
                currentRole = u.role;
            }
            console.log(`Name: ${u.name.padEnd(20)} | Email: ${u.email}`);
        });

        // 3. Remove duplicates that share the EXACT same email
        console.log('\nChecking for duplicates with the exact same email...');
        const uniqueEmails = new Set();
        let deletedDups = 0;
        for (const u of allUsers) {
            if (uniqueEmails.has(u.email)) {
                await User.findByIdAndDelete(u._id);
                console.log(`Deleted duplicate for email: ${u.email}`);
                deletedDups++;
            } else {
                uniqueEmails.add(u.email);
            }
        }
        console.log(`Removed ${deletedDups} duplicate users with identical emails.`);

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

dokaConnection.on('connected', migrateUsers);
