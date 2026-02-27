const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config(); // Load env vars BEFORE requiring db config

const { dokaConnection } = require('./config/db');
const Order = require('./models/Order');

const sampleOrders = [
    {
        orderId: 'ORD-1001',
        customerName: 'Alice Johnson',
        customerId: 'CUST-001',
        items: [
            { name: 'Chocolate Truffle', quantity: 1, price: 450 },
            { name: 'Red Velvet Cupcake', quantity: 2, price: 120 }
        ],
        totalAmount: 690,
        status: 'Pending',
        paymentStatus: 'Paid',
        storeId: 'store-001',
        storeName: 'Downtown Outlet',
        deliveryMode: 'Pickup',
        createdAt: new Date()
    },
    {
        orderId: 'ORD-1002',
        customerName: 'Bob Smith',
        customerId: 'CUST-002',
        items: [
            { name: 'Black Forest Cake', quantity: 1, price: 550 }
        ],
        totalAmount: 550,
        status: 'Confirmed',
        paymentStatus: 'Paid',
        storeId: 'store-002',
        storeName: 'Mall Plaza Outlet',
        deliveryMode: 'Delivery',
        deliveryAddress: '123 Main St, Cityville',
        createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
        orderId: 'ORD-1003',
        customerName: 'Charlie Brown',
        customerId: 'CUST-003',
        items: [
            { name: 'Custom Birthday Cake', quantity: 1, price: 1200 }
        ],
        totalAmount: 1200,
        status: 'In Production',
        paymentStatus: 'Paid',
        isMMC: true,
        factoryId: 'factory-001',
        mmcConfig: { shape: 'Round', flavor: 'Vanilla', size: '2kg', tiers: '2', message: 'Happy Birthday!' },
        deliveryMode: 'Standard Delivery',
        deliveryAddress: '456 Elm St, Townsville',
        createdAt: new Date(Date.now() - 7200000) // 2 hours ago
    },
    {
        orderId: 'ORD-1004',
        customerName: 'Diana Prince',
        customerId: 'CUST-004',
        items: [
            { name: 'Blueberry Cheesecake', quantity: 1, price: 800 }
        ],
        totalAmount: 800,
        status: 'Ready',
        paymentStatus: 'Paid',
        storeId: 'store-001',
        storeName: 'Downtown Outlet',
        deliveryMode: 'Pickup',
        createdAt: new Date(Date.now() - 10800000) // 3 hours ago
    },
    {
        orderId: 'ORD-1005',
        customerName: 'Evan Wright',
        customerId: 'CUST-005',
        items: [
            { name: 'Macaron Box (6pc)', quantity: 2, price: 300 }
        ],
        totalAmount: 600,
        status: 'Completed',
        paymentStatus: 'Paid',
        storeId: 'store-003',
        storeName: 'Airport Kiosk',
        deliveryMode: 'Pickup',
        createdAt: new Date(Date.now() - 86400000) // 1 day ago
    },
    {
        orderId: 'ORD-1006',
        customerName: 'Fiona Green',
        customerId: 'CUST-006',
        items: [
            { name: 'Pineapple Pastry', quantity: 4, price: 80 }
        ],
        totalAmount: 320,
        status: 'Cancelled',
        paymentStatus: 'Failed',
        storeId: 'store-002',
        storeName: 'Mall Plaza Outlet',
        cancellationReason: 'Payment Failed',
        createdAt: new Date(Date.now() - 90000000) // 1 day ago
    },
    {
        orderId: 'ORD-1007',
        customerName: 'George King',
        customerId: 'CUST-007',
        items: [
            { name: 'Wedding Cake', quantity: 1, price: 5000 }
        ],
        totalAmount: 5000,
        status: 'In Production',
        paymentStatus: 'Paid',
        isMMC: true,
        factoryId: 'factory-001',
        mmcConfig: { shape: 'Square', flavor: 'Mix Fruit', size: '5kg', tiers: '3', message: 'Happy Wedding!' },
        deliveryMode: 'Standard Delivery',
        deliveryAddress: '789 Oak Ave, Villagetown',
        createdAt: new Date(Date.now() - 20000000) // 5 hours ago
    },
    {
        orderId: 'ORD-1008',
        customerName: 'Hannah Lee',
        items: [{ name: 'Brownie', quantity: 5, price: 100 }],
        totalAmount: 500,
        status: 'Pending',
        storeId: 'store-001',
        storeName: 'Downtown Outlet',
        createdAt: new Date()
    },
    {
        orderId: 'ORD-1009',
        customerName: 'Ian Scott',
        items: [{ name: 'Fruit Tart', quantity: 3, price: 150 }],
        totalAmount: 450,
        status: 'Confirmed',
        storeId: 'store-003',
        storeName: 'Airport Kiosk',
        createdAt: new Date(Date.now() - 1800000) // 30 mins ago
    },
    {
        orderId: 'ORD-1010',
        customerName: 'Jane Doe',
        items: [{ name: 'Lava Cake', quantity: 2, price: 200 }],
        totalAmount: 400,
        status: 'Completed',
        storeId: 'store-002',
        storeName: 'Mall Plaza Outlet',
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
        await Order.insertMany(sampleOrders);

        console.log('Orders seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding orders:', error);
        process.exit(1);
    }
};

seedOrders();
