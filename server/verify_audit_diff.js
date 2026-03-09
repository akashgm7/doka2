const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const { setAuditInfo, auditContext } = require('./middleware/auditContext');
console.log('AuditContext imported:', !!auditContext);

const Order = require('./models/Order');
const AuditLog = require('./models/AuditLog');
const { adminConnection, dokaConnection } = require('./config/db');

async function verifyDiff() {
    try {
        console.log('Connecting to DB...');
        await Promise.all([
            new Promise(resolve => dokaConnection.once('open', resolve)),
            new Promise(resolve => adminConnection.once('open', resolve))
        ]);

        console.log('Searching for an order...');
        const order = await Order.findOne();
        if (!order) {
            console.log('No order found.');
            process.exit(0);
        }

        console.log(`Testing with Order: ${order._id}`);

        const mockUser = {
            userId: new mongoose.Types.ObjectId(),
            email: 'test@example.com',
            role: 'Super Admin'
        };

        if (!auditContext || typeof auditContext.run !== 'function') {
            console.error('AuditContext.run is not a function!');
            process.exit(1);
        }

        await auditContext.run(new Map(), async () => {
            setAuditInfo(mockUser);

            const oldStatus = order.status;
            const newStatus = oldStatus === 'PENDING' ? 'CONFIRMED' : 'PENDING';

            console.log(`Updating status: ${oldStatus} -> ${newStatus}`);
            order.status = newStatus;
            await order.save();

            console.log('Waiting for audit log...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            const latestLog = await AuditLog.findOne({
                resource: new RegExp(order._id.toString()),
                action: /Update/
            }).sort({ timestamp: -1 });

            if (latestLog) {
                console.log('MATCH FOUND:');
                console.log('Action:', latestLog.action);
                console.log('Captured Changes (details):', JSON.stringify(latestLog.details, null, 2));

                if (latestLog.details && latestLog.details.status === newStatus) {
                    console.log('VERIFICATION SUCCESSFUL');
                } else {
                    console.log('VERIFICATION FAILED: Details missing or incorrect');
                }
            } else {
                console.log('VERIFICATION FAILED: Log entry not found');
            }
        });

        setTimeout(() => process.exit(0), 1000);
    } catch (error) {
        console.error('CRITICAL ERROR:', error.stack || error);
        process.exit(1);
    }
}

verifyDiff();
