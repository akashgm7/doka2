const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { adminConnection, dokaConnection } = require('./config/db');

const investigate = async () => {
    try {
        if (adminConnection.readyState !== 1) await new Promise(r => adminConnection.once('open', r));
        const Store = adminConnection.collection('stores');
        const stores = await Store.find({}).toArray();
        console.log("Current Stores:");
        stores.forEach(s => {
            console.log(` - Name: "${s.name}", ID: ${s._id}`);
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

investigate();
