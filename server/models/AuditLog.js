const mongoose = require('mongoose');
const { adminConnection } = require('../config/db');

const auditLogSchema = new mongoose.Schema({
    user: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, required: true },
    brandId: { type: String },
    outletId: { type: String },
    action: { type: String, required: true }, // e.g., 'Login', 'Logout', 'Update Order'
    resource: { type: String }, // e.g., 'Auth', 'Order #1234'
    ip: { type: String },
    status: { type: String, enum: ['Success', 'Failed'], default: 'Success' },
    details: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const AuditLog = adminConnection.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
