const mongoose = require('mongoose');
const { adminConnection } = require('../config/db');

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
    }
}, {
    timestamps: true
});

const Role = adminConnection.model('Role', roleSchema);

module.exports = Role;
