const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection } = require('./config/db');

const simulateOrder = async () => {
    try {
        console.log("Connecting to DB...");
        if (dokaConnection.readyState !== 1) {
            await new Promise(resolve => dokaConnection.once('open', resolve));
        }

        // Define minimal schema for insertion
        const orderSchema = new mongoose.Schema({
            user: mongoose.Schema.Types.ObjectId,
            customerName: String,
            totalPrice: Number,
            status: String,
            brandId: String,
            storeId: String,
            orderId: String,
            orderItems: Array,
            shippingAddress: Object,
            paymentMethod: String,
            createdAt: { type: Date, default: Date.now }
        });

        // Use the existing connection and check if model exists to avoid OverwriteModelError
        const Order = dokaConnection.models.Order || dokaConnection.model('Order', orderSchema);

        const newOrder = new Order({
            user: new mongoose.Types.ObjectId(),
            customerName: "Real-time Test User",
            totalPrice: 45.99,
            status: 'Pending',
            brandId: 'brand-001',
            storeId: '6996a03e2360532bcd99781e',
            orderId: 'T-ORD-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
            orderItems: [{ name: "Chocolate Cake", qty: 1, price: 45.99, image: "test.png", product: "test-prod" }],
            shippingAddress: { address: "123 Test St", city: "Test City", postalCode: "12345", country: "IN" },
            paymentMethod: "Razorpay"
        });

        console.log("Inserting simulated order:", newOrder.orderId);
        await newOrder.save();
        console.log("Order saved successfully! Check the dashboard for real-time notification.");

        setTimeout(() => process.exit(0), 1000);
    } catch (error) {
        console.error("Simulation failed:", error);
        process.exit(1);
    }
};

simulateOrder();
