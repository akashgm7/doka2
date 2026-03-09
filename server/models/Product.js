const mongoose = require('mongoose');
const { dokaConnection } = require('../config/db');

const productSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    name: { type: String, required: true },
    category: { type: String, default: 'General' }, // Cakes, Pastries, MMC
    price: { type: Number, required: true, default: 0 },
    brand: { type: String, required: true, default: 'DOKA' },
    image: { type: String, required: true },
    description: { type: String, required: true },
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
    sku: { type: String, unique: true },
    dietary: {
        type: String,
        enum: ['Egg', 'Eggless', 'N/A'],
        default: 'Eggless'
    },

    // Admin Specific Fields
    variants: [{
        name: String,
        price: Number,
        sku: String
    }],
    ingredients: [String],
    allergens: [String],
    calories: Number,
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
    collection: 'products' // Point to the same collection as the store
});

const auditPlugin = require('../plugins/auditPlugin');
productSchema.plugin(auditPlugin);

const Product = dokaConnection.model('Product', productSchema);

module.exports = Product;
