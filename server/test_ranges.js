const mongoose = require('mongoose');
require('dotenv').config();
const { dokaConnection } = require('./config/db');
require('./models/User');
require('./models/Store');
require('./models/Order');
require('./models/Role');
const { getDashboardStats } = require('./controllers/dashboardController');

async function testController(rangeStr) {
    try {
        console.log(`\n--- Testing Range: ${rangeStr} ---`);
        const req = {
            user: {
                role: 'Super Admin',
                assignedBrand: null,
                assignedOutlets: [],
                assignedFactory: null
            },
            query: { range: rangeStr }
        };
        const res = {
            json: function (data) {
                console.log(`[${rangeStr}] Total Orders parsed: ${data.totalOrders}`);
            },
            status: function (code) {
                console.log(`[${rangeStr}] Status Code:`, code);
                return this;
            }
        };

        await getDashboardStats(req, res);
    } catch (err) {
        console.error(err);
    }
}

async function run() {
    await new Promise(r => setTimeout(r, 2000));
    await testController('Today');
    await testController('Yesterday');
    await testController('This Month');
    await testController('Last Month');
    process.exit(0);
}

run();
