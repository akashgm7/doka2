const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');

dotenv.config({ path: path.join(__dirname, '.env') });

const { dokaConnection } = require('./config/db');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');
const { setAuditInfo, auditContext } = require('./middleware/auditContext');

async function verifyDeleteAudit() {
    const testEmail = `delete_test_${Date.now()}@example.com`;

    try {
        console.log('Connecting to DB...');
        await new Promise((resolve) => {
            if (dokaConnection.readyState === 1) resolve();
            else dokaConnection.once('open', resolve);
        });
        console.log('DB Connected.');

        // Run within audit context
        await auditContext.run(new Map(), async () => {
            setAuditInfo({
                userId: new mongoose.Types.ObjectId(),
                email: 'superadmin@doka.com',
                role: 'Super Admin'
                // No brandId - simulating Super Admin
            });

            console.log('Creating test user...');
            const user = await User.create({
                name: 'Delete Me User',
                email: testEmail,
                password: 'password123',
                role: 'Customer',
                assignedBrand: 'brand-001', // Target brand
                status: 'Active'
            });

            console.log('Deleting test user to trigger Delete hook...');
            await user.deleteOne();

            console.log('Waiting for post-hook...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Checking AuditLog for "Delete User" entry...');
            const log = await AuditLog.findOne({
                action: 'Delete User',
                resource: `User Delete Me User`
            });

            if (log) {
                console.log('SUCCESS: Deletion Audit log found!');
                console.log('Log BrandId:', log.brandId);
                console.log('Log Performer Role:', log.role);

                if (log.brandId === 'brand-001') {
                    console.log('SUCCESS: Log inherited BrandId from resource!');
                } else {
                    console.error('FAILED: Log did NOT inherit BrandId. Got:', log.brandId);
                }
            } else {
                console.error('FAILED: Deletion Audit log NOT found.');
            }

            // Cleanup
            if (log) await AuditLog.deleteOne({ _id: log._id });
            console.log('Cleanup complete.');
        });

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
}

verifyDeleteAudit();
