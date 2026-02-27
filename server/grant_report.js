const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
const { dokaConnection } = require('./config/db');

const Role = dokaConnection.model('Role', new mongoose.Schema({}, { strict: false }));

dokaConnection.on('open', async () => {
    try {
        const targetRoles = ['Brand Admin', 'Area Manager', 'Store Manager', 'Factory Manager'];
        const roles = await Role.find({ name: { $in: targetRoles } });

        for (let r of roles) {
            console.log(`${r.name} has view_reports initially: ${r.permissions.includes('view_reports')}`);
            if (!r.permissions.includes('view_reports')) {
                r.permissions.push('view_reports');
                await Role.updateOne({ _id: r._id }, { $set: { permissions: r.permissions } });
                console.log(`Added view_reports permission to ${r.name}`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
});
