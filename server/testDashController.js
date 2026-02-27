const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { dokaConnection } = require('./config/db');
const { getDashboardStats } = require('./controllers/dashboardController');

// MOCK res object
const res = {
    json: (data) => {
        console.log("DASHBOARD STATS OK (ORDERS):", data.orders);
        process.exit(0);
    },
    status: (code) => {
        console.log("STATUS:", code);
        return res;
    }
};

async function run() {
    await new Promise(r => setTimeout(r, 2000));

    // MOCK req object (Store Manager context)
    const req = {
        user: {
            role: 'Store Manager',
            assignedBrand: 'brand-001',
            assignedOutlets: ["6996a03e2360532bcd99781e"]
        },
        query: {
            range: 'All Time'
        }
    };

    await getDashboardStats(req, res);
}

run().catch(e => { console.error(e); process.exit(1); });
