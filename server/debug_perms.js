const PERMISSIONS = require('./constants/permissions');
console.log("Current PERMISSIONS in constant file:");
console.log(JSON.stringify(PERMISSIONS, null, 2));

const validPermIds = PERMISSIONS.map(p => p.id);
console.log("\nValid IDs list:");
console.log(validPermIds);

const testPerms = [
    'view_audit_logs', 'system_config', 'feature_toggles',
    'manage_master_menu', 'cancel_orders', 'notifications_manual',
    'notifications_automated', 'view_payments', 'manage_refunds',
    'download_invoices'
];

const invalid = testPerms.filter(p => !validPermIds.includes(p));
console.log("\nTesting against the 'invalid' ones reported by user:");
if (invalid.length > 0) {
    console.log("FAILED! These are missing from validPermIds:", invalid);
} else {
    console.log("PASSED. All user-reported IDs are valid according to this script.");
}
