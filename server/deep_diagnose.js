/**
 * DEEP DIAGNOSTIC: Traces the full order-fetching pipeline for managers.
 * Compares storeId on orders vs assignedOutlets on manager accounts.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const DOKA_URI = process.env.MONGODB_URI;
const ADMIN_URI = DOKA_URI.replace('doka_cake_app', 'doka_admin_db');

const dokaConn = mongoose.createConnection(DOKA_URI, { dbName: 'doka_cake_app', tls: true, tlsAllowInvalidCertificates: true });
const adminConn = mongoose.createConnection(DOKA_URI, { dbName: 'doka_admin_db', tls: true, tlsAllowInvalidCertificates: true });

dokaConn.on('connected', () => console.log('[OK] Connected to doka_cake_app'));
adminConn.on('connected', () => console.log('[OK] Connected to doka_admin_db'));

const userSchema = new mongoose.Schema({ email: String, role: String, assignedOutlets: [String] });
const storeSchema = new mongoose.Schema({ name: String, type: String });
const orderSchema = new mongoose.Schema({ storeId: String, status: String, createdAt: Date }, { strict: false });

const run = async () => {
    await Promise.all([
        new Promise(r => dokaConn.once('open', r)),
        new Promise(r => adminConn.once('open', r))
    ]);

    const User = dokaConn.model('User', userSchema);
    const Order = dokaConn.model('Order', orderSchema);
    const Store = adminConn.model('Store', storeSchema);

    console.log('\n========= MANAGER ACCOUNT DATA =========');
    const managers = await User.find({ role: { $in: ['Store Manager', 'Area Manager'] } });
    for (const m of managers) {
        console.log(`\n[${m.role}] ${m.email}`);
        console.log(`  assignedOutlets: ${JSON.stringify(m.assignedOutlets)}`);
    }

    console.log('\n========= STORES IN ADMIN DB =========');
    const stores = await Store.find({}).select('name _id type');
    for (const s of stores) {
        console.log(`  "${s.name}" (${s.type}) -> _id: ${s._id}`);
    }

    console.log('\n========= RECENT ORDERS (last 10) =========');
    const orders = await Order.find({}).sort({ createdAt: -1 }).limit(10).select('storeId status createdAt');
    for (const o of orders) {
        console.log(`  storeId: "${o.storeId}" | status: ${o.status} | date: ${o.createdAt?.toISOString()?.slice(0, 10)}`);
    }

    console.log('\n========= MATCH CHECK =========');
    for (const m of managers) {
        const outlets = m.assignedOutlets || [];
        // Check by name
        const matchedStores = stores.filter(s => outlets.includes(s.name));
        const matchedIds = matchedStores.map(s => s._id.toString());
        const allPossible = [...outlets, ...matchedIds];

        const matchingOrders = orders.filter(o => allPossible.includes(o.storeId));
        console.log(`\n[${m.role}] ${m.email}`);
        console.log(`  Possible storeId values: ${JSON.stringify(allPossible)}`);
        console.log(`  Matching orders in last 10: ${matchingOrders.length}`);
        if (matchingOrders.length === 0 && orders.length > 0) {
            console.log(`  ❌ MISMATCH! Orders have storeId="${orders[0].storeId}" but manager expects one of: ${JSON.stringify(allPossible)}`);
        } else if (matchingOrders.length > 0) {
            console.log(`  ✅ MATCH! Orders found for this manager.`);
        }
    }

    process.exit(0);
};

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
