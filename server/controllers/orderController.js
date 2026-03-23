const Order = require('../models/Order');
const Store = require('../models/Store');
const User = require('../models/User');

// @desc    Get all orders (with filtering)
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    const { scopeLevel, assignedBrand, assignedOutlets } = req.user;
    const { status, locationId, dateRange, type, dietary, paymentMethod, startDate: qStart, endDate: qEnd } = req.query;

    let query = {};

    // IST Helper
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

    // Scope-level filtering
    if (scopeLevel === 'Brand') {
        query.brandId = assignedBrand;
    } else if (scopeLevel === 'Outlet') {
        if (assignedOutlets && assignedOutlets.length > 0) {
            // Find stores by ID string and name for broad matching
            const brandId = assignedBrand || 'brand-001';
            query.$or = [
                { storeId: { $in: assignedOutlets } },
                { storeId: { $exists: false }, brandId: brandId },
                { storeId: null, brandId: brandId }
            ];
        } else {
            query._id = null;
        }
    } else if (scopeLevel === 'Factory') {
        query.isMMC = true;
        if (req.user.assignedFactory) query.storeId = req.user.assignedFactory;
    } else if (scopeLevel === 'None') {
        query._id = null;
    }

    // Query Params
    if (status && status !== 'All') query.status = status;
    if (type === 'MMC') query.isMMC = true;
    else if (type === 'Standard') query.isMMC = { $ne: true };

    if (dietary && dietary !== 'All') {
        query['orderItems.dietary'] = dietary;
    }

    if (paymentMethod && paymentMethod !== 'All') {
        query.paymentMethod = paymentMethod;
    }

    // Date range filter
    if (dateRange && dateRange !== 'All Time') {
        let start, end = getISTEndOfDay(new Date());

        if (dateRange === 'Today') {
            start = getISTStartOfDay(new Date());
        } else if (dateRange === 'Yesterday') {
            const yesterday = new Date(Date.now() - 86400000);
            start = getISTStartOfDay(yesterday);
            end = getISTEndOfDay(yesterday);
        } else if (dateRange === 'This Week') {
            start = new Date(getISTStartOfDay(new Date()).getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateRange === 'This Month') {
            const now = new Date(Date.now() + IST_OFFSET);
            const mStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            start = new Date(mStart.getTime() - IST_OFFSET);
        } else if (dateRange === 'Last Month') {
            const now = new Date(Date.now() + IST_OFFSET);
            const firstOfThis = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
            const lastOfLast = new Date(firstOfThis.getTime() - 1);
            const firstOfLast = new Date(Date.UTC(lastOfLast.getUTCFullYear(), lastOfLast.getUTCMonth(), 1));
            start = new Date(firstOfLast.getTime() - IST_OFFSET);
            const lastOfLastIST = new Date(lastOfLast.getTime() + IST_OFFSET);
            lastOfLastIST.setUTCHours(23, 59, 59, 999);
            end = new Date(lastOfLastIST.getTime() - IST_OFFSET);
        } else if (dateRange === 'Custom' || dateRange === 'Custom Date' || dateRange === 'Date Range') {
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

    try {
        const orders = await Order.find(query)
            .populate({ path: 'user', model: User, select: 'name email mobile' })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        // Try finding by MongoDB _id first, then by legacy orderId
        let order;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findById(req.params.id);
        }

        if (!order) {
            order = await Order.findOne({ orderId: req.params.id });
        }

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
    const { status, internalNotes } = req.body;
    // Instead of checking specific roles, check if scope Level allows status updates
    // Assume None implies absolutely no permission. Actual permission check is in authMiddleware
    if (req.user.scopeLevel === 'None') {
        return res.status(403).json({ message: 'Not authorized to update order status' });
    }

    try {
        let order;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findById(req.params.id).populate('user');
        }

        if (!order) {
            order = await Order.findOne({ orderId: req.params.id }).populate('user');
        }

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (status) {
            console.log('--- BACKEND STATUS UPDATE DEBUG ---');
            console.log('Request Params ID:', req.params.id);
            console.log('Requested Status:', status);
            console.log('Current Order Status in DB:', order.status);

            const currentStatus = order.status?.toUpperCase() || 'PENDING';
            const requestedStatus = status.toUpperCase();

            console.log('Normalized Current:', currentStatus);
            console.log('Normalized Requested:', requestedStatus);

            const validTransitions = {
                'PENDING': ['CONFIRMED', 'CANCELLED'],
                'CONFIRMED': ['IN_PRODUCTION', 'CANCELLED'],
                'IN_PRODUCTION': ['READY', 'CANCELLED'],
                'READY': ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
                'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED']
            };

            // If a transition is requested, validate it
            if (currentStatus !== requestedStatus) {
                const allowed = validTransitions[currentStatus] || [];
                if (!allowed.includes(requestedStatus)) {
                    console.error(`[TRANSITION ERROR] ${currentStatus} -> ${requestedStatus} NOT ALLOWED for order ${order._id}`);
                    return res.status(400).json({
                        message: `Invalid status transition: ${order.status} -> ${status}`
                    });
                }
                
                console.log(`[TRANSITION SUCCESS] Updating status: ${order.status} -> ${requestedStatus}`);
                order.status = requestedStatus;

                // Sync legacy delivered flag if needed
                if (requestedStatus === 'DELIVERED') {
                    order.isDelivered = true;
                }
            } else {
                console.log(`[STATUS UNCHANGED] Order ${order._id} is already ${requestedStatus}`);
            }
        }

        if (internalNotes) order.internalNotes = internalNotes;

        const updatedOrder = await order.save();

        // Emit Socket.IO event for real-time synchronization
        const io = req.app.get('io');
        if (io) {
            console.log(`[Socket] Emitting orderStatusUpdated: ${order._id}, ${status}`);
            io.emit('orderStatusUpdated', {
                orderId: order._id,
                status: order.status,
                orderNumber: order.orderId
            });
        }

        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Submit feedback for a delivered order
// @route   POST /api/orders/:id/feedback
// @access  Private (order owner only)
const submitFeedback = async (req, res) => {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    try {
        let order;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findById(req.params.id);
        }
        if (!order) {
            order = await Order.findOne({ orderId: req.params.id });
        }
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify order belongs to the requesting user
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to submit feedback for this order' });
        }

        const currentStatus = (order.status || '').toUpperCase();
        if (currentStatus !== 'DELIVERED' && currentStatus !== 'COMPLETED' && !order.isDelivered) {
            return res.status(400).json({ message: 'Feedback can only be submitted for delivered orders' });
        }

        if (order.feedback && order.feedback.rating) {
            return res.status(400).json({ message: 'Feedback already submitted for this order' });
        }

        order.feedback = {
            rating: Number(rating),
            comment: comment || '',
            submittedAt: new Date()
        };

        const updatedOrder = await order.save();

        // Emit real-time socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('feedbackAdded', {
                orderId: order._id,
                storeId: order.storeId,
                brandId: order.brandId,
                feedback: order.feedback,
                customerName: req.user.name || 'Customer',
                orderRef: order.orderId || order._id
            });
            console.log(`[Socket] Emitted feedbackAdded for order: ${order._id}`);
        }

        res.json(updatedOrder);
    } catch (error) {
        console.error('[Feedback] Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getOrders, getOrderById, updateOrderStatus, submitFeedback };
