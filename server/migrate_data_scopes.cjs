require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');
const { dokaConnection } = require('./config/db');

const migrateDataScopes = async () => {
    try {
        console.log('Connected to MongoDB. Starting Data Scope Migration...');

        // Define default scope mappings
        const scopeMappings = {
            'Super Admin': 'System',
            'Brand Admin': 'Brand',
            'Area Manager': 'Outlet',
            'Store Manager': 'Outlet',
            'Customers': 'None',
            'Factory Manager': 'Factory',
            'Factory User': 'Factory'
        };

        const roles = await Role.find({});
        for (const role of roles) {
            const desiredScope = scopeMappings[role.name] || 'None';
            if (role.scopeLevel !== desiredScope) {
                role.scopeLevel = desiredScope;
                await role.save();
                console.log(`Updated scopeLevel for ${role.name} to ${desiredScope}`);
            } else {
                console.log(`Role ${role.name} already has correct scopeLevel: ${desiredScope}`);
            }
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateDataScopes();
