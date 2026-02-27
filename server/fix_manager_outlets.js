/**
 * PRECISION FIX SCRIPT
 * Finds all orders, all stores, and all managers.
 * Determines the exact storeId format used in orders,
 * then updates the manager's assignedOutlets to match.
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
    console.log('Connected.');

    const userSchema = new mongoose.Schema({ email: String, role: String, assignedOutlets: [String] });
    const storeSchema = new mongoose.Schema({ name: String, type: String }, { strict: false });
    const orderSchema = new mongoose.Schema({ storeId: mongoose.Schema.Types.Mixed, status: String, createdAt: Date }, { strict: false });

    const User = dokaConn.model('User', userSchema);
    const Order = dokaConn.model('Order', orderSchema);
    const Store = adminConn.model('Store', storeSchema);

    // Get all stores
    const allStores = await Store.find({});
    console.log('\n=== STORES ===');
    allStores.forEach(s => console.log(`  name="${s.name}" _id="${s._id}" type=${s.type}`));

    // Get recent orders and what storeId they use
    const sampleOrders = await Order.find({}).sort({ createdAt: -1 }).limit(20).select('storeId status');
    console.log('\n=== ORDER storeId VALUES (last 20 orders) ===');
    const storeIdSet = new Set();
    sampleOrders.forEach(o => {
        const sid = o.storeId ? o.storeId.toString() : 'null';
        storeIdSet.add(sid);
        console.log(`  storeId="${sid}" status=${o.status}`);
    });

    const uniqueStoreIds = [...storeIdSet];
    console.log('\n=== UNIQUE STORE IDs IN ORDERS ===', uniqueStoreIds);

    // Get managers
    const managers = await User.find({ role: { $in: ['Store Manager', 'Area Manager'] } });
    console.log('\n=== MANAGERS ===');
    managers.forEach(m => console.log(`  [${m.role}] ${m.email} => assignedOutlets: ${JSON.stringify(m.assignedOutlets)}`));

    // AUTO-FIX: assign the unique storeIds from orders to matching managers
    // For Store Manager: assign to first outlet store that is an Outlet type
    // For Area Manager: assign all outlets
    const outletStores = allStores.filter(s => s.type === 'Outlet');
    const outletIds = outletStores.map(s => s._id.toString());
    const outletNames = outletStores.map(s => s.name);

    console.log('\n=== FIXING MANAGER ASSIGNMENTS ===');
    for (const m of managers) {
        // Check if they already have valid assignments
        const hasValidOutlets = m.assignedOutlets && m.assignedOutlets.some(o =>
            uniqueStoreIds.includes(o) || outletIds.includes(o) || outletNames.includes(o)
        );

        if (!hasValidOutlets) {
            console.log(`  [FIXING] ${m.email} - adding outlet store IDs: ${JSON.stringify(outletIds)}`);
            await User.updateOne({ _id: m._id }, { $set: { assignedOutlets: outletIds } });
            console.log(`  [DONE] ${m.email} updated.`);
        } else {
            console.log(`  [OK] ${m.email} already has valid outlets: ${JSON.stringify(m.assignedOutlets)}`);
        }
    }

    // Verify
    console.log('\n=== VERIFICATION (after fix) ===');
    const updatedManagers = await User.find({ role: { $in: ['Store Manager', 'Area Manager'] } });
    updatedManagers.forEach(m => console.log(`  [${m.role}] ${m.email} => assignedOutlets: ${JSON.stringify(m.assignedOutlets)}`));

    process.exit(0);
};

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
