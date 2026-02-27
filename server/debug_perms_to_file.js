const fs = require('fs');
const path = require('path');
const PERMISSIONS = require('./constants/permissions');

let output = "Current PERMISSIONS in constant file:\n";
output += JSON.stringify(PERMISSIONS, null, 2) + "\n\n";

const validPermIds = PERMISSIONS.map(p => p.id);
output += "Valid IDs list:\n";
output += JSON.stringify(validPermIds, null, 2) + "\n\n";

const testPerms = [
    'view_audit_logs', 'system_config', 'feature_toggles',
    'manage_master_menu', 'cancel_orders', 'notifications_manual',
    'notifications_automated', 'view_payments', 'manage_refunds',
    'download_invoices'
];

const invalid = testPerms.filter(p => !validPermIds.includes(p));
output += "Testing against the 'invalid' ones reported by user:\n";
if (invalid.length > 0) {
    output += "FAILED! These are missing from validPermIds: " + JSON.stringify(invalid) + "\n";
} else {
    output += "PASSED. All user-reported IDs are valid according to this script.\n";
}

fs.writeFileSync('debug_report.txt', output);
console.log("Report written to debug_report.txt");
