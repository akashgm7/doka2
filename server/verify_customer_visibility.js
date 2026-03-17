const mongoose = require('mongoose');
require('dotenv').config();

const verifyVisibility = async () => {
    try {
        const { dokaConnection } = require('./config/db');
        const User = require('./models/User');

        console.log('Verifying user visibility for different roles...');

        // Mock a Brand Admin request
        const brandAdmin = await User.findOne({ role: 'Brand Admin' });
        if (!brandAdmin) {
            console.log('No Brand Admin found to test with.');
            process.exit(1);
        }

        console.log(`Testing visibility for Brand Admin: ${brandAdmin.email} (Brand: ${brandAdmin.assignedBrand})`);

        // Simulate the controller logic
        const query = {
            $or: [
                { assignedBrand: brandAdmin.assignedBrand },
                { role: 'Customers' }
            ]
        };

        const visibleUsers = await User.find(query).select('name email role');
        console.log(`Found ${visibleUsers.length} users visible to this Brand Admin.`);

        const customers = visibleUsers.filter(u => u.role === 'Customers');
        console.log(`Of these, ${customers.length} are 'Customers'.`);

        if (customers.length > 0) {
            console.log('SUCCESS: Brand Admin can see customers.');
            customers.forEach(c => console.log(`- ${c.name} (${c.email}, ${c.role})`));
        } else {
            console.log('FAILURE: No customers found for Brand Admin.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    }
};

verifyVisibility();
