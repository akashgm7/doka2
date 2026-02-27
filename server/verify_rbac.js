const { hasPermission } = require('./middleware/authMiddleware');

// Mock Data
const mockReq = (role, permissions = []) => ({
    user: { role, permissions },
    headers: {}
});

const mockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const mockNext = () => 'NEXT_CALLED';

const checkPermission = (role, permissions, requiredPermission) => {
    const req = mockReq(role, permissions);
    const res = mockRes();

    // hasPermission Middleware
    const middleware = hasPermission(requiredPermission);

    const result = middleware(req, res, mockNext);

    if (result === 'NEXT_CALLED') return '✅ GRANTED';
    return `❌ DENIED (${res.statusCode})`;
};

console.log("=== REAL PERMISSION VERIFICATION REPORT ===");
console.log("(Testing granular permission strings)\n");

// Scenario: A Factory User with custom permissions
const factoryUserRole = 'Factory User';
const factoryPerms = ['view_dashboard', 'view_production'];

console.log("[TEST] Factory User Access:");
console.log(`Permission 'view_production': ${checkPermission(factoryUserRole, factoryPerms, 'view_production')}`);
console.log(`Permission 'manage_users':    ${checkPermission(factoryUserRole, factoryPerms, 'manage_users')}`);

console.log("\n[TEST] Super Admin Access (Dynamic Bypass):");
console.log(`Permission 'manage_users':    ${checkPermission('Super Admin', [], 'manage_users')}`);

console.log("\n[TEST] Custom Permissions:");
const managerPerms = ['view_dashboard', 'manage_users'];
console.log(`Permission 'manage_users':    ${checkPermission('Store Manager', managerPerms, 'manage_users')}`);

console.log("\n=== END REPORT ===");
