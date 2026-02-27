const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const { dokaConnection, adminConnection } = require('./config/db');

const check = async () => {
    console.log("Doka Connection State:", dokaConnection.readyState);
    console.log("Admin Connection State:", adminConnection.readyState);

    // Wait for states to potentially change
    await new Promise(r => setTimeout(r, 5000));

    console.log("Doka Connection State after wait:", dokaConnection.readyState);
    console.log("Admin Connection State after wait:", adminConnection.readyState);

    process.exit(0);
};

check();
