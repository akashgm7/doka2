const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();
require('./config/db');

const Product = require('./models/Product');
const Store = require('./models/Store');

const seedAdmin = async () => {
    try {
        console.log('Connecting to Admin DB...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log('Clearing existing Admin data...');
        await Product.deleteMany({});
        await Store.deleteMany({});

        console.log('Seeding Stores...');
        const stores = [
            {
                name: 'Main Street Bakery',
                type: 'Outlet',
                address: '123 Main St, New York, NY',
                coordinates: { lat: 40.7128, lng: -74.0060 },
                status: 'Open',
                settings: { openingTime: '08:00', closingTime: '20:00' }
            },
            {
                name: 'Westside Outlet',
                type: 'Outlet',
                address: '456 West Ave, New York, NY',
                coordinates: { lat: 40.7589, lng: -73.9851 },
                status: 'Open',
                settings: { openingTime: '09:00', closingTime: '21:00' }
            },
            {
                name: 'Central Factory',
                type: 'Factory',
                address: '789 Industrial Park, Jersey City, NJ',
                coordinates: { lat: 40.7178, lng: -74.0431 },
                status: 'Open',
                settings: { openingTime: '06:00', closingTime: '22:00' }
            }
        ];

        await Store.insertMany(stores);

        console.log('Seeding Products...');
        const products = [
            {
                name: 'Chocolate Fudge Cake',
                category: 'Cakes',
                basePrice: 25.00,
                sku: 'CAKE-CHOC-001',
                description: 'Rich and moist chocolate cake with fudge frosting.',
                image: '/images/chocolate-cake.jpg',
                ingredients: ['Flour', 'Sugar', 'Cocoa Powder', 'Eggs', 'Butter'],
                allergens: ['Gluten', 'Eggs', 'Dairy'],
                calories: 450,
                variants: [
                    { name: '1kg', price: 25.00, sku: 'CAKE-CHOC-001-1KG' },
                    { name: '500g', price: 15.00, sku: 'CAKE-CHOC-001-500G' }
                ]
            },
            {
                name: 'Red Velvet Cake',
                category: 'Cakes',
                basePrice: 30.00,
                sku: 'CAKE-RED-001',
                description: 'Classic red velvet cake with cream cheese frosting.',
                image: '/images/red-velvet.jpg',
                ingredients: ['Flour', 'Sugar', 'Cocoa Powder', 'Eggs', 'Butter', 'Red Food Color'],
                allergens: ['Gluten', 'Eggs', 'Dairy'],
                calories: 400,
                variants: [
                    { name: '1kg', price: 30.00, sku: 'CAKE-RED-001-1KG' }
                ]
            },
            {
                name: 'Croissant',
                category: 'Pastries',
                basePrice: 3.50,
                sku: 'PASTRY-CROT-001',
                description: 'Buttery, flaky, and golden croissant.',
                image: '/images/croissant.jpg',
                ingredients: ['Flour', 'Butter', 'Yeast', 'Sugar', 'Salt'],
                allergens: ['Gluten', 'Dairy'],
                calories: 250
            },
            {
                name: 'Custom Cake Base',
                category: 'MMC',
                basePrice: 50.00,
                sku: 'MMC-BASE-001',
                description: 'Base for Make My Cake custom orders.',
                isActive: true
            }
        ];

        await Product.insertMany(products);

        console.log('Admin Database populated successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding admin data:', error);
        process.exit(1);
    }
};

seedAdmin();
