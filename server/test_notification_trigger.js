require('dotenv').config();
const mongoose = require('mongoose');
const { dokaConnection } = require('./config/db');
const Order = require('./models/Order');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function testTargetedNotifications() {
    try {
        console.log('Testing notification generation on order insert...');
        await new Promise(resolve => dokaConnection.once('open', resolve));

        const dummyUser = await User.findOne({ role: 'Customer' });

        console.log('Inserting dummy order...');
        const newOrder = await Order.create({
            user: dummyUser._id,
            orderItems: [{
                name: 'Test Cake',
                qty: 1,
                image: 'test.png',
                price: 100,
                product: 'prod-001'
            }],
            shippingAddress: { address: 'A', city: 'C', postalCode: '1', country: 'IN' },
            totalPrice: 100,
            brandId: 'brand-test-001',
            storeId: 'store-test-001',
            status: 'Pending'
        });

        console.log('Order created: ' + newOrder._id);

        console.log('Waiting 3 seconds for change stream to fire...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Querying recent notifications...');
        const brandNotifs = await Notification.find({ type: 'Automated', brandId: 'brand-test-001', target: 'Brand Staff' });
        const storeNotifs = await Notification.find({ type: 'Automated', brandId: 'brand-test-001', storeId: 'store-test-001', target: 'Store Manager' });
        const staffNotifs = await Notification.find({ type: 'Automated', brandId: 'brand-test-001', target: 'Staff' });

        console.log('Brand Admin Notifs:', brandNotifs.length);
        console.log('Store Manager Notifs:', storeNotifs.length);
        console.log('Staff (Old) Notifs:', staffNotifs.length);

        if (brandNotifs.length > 0 && storeNotifs.length > 0 && staffNotifs.length === 0) {
            console.log('SUCCESS: Notifications correctly separated and generated without Staff broadcast!');
        } else {
            console.log('FAIL: Notification logic incorrect.');
        }

        console.log('Cleaning up...');
        await Order.findByIdAndDelete(newOrder._id);
        await Notification.deleteMany({ brandId: 'brand-test-001' });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testTargetedNotifications();
