const Order = require('../models/Order');

// @desc    Get all payments (mapped from orders)
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
    const { role, assignedBrand, assignedOutlets, assignedFactory } = req.user;
    let query = {};

    if (role === 'Brand Admin') {
        query.brandId = assignedBrand;
    } else if (role === 'Area Manager' || role === 'Store Manager') {
        // TEMPORARY HUB: Open to all orders
    } else if (role === 'Factory Manager' || role === 'Factory User') {
        query.isMMC = true;
    } else if (role !== 'Super Admin') {
        return res.status(403).json({ message: 'Forbidden: Role not authorized for payments' });
    }

    try {
        const orders = await Order.find(query)
            .populate('user', 'name email mobile')
            .sort({ createdAt: -1 });

        const payments = orders.map(order => ({
            id: order.paymentResult?.id || `TXN-${order._id.toString().slice(-6).toUpperCase()}`,
            orderId: order.orderId || order._id,
            date: order.createdAt,
            customer: order.user?.name || (order.customerName) || 'Guest User',
            method: order.paymentMethod || 'Razorpay',
            amount: Number(order.totalPrice || order.totalAmount || 0),
            status: order.paymentStatus || (order.isPaid ? 'Paid' : 'Pending'),
            brandId: order.brandId
        }));

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
const getPaymentStats = async (req, res) => {
    const { role, assignedBrand, assignedOutlets, assignedFactory } = req.user;
    let query = {};

    if (role === 'Brand Admin') {
        query.brandId = assignedBrand;
    } else if (role === 'Area Manager' || role === 'Store Manager') {
        // TEMPORARY HUB: Open to all orders
    } else if (role === 'Factory Manager' || role === 'Factory User') {
        query.isMMC = true;
    } else if (role !== 'Super Admin') {
        return res.status(403).json({ message: 'Forbidden: Role not authorized for payments' });
    }

    try {
        const orders = await Order.find(query);

        const stats = {
            totalRevenue: orders
                .filter(o => o.paymentStatus === 'Paid' || o.isPaid || o.status === 'Delivered')
                .reduce((sum, o) => sum + Number(o.totalPrice || o.totalAmount || 0), 0),
            transactionCount: orders.length,
            failedCount: orders.filter(o => o.paymentStatus === 'Failed' || o.status === 'Cancelled').length,
            pendingCount: orders.filter(o => (o.paymentStatus === 'Pending' || !o.paymentStatus) && !o.isPaid).length
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPayments,
    getPaymentStats
};
