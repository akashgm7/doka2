const Order = require('../models/Order');

// @desc    Get all payments (mapped from orders)
// @route   GET /api/payments
// @access  Private
// @desc    Get all payments (mapped from orders)
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
    const { role, assignedBrand, assignedOutlets, assignedFactory } = req.user;
    const { range, startDate: qStart, endDate: qEnd, status, method } = req.query;

    let query = {};

    // 1. Role-based scoping
    if (role === 'Brand Admin') {
        query.brandId = assignedBrand;
    } else if (role === 'Area Manager' || role === 'Store Manager') {
        // TEMPORARY HUB: Open to all orders
    } else if (role === 'Factory Manager' || role === 'Factory User') {
        query.isMMC = true;
    } else if (role !== 'Super Admin') {
        return res.status(403).json({ message: 'Forbidden: Role not authorized for payments' });
    }

    // 2. Date Filtering (IST Aligned)
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const getISTStartOfDay = (d) => {
        const istDate = new Date(d.getTime() + IST_OFFSET);
        istDate.setUTCHours(0, 0, 0, 0);
        return new Date(istDate.getTime() - IST_OFFSET);
    };
    const getISTEndOfDay = (d) => {
        const istDate = new Date(d.getTime() + IST_OFFSET);
        istDate.setUTCHours(23, 59, 59, 999);
        return new Date(istDate.getTime() - IST_OFFSET);
    };

    if (range && range !== 'All Time') {
        let start, end = getISTEndOfDay(new Date());

        if (range === 'Today') {
            start = getISTStartOfDay(new Date());
        } else if (range === 'Yesterday') {
            const yest = new Date(Date.now() - 86400000);
            start = getISTStartOfDay(yest);
            end = getISTEndOfDay(yest);
        } else if (range === 'This Week' || range === 'Week') {
            start = new Date(getISTStartOfDay(new Date()).getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (range === 'This Month' || range === 'Month') {
            const now = new Date(Date.now() + IST_OFFSET);
            const mStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            start = new Date(mStart.getTime() - IST_OFFSET);
        } else if (range === 'Last Month') {
            const now = new Date(Date.now() + IST_OFFSET);
            const firstOfThis = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            const lastOfLast = new Date(firstOfThis.getTime() - 1);
            const firstOfLast = new Date(Date.UTC(lastOfLast.getUTCFullYear(), lastOfLast.getUTCMonth(), 1));
            start = new Date(firstOfLast.getTime() - IST_OFFSET);
            const lastOfLastIST = new Date(lastOfLast.getTime() + IST_OFFSET);
            lastOfLastIST.setUTCHours(23, 59, 59, 999);
            end = new Date(lastOfLastIST.getTime() - IST_OFFSET);
        } else if (range === 'Custom' || range === 'Custom Date' || range === 'Date Range') {
            if (qStart) {
                const [y, m, d] = qStart.split('-').map(Number);
                start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - IST_OFFSET);
                if (qEnd) {
                    const [ey, em, ed] = qEnd.split('-').map(Number);
                    end = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999) - IST_OFFSET);
                } else {
                    end = new Date(start.getTime() + 86400000 - 1);
                }
            }
        }

        if (start) {
            query.createdAt = { $gte: start, $lte: end };
        }
    }

    // 3. Status Filtering
    if (status && status !== 'All') {
        // Use case-insensitive regex for robust matching (e.g., 'paid' or 'Paid')
        query.paymentStatus = { $regex: new RegExp(`^${status}$`, 'i') };
    }

    // 4. Method Filtering
    if (method && method !== 'All') {
        query.paymentMethod = method;
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
    const { range, startDate: qStart, endDate: qEnd, status, method } = req.query;

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

    // Apply the same filters as getPayments for stats consistency
    const IST_OFFSET = 5.5 * 60 * 60 * 1000;
    const getISTStartOfDay = (d) => {
        const istDate = new Date(d.getTime() + IST_OFFSET);
        istDate.setUTCHours(0, 0, 0, 0);
        return new Date(istDate.getTime() - IST_OFFSET);
    };
    const getISTEndOfDay = (d) => {
        const istDate = new Date(d.getTime() + IST_OFFSET);
        istDate.setUTCHours(23, 59, 59, 999);
        return new Date(istDate.getTime() - IST_OFFSET);
    };

    if (range && range !== 'All Time') {
        let start, end = getISTEndOfDay(new Date());
        if (range === 'Today') start = getISTStartOfDay(new Date());
        else if (range === 'Yesterday') {
            const yest = new Date(Date.now() - 86400000);
            start = getISTStartOfDay(yest);
            end = getISTEndOfDay(yest);
        }
        else if (range === 'This Week' || range === 'Week') start = new Date(getISTStartOfDay(new Date()).getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (range === 'This Month' || range === 'Month') {
            const now = new Date(Date.now() + IST_OFFSET);
            const mStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            start = new Date(mStart.getTime() - IST_OFFSET);
        }
        else if (range === 'Last Month') {
            const now = new Date(Date.now() + IST_OFFSET);
            const firstOfThis = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            const lastOfLast = new Date(firstOfThis.getTime() - 1);
            const firstOfLast = new Date(Date.UTC(lastOfLast.getUTCFullYear(), lastOfLast.getUTCMonth(), 1));
            start = new Date(firstOfLast.getTime() - IST_OFFSET);
            const lastOfLastIST = new Date(lastOfLast.getTime() + IST_OFFSET);
            lastOfLastIST.setUTCHours(23, 59, 59, 999);
            end = new Date(lastOfLastIST.getTime() - IST_OFFSET);
        }
        else if ((range === 'Custom' || range === 'Custom Date' || range === 'Date Range') && qStart) {
            const [y, m, d] = qStart.split('-').map(Number);
            start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - IST_OFFSET);
            if (qEnd) {
                const [ey, em, ed] = qEnd.split('-').map(Number);
                end = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999) - IST_OFFSET);
            } else {
                end = new Date(start.getTime() + 86400000 - 1);
            }
        }
        if (start) query.createdAt = { $gte: start, $lte: end };
    }

    if (status && status !== 'All') {
        query.paymentStatus = { $regex: new RegExp(`^${status}$`, 'i') };
    }
    if (method && method !== 'All') {
        query.paymentMethod = method;
    }

    try {
        const orders = await Order.find(query);

        const stats = {
            totalRevenue: orders
                .filter(o =>
                    (o.paymentStatus && /^paid$/i.test(o.paymentStatus)) ||
                    o.isPaid === true ||
                    o.status === 'DELIVERED'
                )
                .reduce((sum, o) => sum + Number(o.totalPrice || o.totalAmount || 0), 0),
            transactionCount: orders.length,
            failedCount: orders.filter(o =>
                (o.paymentStatus && /^failed$/i.test(o.paymentStatus)) ||
                o.status === 'CANCELLED'
            ).length,
            pendingCount: orders.filter(o =>
                ((o.paymentStatus && /^pending$/i.test(o.paymentStatus)) || !o.paymentStatus) &&
                o.isPaid !== true &&
                o.status !== 'CANCELLED' &&
                o.status !== 'DELIVERED'
            ).length
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
