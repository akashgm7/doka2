const mongoose = require('mongoose');
require('dotenv').config();
const { dokaConnection } = require('./config/db');
const { auditContext } = require('./middleware/auditContext');
const Order = require('./models/Order');

async function runTest() {
    console.log('Waiting for Mongoose connection...');
    if (mongoose.connection.readyState !== 1) {
        await new Promise(resolve => dokaConnection.once('open', resolve));
    }
    console.log('Connected to DOKA DB.');

    // 1. Create a mock user ID for testing
    const mockUserId = new mongoose.Types.ObjectId();
    console.log(`Mock User ID Context: ${mockUserId}`);

    // Wait for models to initialize (plugin application)
    await new Promise(r => setTimeout(r, 1000));

    // 2. Wrap operations in the AsyncLocalStorage context
    await auditContext.run(new Map([['userId', mockUserId]]), async () => {
        console.log('\n--- 1. Testing Document Creation ---');
        // Create an order without passing any audit fields
        let order = new Order({
            user: new mongoose.Types.ObjectId(), // The customer ID
            orderItems: [{
                name: 'Test Cake',
                qty: 1,
                image: 'test.jpg',
                price: 50,
                product: 'product123',
                customization: {}
            }],
            shippingAddress: {
                address: '123 Test St',
                city: 'Test City',
                postalCode: '12345'
            },
            paymentMethod: 'Cash',
            totalPrice: 50
        });

        await order.save();
        console.log('Order created.');
        console.log(`addedBy: ${order.addedBy}`);
        console.log(`addedDate: ${order.addedDate}`);
        console.log(`modifiedBy: ${order.modifiedBy}`);
        console.log(`modifiedDate: ${order.modifiedDate}`);

        if (order.addedBy.toString() !== mockUserId.toString()) {
            console.error('❌ FAIL: addedBy does not match mockUserId');
            process.exit(1);
        } else {
            console.log('✅ PASS: addedBy is correctly set from context');
        }

        console.log('\n--- 2. Testing Document Update (findOneAndUpdate) ---');

        // Let's modify the context to simulate a different user updating the document
        const updaterId = new mongoose.Types.ObjectId();
        auditContext.getStore().set('userId', updaterId);
        console.log(`New updater ID Context: ${updaterId}`);

        // Update the order utilizing findOneAndUpdate
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: order._id },
            { $set: { status: 'CONFIRMED' } },
            { new: true }
        );

        console.log(`Updated Order Status: ${updatedOrder.status}`);
        console.log(`Original addedBy: ${updatedOrder.addedBy}`);
        console.log(`New modifiedBy: ${updatedOrder.modifiedBy}`);

        if (updatedOrder.modifiedBy.toString() !== updaterId.toString()) {
            console.error('❌ FAIL: modifiedBy does not match updaterId after findOneAndUpdate');
            process.exit(1);
        } else {
            console.log('✅ PASS: modifiedBy is correctly updated on findOneAndUpdate');
        }

        console.log('\n--- 3. Testing Document Update (.save) ---');

        const anotherUpdaterId = new mongoose.Types.ObjectId();
        auditContext.getStore().set('userId', anotherUpdaterId);
        console.log(`Another updater ID Context: ${anotherUpdaterId}`);

        updatedOrder.status = 'IN_PRODUCTION';
        await updatedOrder.save();

        console.log(`Updated Order Status: ${updatedOrder.status}`);
        console.log(`Original addedBy: ${updatedOrder.addedBy}`);
        console.log(`New modifiedBy: ${updatedOrder.modifiedBy}`);

        if (updatedOrder.modifiedBy.toString() !== anotherUpdaterId.toString()) {
            console.error('❌ FAIL: modifiedBy does not match anotherUpdaterId after .save()');
            process.exit(1);
        } else {
            console.log('✅ PASS: modifiedBy is correctly updated on .save()');
        }

        // Cleanup
        await Order.findByIdAndDelete(order._id);
        console.log('\nTest order cleaned up.');
    });

    console.log('\n✅ All plugin tests passed.');
    process.exit(0);
}

runTest().catch(err => {
    console.log('\n--- ERROR OCCURRED ---');
    console.log('Message:', err.message);
    if (err.errors) {
        Object.keys(err.errors).forEach(e => {
            console.log(e, err.errors[e].message);
        });
    }
    console.log('Stack:', err.stack);
});
