const Order = require('../models/Order');
const Store = require('../models/Store');
const User = require('../models/User');

// @desc    Get all orders (with filtering)
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    const { role, assignedBrand, assignedOutlets } = req.user;
    const { status, locationId, dateRange } = req.query;

    let query = {};

    // Role-based filtering
    if (role === 'Brand Admin') {
        // Match by brandId OR orders with no storeId under this brand
        query.$or = [
            { brandId: assignedBrand },
            { brandId: { $exists: false }, storeId: { $exists: false } }
        ];
    } else if (role === 'Store User' || role === 'Store Manager' || role === 'Area Manager') {
        if (assignedOutlets && assignedOutlets.length > 0) {
            // Find stores by name (in case assignedOutlets stores names)
            const storesByName = await Store.find({ name: { $in: assignedOutlets } }).select('_id');
            const nameBasedIds = storesByName.map(s => s._id.toString());

            // Find stores by ID string (in case assignedOutlets stores ObjectId strings)
            const storesByIdStr = await Store.find({
                _id: { $in: assignedOutlets.filter(o => /^[0-9a-fA-F]{24}$/.test(o)) }
            }).select('_id name');
            const idBasedIds = storesByIdStr.map(s => s._id.toString());
            const idBasedNames = storesByIdStr.map(s => s.name);

            // Combine all possible matching values
            const allPossible = [...new Set([...assignedOutlets, ...nameBasedIds, ...idBasedIds, ...idBasedNames])];

            console.log(`[Orders] ${role} - assignedOutlets: ${JSON.stringify(assignedOutlets)}, allPossible: ${JSON.stringify(allPossible)}`);

            // Use $or: match orders with a storeId in the list, OR orders with no storeId
            // (orders placed via the customer app often don't have a storeId)
            const brandId = assignedBrand || 'brand-001';
            query.$or = [
                { storeId: { $in: allPossible } },
                { storeId: { $exists: false }, brandId: brandId },
                { storeId: null, brandId: brandId }
            ];
        } else {
            // No outlets assigned - return nothing
            query._id = null;
            console.log(`[Orders] ${role} has no assignedOutlets - returning empty`);
        }
    } else if (role === 'Factory Manager' || role === 'Factory User') {
        query.isMMC = true;
        if (req.user.assignedFactory) {
            query.storeId = req.user.assignedFactory;
        }
    } else if (role === 'Super Admin') {
        // Super Admin sees everything
    }

    // Query Params — applied after role filter
    if (status) query.status = status;
    // NOTE: locationId filter is intentionally not applied here because customer orders
    // do not carry a storeId field. When the customer checkout adds store selection,
    // this can be re-enabled: if (locationId) { delete query.$or; query.storeId = locationId; }

    // Date range filter
    if (dateRange && dateRange !== 'All Time') {
        const now = new Date();
        let startDate;
        if (dateRange === 'Today') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (dateRange === 'Yesterday') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            query.createdAt = { $gte: startDate, $lt: endDate };
            startDate = null; // handled above
        } else if (dateRange === 'This Week') {
            const day = now.getDay();
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
        } else if (dateRange === 'This Month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (dateRange === 'Last Month') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
            query.createdAt = { $gte: startDate, $lt: endDate };
            startDate = null;
        } else if (dateRange === 'This Year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        }
        if (startDate) {
            query.createdAt = { $gte: startDate };
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
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
    const { status, internalNotes } = req.body;

    try {
        let order;
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            order = await Order.findById(req.params.id);
        }

        if (!order) {
            order = await Order.findOne({ orderId: req.params.id });
        }

        if (order) {
            if (status) order.status = status;
            if (internalNotes) order.internalNotes = internalNotes;

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getOrders, getOrderById, updateOrderStatus };
