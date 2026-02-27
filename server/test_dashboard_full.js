const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const test = async () => {
    try {
        await new Promise(resolve => dokaConnection.on('open', resolve));
        const Order = dokaConnection.model('Order', new mongoose.Schema({ status: String, brandId: String, isMMC: Boolean, createdAt: Date }));

        const roles = ['Super Admin', 'Brand Admin', 'Store Manager'];
        const range = 'Today';

        let startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        for (const role of roles) {
            let baseQuery = { createdAt: { $gte: startDate } };
            if (role === 'Brand Admin') {
                baseQuery.brandId = 'brand-001'; // Mock
            } else if (role === 'Store Manager') {
                baseQuery.isMMC = true;
            }

            const deliveredCount = await Order.countDocuments({ ...baseQuery, status: 'Delivered' });
            const failedCount = await Order.countDocuments({ ...baseQuery, status: 'Cancelled' });
            const meaningfulOrders = deliveredCount + failedCount;
            const successRate = meaningfulOrders > 0 ? Math.round((deliveredCount / meaningfulOrders) * 100) : 100;

            console.log(`Role: ${role}`);
            console.log(`  Delivered: ${deliveredCount}, Failed: ${failedCount}, Meaningful: ${meaningfulOrders}`);
            console.log(`  Success Rate: ${successRate}%`);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

test();
