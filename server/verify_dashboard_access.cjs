const axios = require('axios');

async function verifyDashboard() {
    const API_URL = 'http://localhost:5002/api';
    console.log('=== DASHBOARD ACCESS VERIFICATION ===');

    try {
        // 1. Login as Store Manager
        console.log('[STEP 1] Logging in as Store Manager...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'store@doka.com', // Using the test user from seed_rbac_final.cjs
            password: 'password123'
        });

        const token = loginRes.data.token;
        const role = loginRes.data.role;
        const permissions = loginRes.data.permissions;

        console.log(`Logged in as: ${role}`);
        console.log(`Permissions count: ${permissions.length}`);
        if (permissions.includes('sys_login')) {
            console.log('✅ Found sys_login permission');
        } else {
            console.error('❌ sys_login permission NOT found');
        }

        // 2. Fetch Dashboard Stats
        console.log('[STEP 2] Fetching dashboard stats...');
        try {
            const statsRes = await axios.get(`${API_URL}/dashboard/stats?range=This+Week`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Dashboard stats loaded successfully (Status: 200)');
            console.log('Revenue:', statsRes.data.revenue);
            console.log('Total Orders:', statsRes.data.totalOrders);
        } catch (error) {
            console.error('❌ Failed to load dashboard stats:', error.response ? `${error.response.status} ${JSON.stringify(error.response.data)}` : error.message);
        }

    } catch (error) {
        console.error('Verification failed:', error.response ? `${error.response.status} ${JSON.stringify(error.response.data)}` : error.message);
    }
}

verifyDashboard();
