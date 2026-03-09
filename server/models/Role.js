const mongoose = require('mongoose');
const { dokaConnection } = require('../config/db');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    permissions: [{
        type: String
    }],
    isSystem: {
        type: Boolean,
        default: false
    },
    scopeLevel: {
        type: String,
        enum: ['System', 'Brand', 'Outlet', 'Factory', 'None'],
        default: 'None'
    }
}, {
    timestamps: true
});

const auditPlugin = require('../plugins/auditPlugin');
roleSchema.plugin(auditPlugin);

const Role = dokaConnection.model('Role', roleSchema);

module.exports = Role;
