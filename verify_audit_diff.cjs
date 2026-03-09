const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const Order = require('./server/models/Order');
const AuditLog = require('./server/models/AuditLog');
const { setAuditInfo } = require('./server/middleware/auditContext');
const { adminConnection, dokaConnection } = require('./server/config/db');

async function verifyDiff() {
    try {
        console.log('Connecting to DB...');
        // Wait for connections
        await Promise.all([
            new Promise(resolve => dokaConnection.once('open', resolve)),
            new Promise(resolve => adminConnection.once('open', resolve))
        ]);

        console.log('Searching for an order to update...');
        const order = await Order.findOne();
        if (!order) {
            console.log('No order found to test with.');
            process.exit(0);
        }

        console.log(`Testing with Order: ${order._id} (Current Status: ${order.status})`);

        // Mock audit info
        const mockUser = {
            userId: new mongoose.Types.ObjectId(),
            email: 'test@example.com',
            role: 'Super Admin'
        };

        const { auditContext } = require('./server/middleware/auditContext');

        await auditContext.run(new Map(), async () => {
            setAuditInfo(mockUser);

            console.log('Updating order status...');
            const oldStatus = order.status;
            const newStatus = oldStatus === 'PENDING' ? 'CONFIRMED' : 'PENDING';

            order.status = newStatus;
            await order.save();

            console.log(`Order status updated to ${newStatus}. Checking AuditLog...`);

            // Wait for post-save
            await new Promise(resolve => setTimeout(resolve, 1000));

            const latestLog = await AuditLog.findOne({
                resource: new RegExp(order._id.toString()),
                action: /Update/
            }).sort({ timestamp: -1 });

            if (latestLog) {
                console.log('Found Log Entry!');
                console.log('Action:', latestLog.action);
                console.log('Details:', JSON.stringify(latestLog.details, null, 2));

                if (latestLog.details && latestLog.details.status === newStatus) {
                    console.log('SUCCESS: Diff (changed fields) captured correctly.');
                } else {
                    console.log('FAILURE: Diff not captured or incorrect.');
                }
            } else {
                console.log('FAILURE: AuditLog entry not found.');
            }
        });

        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verifyDiff();
