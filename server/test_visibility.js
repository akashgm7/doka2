const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { adminConnection, dokaConnection } = require('./config/db');

const testControllers = async () => {
    try {
        console.log("Connecting to DBs...");
        if (adminConnection.readyState !== 1) await new Promise(r => adminConnection.once('open', r));
        if (dokaConnection.readyState !== 1) await new Promise(r => dokaConnection.once('open', r));

        const User = require('./models/User');
        const Store = require('./models/Store');
        const Order = require('./models/Order');
        const { getOrders } = require('./controllers/orderController');
        const { getDashboardStats } = require('./controllers/dashboardController');

        const mockUser = await User.findOne({ email: 'store@cake.com' }).lean();
        if (!mockUser) {
            console.log("store@cake.com not found");
            process.exit(1);
        }

        // Mock req/res
        const req = {
            user: {
                ...mockUser,
                id: mockUser._id.toString()
            },
            query: {}
        };
        const res = {
            json: (data) => {
                // console.log("Response:", data);
                if (Array.isArray(data)) console.log("Orders found:", data.length);
                else console.log("Dashboard stats returned: Revenue =", data.revenue);
            },
            status: (code) => ({
                json: (err) => console.log("Error", code, err)
            })
        };

        console.log("Testing getOrders...");
        await getOrders(req, res);

        console.log("Testing getDashboardStats...");
        await getDashboardStats(req, res);

        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
};

testControllers();
