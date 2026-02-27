/**
 * End-to-end test: simulates the exact API call the Area Manager dashboard makes
 * and logs what data would be returned.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DOKA_URI = process.env.MONGODB_URI;
const dokaConn = mongoose.createConnection(DOKA_URI, { dbName: 'doka_cake_app', tls: true, tlsAllowInvalidCertificates: true });
const adminConn = mongoose.createConnection(DOKA_URI, { dbName: 'doka_admin_db', tls: true, tlsAllowInvalidCertificates: true });

const run = async () => {
    await Promise.all([
        new Promise(r => dokaConn.once('open', r)),
        new Promise(r => adminConn.once('open', r))
    ]);
    console.log('Connected.\n');

    const userSchema = new mongoose.Schema({ email: String, role: String, assignedOutlets: [String] });
    const storeSchema = new mongoose.Schema({ name: String, type: String }, { strict: false });
    const orderSchema = new mongoose.Schema({ storeId: String, status: String, totalPrice: Number, createdAt: Date }, { strict: false });

    const User = dokaConn.model('U2', userSchema, 'users');
    const Order = dokaConn.model('O2', orderSchema, 'orders');
    const Store = adminConn.model('S2', storeSchema, 'stores');

    // Simulate area manager login
    const manager = await User.findOne({ email: 'area@cake.com' });
    const assignedOutlets = manager.assignedOutlets || [];

    console.log(`Manager: ${manager.email} (${manager.role})`);
    console.log(`Assigned Outlets: ${JSON.stringify(assignedOutlets)}`);

    // Same logic as updated orderController
    const storesByIdStr = await Store.find({
        _id: { $in: assignedOutlets.filter(o => /^[0-9a-fA-F]{24}$/.test(o)) }
    }).select('_id name');
    const idBasedIds = storesByIdStr.map(s => s._id.toString());
    const idBasedNames = storesByIdStr.map(s => s.name);
    const allPossible = [...new Set([...assignedOutlets, ...idBasedIds, ...idBasedNames])];

    console.log(`Resolved store IDs: ${JSON.stringify(idBasedIds)}`);
    console.log(`Store names: ${JSON.stringify(idBasedNames)}`);
    console.log(`All possible storeId values: ${JSON.stringify(allPossible)}`);

    // Count matching orders
    const matchingOrders = await Order.countDocuments({ storeId: { $in: allPossible } });
    const allOrders = await Order.countDocuments({});

    console.log(`\nTotal orders in DB: ${allOrders}`);
    console.log(`Orders matching manager's stores: ${matchingOrders}`);

    if (matchingOrders === 0 && allOrders > 0) {
        // Show what storeIds the actual orders use
        const sample = await Order.find({}).limit(5).select('storeId status');
        console.log('\n❌ MISMATCH! Actual order storeIds:');
        sample.forEach(o => console.log(`  "${o.storeId}"`));
        console.log('\nManager expects one of:', allPossible);
    } else if (matchingOrders > 0) {
        console.log('\n✅ SUCCESS! Orders will be returned for this manager.');
        const recent = await Order.find({ storeId: { $in: allPossible } }).sort({ createdAt: -1 }).limit(3);
        recent.forEach(o => console.log(`  Order storeId="${o.storeId}" status=${o.status}`));
    }

    process.exit(0);
};

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
