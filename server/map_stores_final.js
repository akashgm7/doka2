const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { adminConnection } = require('./config/db');

const investigate = async () => {
    try {
        if (adminConnection.readyState !== 1) await new Promise(r => adminConnection.once('open', r));
        const Store = adminConnection.collection('stores');
        const stores = await Store.find({}).toArray();
        let output = "Current Stores:\n";
        stores.forEach(s => {
            output += ` - Name: "${s.name}", ID: ${s._id}\n`;
        });
        fs.writeFileSync('store_map.txt', output);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

investigate();
