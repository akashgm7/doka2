const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { adminConnection, dokaConnection } = require('./config/db');

const test = async () => {
    try {
        console.log("Connecting to DBs...");
        if (adminConnection.readyState !== 1) await new Promise(r => adminConnection.once('open', r));
        if (dokaConnection.readyState !== 1) await new Promise(r => dokaConnection.once('open', r));

        const User = require('./models/User');
        const { getDashboardStats } = require('./controllers/dashboardController');

        const emails = ['store@cake.com', 'area@cake.com'];

        for (const email of emails) {
            console.log(`\n--- Testing ${email} ---`);
            const mockUser = await User.findOne({ email }).lean();
            if (!mockUser) {
                console.log(`${email} not found`);
                continue;
            }

            const req = {
                user: { ...mockUser, id: mockUser._id.toString() },
                query: { range: 'All Time' }
            };
            const res = {
                json: (data) => {
                    console.log(`Dashboard stats: Total Orders = ${data.totalOrders}, Revenue = ${data.revenue}`);
                },
                status: (code) => ({ json: (err) => console.log("Error", code, err) })
            };

            await getDashboardStats(req, res);
        }

        process.exit(0);
    } catch (error) {
        console.error("Test failed:", error);
        process.exit(1);
    }
};

test();
