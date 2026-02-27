const mongoose = require('mongoose');
require('dotenv').config();
const { dokaConnection } = require('./config/db');
const User = require('./models/User');
const { getDashboardStats } = require('./controllers/dashboardController');

async function testApi() {
    try {
        await new Promise(r => setTimeout(r, 2000));

        // Find Brand Admin to emulate the exact token data
        const user = await User.findOne({ role: 'Brand Admin' });

        const req = {
            user: {
                role: user.role,
                assignedBrand: user.assignedBrand,
                assignedOutlets: user.assignedOutlets,
                assignedFactory: user.assignedFactory
            },
            query: { range: 'Yesterday' }
        };

        const res = {
            json: function (data) {
                console.log("--- Dashboard Response 'Yesterday' ---");
                console.log("Total Orders:", data.totalOrders);
                console.log("Revenue:", data.revenue);
                console.log("Today Revenue (comparative):", data.todayRevenue);
                process.exit(0);
            },
            status: function (code) {
                console.log("Status:", code);
                return this;
            }
        };

        await getDashboardStats(req, res);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testApi();
