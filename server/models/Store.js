const mongoose = require('mongoose');
const { adminConnection } = require('../config/db');

const storeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['Outlet', 'Factory'], required: true },
    address: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: {
        lat: Number,
        lng: Number
    },

    brandId: { type: String, default: 'brand-001' },

    // Operational Status
    status: { type: String, enum: ['Open', 'Closed', 'Disabled'], default: 'Open' },

    // Configuration / Timings
    timings: {
        open: { type: String, default: '09:00' },
        close: { type: String, default: '21:00' }
    },

    // Capabilities
    capabilities: {
        delivery: { type: Boolean, default: true },
        pickup: { type: Boolean, default: true },
        dineIn: { type: Boolean, default: false }
    },

    // Geo-Fencing
    geoFence: [{
        lat: Number,
        lng: Number
    }],

    // Inventory / Menu (Simplified link)
    availableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, {
    timestamps: true
});

const Store = adminConnection.model('Store', storeSchema);

module.exports = Store;
