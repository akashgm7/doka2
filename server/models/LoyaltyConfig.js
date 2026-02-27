const mongoose = require('mongoose');
const { dokaConnection } = require('../config/db');

const loyaltyConfigSchema = new mongoose.Schema({
    enabled: { type: Boolean, default: true },
    earnRate: { type: Number, default: 1 }, // Points per $1 spent
    redemptionValue: { type: Number, default: 0.01 }, // $ value per point
    minRedemptionPoints: { type: Number, default: 100 },
    minOrderValueForEarn: { type: Number, default: 0 },
    expiryMonths: { type: Number, default: 12 },
    tiers: [
        {
            name: { type: String, required: true },
            minPoints: { type: Number, required: true },
            multiplier: { type: Number, default: 1 },
            color: { type: String }
        }
    ]
}, {
    timestamps: true
});

// Since there should be only one config, we can use a fixed ID or just findOne
const LoyaltyConfig = dokaConnection.model('LoyaltyConfig', loyaltyConfigSchema);

module.exports = LoyaltyConfig;
