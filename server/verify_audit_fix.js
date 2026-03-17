const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');

dotenv.config({ path: path.join(__dirname, '.env') });

const { dokaConnection } = require('./config/db');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');
const { setAuditInfo, auditContext } = require('./middleware/auditContext');

async function verifyAuditLogging() {
    const testEmail = `audit_test_${Date.now()}@example.com`;

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
            });

            console.log('Creating test user to trigger audit plugin...');
            const user = await User.create({
                name: 'Audit Test User',
                email: testEmail,
                password: 'password123',
                role: 'Customer',
                status: 'Active'
            });

            console.log('User created. Waiting for post-save hook (async)...');
            // Wait a bit for the async hook to complete
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Checking AuditLog for "Create User" entry...');
            const log = await AuditLog.findOne({
                action: 'Create User',
                resource: `User Audit Test User`
            });

            if (log) {
                console.log('SUCCESS: Audit log found!');
                console.log('Log Details:', JSON.stringify(log, null, 2));
            } else {
                console.error('FAILED: Audit log NOT found.');
            }

            // Cleanup
            await User.deleteOne({ _id: user._id });
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

verifyAuditLogging();
