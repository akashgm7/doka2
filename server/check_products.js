const mongoose = require('mongoose');
require('dotenv').config();
const { adminConnection } = require('./config/db');
const Product = require('./models/Product');

const check = async () => {
    try {
        if (adminConnection.readyState !== 1) {
            await new Promise((resolve) => adminConnection.once('open', resolve));
        }

        const count = await Product.countDocuments({});
        console.log(`Total Products in DB: ${count}`);

        if (count > 0) {
            const products = await Product.find({}).limit(3);
            console.log('Sample Products:');
            console.log(JSON.stringify(products, null, 2));
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
