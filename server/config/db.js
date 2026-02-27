const mongoose = require('mongoose');

// Base URI from .env (expected to be the cluster URI)
const baseUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doka_cake_app';

// Primary Connection (doka_cake_app)
const dokaConnection = mongoose.createConnection(baseUri, {
    dbName: 'doka_cake_app',
    tls: true,
    tlsAllowInvalidCertificates: true // Sometimes needed for specific network/Node environments
});

// Secondary Connection (admin)
const adminConnection = mongoose.createConnection(baseUri, {
    dbName: 'doka_admin_db',
    tls: true,
    tlsAllowInvalidCertificates: true
});

dokaConnection.on('connected', () => {
    console.log('Mongoose connected to doka_cake_app DB');
});

dokaConnection.on('error', (err) => {
    console.log('Mongoose connection error (doka_cake_app): ' + err);
});

adminConnection.on('connected', () => {
    console.log('Mongoose connected to doka_admin_db');
});

adminConnection.on('error', (err) => {
    console.log('Mongoose connection error (doka_admin_db): ' + err);
});

module.exports = {
    dokaConnection,
    adminConnection
};
