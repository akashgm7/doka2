const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const { getLogs } = require('./controllers/auditController');

// Mock Request/Response
const mockReq = (user, query = {}) => ({
    user,
    query,
    headers: {}
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        console.log(`Response Status: ${code}`);
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        console.log('Response JSON:', Array.isArray(data) ? `Array of ${data.length} items` : data);
        return res;
    };
    return res;
};

const test = async () => {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }
        console.log('Connected to DB');

        // Test 1: Brand Admin
        console.log('\n--- Test 1: Brand Admin ---');
        const brandAdminUser = {
            email: 'brand@test.com',
            role: 'Brand Admin',
            assignedBrand: 'brand-123', // Mock ID
            permissions: ['view_audit_logs']
        };
        await getLogs(mockReq(brandAdminUser), mockRes());

        // Test 2: Super Admin
        console.log('\n--- Test 2: Super Admin ---');
        const superAdminUser = {
            email: 'super@test.com',
            role: 'Super Admin',
            permissions: ['view_audit_logs', 'manage_roles']
        };
        await getLogs(mockReq(superAdminUser), mockRes());

        // Test 3: Store Manager
        console.log('\n--- Test 3: Store Manager ---');
        const storeManagerUser = {
            email: 'store@test.com',
            role: 'Store Manager',
            assignedOutlets: ['outlet-1', 'outlet-2'],
            permissions: ['view_audit_logs']
        };
        await getLogs(mockReq(storeManagerUser), mockRes());

        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err);
        process.exit(1);
    }
};

test();
