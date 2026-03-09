const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const { auditMiddleware } = require('./middleware/auditContext');
app.use(auditMiddleware);

// Database Connection
const { dokaConnection, adminConnection } = require('./config/db');

// Register Models early to avoid "Schema hasn't been registered" errors
const User = require('./models/User');
const Role = require('./models/Role');
const Store = require('./models/Store');
const Order = require('./models/Order');
const Notification = require('./models/Notification');
require('./models/Product');
require('./models/LoyaltyConfig');
require('./models/AuditLog');

// Routes
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const storeRoutes = require('./routes/storeRoutes');
const roleRoutes = require('./routes/roleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const auditRoutes = require('./routes/auditRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/loyalty', loyaltyRoutes);

app.get('/', (req, res) => {
    res.send('Cake Admin API is running');
});

// HTTP & Socket Server
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log('Dashboard client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Dashboard client disconnected');
    });
});

module.exports = { app, server, io }; // Export for potential usage in other files

// Real-time Order & Audit Watchers
dokaConnection.once('open', () => {
    console.log('MongoDB Watcher Active: Order Collection');
    const orderCollection = dokaConnection.collection('orders');
    const orderStream = orderCollection.watch();

    orderStream.on('change', async (change) => {
        if (change.operationType === 'insert') {
            const newOrder = change.fullDocument;
            console.log(`[Socket] Broadcasting new order: ${newOrder.orderId || newOrder._id}`);
            io.emit('new_order', { ...newOrder, id: newOrder._id });

            // Auto-persist a notification
            try {
                const systemUser = await User.findOne({ role: 'Super Admin' });
                if (systemUser) {
                    const notify = async (target, storeId) => {
                        const notif = await Notification.create({
                            title: "New Order",
                            message: `Order ${newOrder.orderId || newOrder._id.toString().slice(-6)} received.`,
                            target, sender: systemUser._id, type: 'Automated',
                            brandId: newOrder.brandId, storeId, orderId: newOrder.orderId || newOrder._id, status: 'Sent'
                        });
                        io.emit('new_notification', notif);
                    };
                    await notify('Brand Staff', null);
                    await notify('Store Manager', newOrder.storeId);
                }
            } catch (err) { console.error("Auto-notification Error:", err); }
        } else if (change.operationType === 'update') {
            console.log(`[Socket] Order updated: ${change.documentKey._id}`);
            io.emit('order_updated', { id: change.documentKey._id, updates: change.updateDescription.updatedFields });
        }
    });

    orderStream.on('error', (err) => {
        console.error('ChangeStream Error:', err);
    });
});

dokaConnection.once('open', () => {
    console.log('MongoDB Watcher Active: AuditLog Collection');
    const auditCollection = dokaConnection.collection('auditlogs');
    const auditStream = auditCollection.watch();

    auditStream.on('change', (change) => {
        if (change.operationType === 'insert') {
            const log = change.fullDocument;
            console.log(`[Socket] Broadcasting new audit log: ${log.action}`);
            io.emit('new_audit_log', log);
        }
    });

    auditStream.on('error', (err) => console.error('AuditStream Error:', err));
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
