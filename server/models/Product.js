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
    collection: 'cakes' // Point to the same collection as the store
});

const Product = dokaConnection.model('Product', productSchema);

module.exports = Product;
