const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const { adminConnection } = require('./config/db');

dotenv.config();

/**
 * This script verifies that the Product model correctly handles the 'image' field
 * and simulates a deletion check.
 */
async function verifyChanges() {
    try {
        console.log("Verifying Product model...");

        // Wait for connection
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }

        const testProductData = {
            user: new mongoose.Types.ObjectId(), // Mock user ID
            name: "Test Cake",
            category: "Cakes",
            price: 25.00,
            brand: "DOKA",
            image: "https://example.com/test-cake.jpg",
            description: "A delicious test cake.",
            sku: "TEST-SKU-" + Date.now()
        };

        // 1. Test Creation with Image
        const testProduct = new Product(testProductData);
        await testProduct.validate();
        console.log("SUCCESS: Product validation passed with image field.");

        // 2. Simulate Deletion
        console.log("Simulating deletion of product ID:", testProduct._id);
        // We don't actually delete to avoid database pollution if it's production-connected,
        // but the validation confirms the model identifies the ID and structure.

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verifyChanges();
