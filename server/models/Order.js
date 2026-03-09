const mongoose = require('mongoose');
const { dokaConnection } = require('../config/db');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            product: {
                type: String, // String to support custom cake IDs (mmc-...)
                required: true,
            },
            customization: {
                shape: String,
                flavour: String,
                design: String,
                size: String,
                message: String
            }
        },
    ],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, default: 'IN' },
    },
    paymentMethod: {
        type: String,
        required: true,
        default: 'Razorpay'
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0,
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    isDelivered: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING',
    },
    // Admin Specific / Metadata
    storeId: String,
    brandId: { type: String, default: 'brand-001' },
    isMMC: { type: Boolean, default: false },
    orderId: { type: String }, // Legacy compatibility
    earnedLoyaltyPoints: {
        type: Number,
        default: 0
    },
    // Customer Feedback
    feedback: {
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true },
        submittedAt: { type: Date }
    }
}, {
    timestamps: true
});

const auditPlugin = require('../plugins/auditPlugin');
orderSchema.plugin(auditPlugin);

const Order = dokaConnection.model('Order', orderSchema);

module.exports = Order;
