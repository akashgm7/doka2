const mongoose = require('mongoose');
const { dokaConnection } = require('../config/db');

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    target: {
        type: String,
        required: true,
        enum: [
            'All Users',
            'Staff',
            'Customers',
            'Brand Admins',
            'Brand Users',
            'Brand Staff',
            'Brand Customers',
            'Area Staff',
            'Area Manager',
            'Store Manager',
            'Factory Manager',
            'Store Staff'
        ]
    },
    type: {
        type: String,
        enum: ['Manual', 'Automated'],
        default: 'Manual'
    },
    status: {
        type: String,
        enum: ['Sent', 'Draft', 'Scheduled'],
        default: 'Sent'
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    brandId: {
        type: String, // ID of the brand if scoped
        default: null
    },
    storeId: {
        type: String, // ID of the store for store-specific notifications
        default: null
    },
    orderId: {
        type: String, // Linked order ID for "View Order" functionality
        default: null
    },
    sentAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Notification = dokaConnection.model('Notification', notificationSchema);

module.exports = Notification;
