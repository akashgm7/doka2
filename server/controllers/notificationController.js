const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper: resolve which DB roles map to a target value for recipient counting
const getRoleQueryForTarget = (target, senderUser) => {
    switch (target) {
        case 'All Users': return {};
        case 'Staff': return { role: { $nin: ['Customer'] } };
        case 'Customers': return { role: 'Customer' };
        case 'Brand Admins': return { role: 'Brand Admin' };
        case 'Brand Users': return { assignedBrand: senderUser.assignedBrand };
        case 'Brand Staff': return { role: { $nin: ['Customer'] }, assignedBrand: senderUser.assignedBrand };
        case 'Brand Customers': return { role: 'Customer', assignedBrand: senderUser.assignedBrand };
        case 'Area Staff': return { role: { $in: ['Area Manager', 'Store Manager', 'Store User'] }, assignedBrand: senderUser.assignedBrand };
        case 'Area Manager': return { role: 'Area Manager' };
        case 'Store Manager': return { role: 'Store Manager' };
        case 'Store Staff': return { role: { $in: ['Store Manager', 'Store User'] }, assignedOutlets: { $in: senderUser.assignedOutlets || [] } };
        case 'Factory Manager': return { role: 'Factory Manager' };
        default: return null;
    }
};

// @desc    Send bulk notification
// @route   POST /api/notifications/bulk
// @access  Private (Admin/Brand Admin)
const createBulkNotification = async (req, res) => {
    try {
        const { title, message, target } = req.body;
        const brandId = req.body.brandId || null;

        const notification = await Notification.create({
            title,
            message,
            target,
            brandId,
            sender: req.user._id,
            type: 'Manual',
            status: 'Sent'
        });

        // Count how many users this notification was sent to
        let recipientCount = 0;
        const roleQuery = getRoleQueryForTarget(target, req.user);
        if (roleQuery !== null) {
            recipientCount = await User.countDocuments(roleQuery);
        }

        res.status(201).json({ ...notification.toObject(), recipientCount });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get notification history
// @route   GET /api/notifications/history
// @access  Private (scoped by role)
const getNotificationHistory = async (req, res) => {
    try {
        const { role, _id: userId, assignedBrand } = req.user;
        let query = { type: 'Manual' };

        if (role === 'Super Admin') {
            // Super Admin sees everything
        } else if (role === 'Brand Admin') {
            // Brand Admin only sees notifications for their brand
            query.brandId = assignedBrand;
        } else if (role === 'Area Manager') {
            // Area Manager sees notifications sent to Area Manager or Area Staff targets
            // AND only from their own brand scope
            query.$and = [
                { target: { $in: ['Area Manager', 'Area Staff', 'Staff'] } },
                { $or: [{ brandId: assignedBrand }, { brandId: null }] }
            ];
        } else if (role === 'Store Manager') {
            // Store Manager sees notifications targeted at their role or their staff
            query.$and = [
                { target: { $in: ['Store Manager', 'Store Staff', 'Staff'] } },
                { $or: [{ brandId: assignedBrand }, { brandId: null }] },
                {
                    $or: [
                        { storeId: null },
                        { storeId: { $in: req.user.assignedOutlets || [] } }
                    ]
                }
            ];
        } else if (role === 'Factory Manager') {
            query.$and = [
                { target: { $in: ['Factory Manager', 'Staff'] } },
                { $or: [{ brandId: assignedBrand }, { brandId: null }] }
            ];
        } else {
            // No other roles have access to history
            return res.status(403).json({ message: 'Not authorized to view notification history' });
        }

        const history = await Notification.find(query)
            .sort({ sentAt: -1 })
            .populate('sender', 'name email');

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my notifications feed
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = async (req, res) => {
    try {
        const { role, assignedBrand } = req.user;

        // Determine which target groups this role belongs to.
        // 'All Users' is ONLY for notifications that truly target everyone (staff + customers).
        // Customer role uses the /public endpoint for their feed — NOT this one.
        let targetGroups = ['All Users'];

        if (role === 'Super Admin') {
            targetGroups.push('Staff', 'Brand Admins');
        } else if (role === 'Brand Admin') {
            targetGroups.push('Staff', 'Brand Admins', 'Brand Users', 'Brand Staff');
        } else if (role === 'Area Manager') {
            targetGroups.push('Staff', 'Area Staff', 'Area Manager');
        } else if (role === 'Store Manager') {
            targetGroups.push('Staff', 'Store Staff', 'Area Staff', 'Store Manager');
        } else if (role === 'Factory Manager') {
            targetGroups.push('Staff', 'Factory Manager');
        } else if (role === 'Customer') {
            // Customers should use the /public endpoint.
            // If they somehow hit this endpoint while authenticated,
            // only show notifications targeted to them.
            targetGroups = ['All Users', 'Customers'];
        } else {
            // Store User, other internal roles
            targetGroups.push('Staff');
        }

        let query = {
            target: { $in: targetGroups }
        };

        // Brand-scoped users see brand-specific OR general (brandId: null) notifications
        if (assignedBrand) {
            query.$or = [
                { brandId: assignedBrand },
                { brandId: null }
            ];
        }

        // Store Managers only see notifications that are store-agnostic OR meant for their specific stores
        if (role === 'Store Manager') {
            query.$and = [
                {
                    $or: [
                        { storeId: null },
                        { storeId: { $in: req.user.assignedOutlets || [] } }
                    ]
                }
            ];
        }

        const notifications = await Notification.find(query)
            .sort({ sentAt: -1 })
            .limit(50);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get public notifications for the user-facing CAKE app (no auth)
// @route   GET /api/notifications/public
// @access  Public
const getPublicNotifications = async (req, res) => {
    try {
        // Returns notifications explicitly targeted at customers or all users.
        // Staff-only targets ('Staff', 'Brand Admins', 'Area Manager', etc.) are excluded.
        const notifications = await Notification.find({
            target: { $in: ['All Users', 'Customers'] },
            status: 'Sent'
        })
            .sort({ sentAt: -1 })
            .limit(50)
            .lean();

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBulkNotification,
    getNotificationHistory,
    getMyNotifications,
    getPublicNotifications
};
