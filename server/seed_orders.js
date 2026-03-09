const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') }); // Load env vars BEFORE requiring db config

const { dokaConnection } = require('./config/db');
const Order = require('./models/Order');
const User = require('./models/User'); // Import User Model

const sampleOrders = [
    {
        orderId: 'ORD-1001',
        customerName: 'Alice Johnson',
        orderItems: [
            { name: 'Chocolate Truffle', qty: 1, price: 450, product: 'product-id-1', image: 'url' },
            { name: 'Red Velvet Cupcake', qty: 2, price: 120, product: 'product-id-2', image: 'url' }
        ],
        totalPrice: 690,
        status: 'PENDING',
        paymentStatus: 'Paid',
        storeId: 'store-001',
        brandId: 'brand-001',
        shippingAddress: { address: '123 Fake', city: 'City', postalCode: '12345' },
        createdAt: new Date()
    },
    {
        orderId: 'ORD-1002',
        customerName: 'Bob Smith',
        orderItems: [
            { name: 'Black Forest Cake', qty: 1, price: 550, product: 'product-id-3', image: 'url' }
        ],
        totalPrice: 550,
        status: 'CONFIRMED',
        paymentStatus: 'Paid',
        storeId: 'store-002',
        brandId: 'brand-001',
        shippingAddress: { address: '123 Main St', city: 'Cityville', postalCode: '12345' },
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
        orderId: 'ORD-1003',
        customerName: 'Charlie Brown',
        orderItems: [
            { name: 'Custom Birthday Cake', qty: 1, price: 1200, product: 'mmc-custom', image: 'url' }
        ],
        totalPrice: 1200,
        status: 'IN_PRODUCTION',
        paymentStatus: 'Paid',
        isMMC: true,
        storeId: 'factory-001',
        brandId: 'brand-001',
        shippingAddress: { address: '456 Elm St', city: 'Townsville', postalCode: '54321' },
        createdAt: new Date(Date.now() - 7200000) // 2 hours ago
    },
    {
        orderId: 'ORD-1004',
        customerName: 'Diana Prince',
        orderItems: [
            { name: 'Blueberry Cheesecake', qty: 1, price: 800, product: 'product-id-4', image: 'url' }
        ],
        totalPrice: 800,
        status: 'READY',
        paymentStatus: 'Paid',
        storeId: 'store-001',
        brandId: 'brand-001',
        shippingAddress: { address: 'Pickup', city: 'City', postalCode: '11111' },
        createdAt: new Date(Date.now() - 10800000) // 3 hours ago
    },
    {
        orderId: 'ORD-1005',
        customerName: 'Evan Wright',
        orderItems: [
            { name: 'Macaron Box (6pc)', qty: 2, price: 300, product: 'product-id-5', image: 'url' }
        ],
        totalPrice: 600,
        status: 'DELIVERED',
        paymentStatus: 'Paid',
        storeId: 'store-003',
        brandId: 'brand-001',
        shippingAddress: { address: 'Pickup', city: 'City', postalCode: '11111' },
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
        orderId: 'ORD-1006',
        customerName: 'Fiona Green',
        orderItems: [
            { name: 'Pineapple Pastry', qty: 4, price: 80, product: 'product-id-6', image: 'url' }
        ],
        totalPrice: 320,
        status: 'CANCELLED',
        paymentStatus: 'Failed',
        storeId: 'store-002',
        brandId: 'brand-001',
        shippingAddress: { address: 'Pickup', city: 'City', postalCode: '11111' },
        createdAt: new Date(Date.now() - 90000000) // 1 day ago
    },
    {
        orderId: 'ORD-1007',
        customerName: 'George King',
        orderItems: [
            { name: 'Wedding Cake', qty: 1, price: 5000, product: 'mmc-custom-1', image: 'url' }
        ],
        totalPrice: 5000,
        status: 'IN_PRODUCTION',
        paymentStatus: 'Paid',
        isMMC: true,
        storeId: 'factory-001',
        brandId: 'brand-001',
        shippingAddress: { address: '789 Oak Ave', city: 'Villagetown', postalCode: '34433' },
        createdAt: new Date(Date.now() - 20000000) // 5 hours ago
    },
    {
        orderId: 'ORD-1008',
        customerName: 'Hannah Lee',
        orderItems: [{ name: 'Brownie', qty: 5, price: 100, product: 'product-id-7', image: 'url' }],
        totalPrice: 500,
        status: 'PENDING',
        storeId: 'store-001',
        brandId: 'brand-001',
        shippingAddress: { address: 'Pickup', city: 'City', postalCode: '11111' },
        createdAt: new Date()
    },
    {
        orderId: 'ORD-1009',
        customerName: 'Ian Scott',
        orderItems: [{ name: 'Fruit Tart', qty: 3, price: 150, product: 'product-id-8', image: 'url' }],
        totalPrice: 450,
        status: 'CONFIRMED',
        storeId: 'store-003',
        brandId: 'brand-001',
        shippingAddress: { address: 'Pickup', city: 'City', postalCode: '11111' },
        createdAt: new Date(Date.now() - 1800000) // 30 mins ago
    },
    {
        orderId: 'ORD-1010',
        customerName: 'Jane Doe',
        orderItems: [{ name: 'Lava Cake', qty: 2, price: 200, product: 'product-id-9', image: 'url' }],
        totalPrice: 400,
        status: 'DELIVERED',
        storeId: 'store-002',
        brandId: 'brand-001',
        shippingAddress: { address: 'Pickup', city: 'City', postalCode: '11111' },
        createdAt: new Date(Date.now() - 172800000) // 2 days ago
    }
];

const seedOrders = async () => {
    try {
        console.log('Connecting to DB...');
        // Wait for connection to be ready
        if (dokaConnection.readyState !== 1) {
            await new Promise(resolve => dokaConnection.once('open', resolve));
        }

        console.log('Clearing existing orders...');
        await Order.deleteMany({});

        console.log('Seeding new orders...');

        // Find the test customer user to attach to orders
        const customerUser = await User.findOne({ email: 'customer@doka.com' });
        if (!customerUser) {
            console.error("Test customer ('customer@doka.com') not found! Please run seed_rbac_final.cjs first.");
            process.exit(1);
        }

        // Map and add user reference to all orders
        const ordersToInsert = sampleOrders.map(order => ({
            ...order,
            user: customerUser._id, // Add the required user reference
        }));

        await Order.insertMany(ordersToInsert);

        console.log('Orders seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding orders:', error);
        process.exit(1);
    }
};

seedOrders();
