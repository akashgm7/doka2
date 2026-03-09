const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper: resolve which DB roles map to a target value for recipient counting
const getRoleQueryForTargets = (targets, senderUser) => {
    if (!Array.isArray(targets) || targets.length === 0) return null;

    const queries = targets.map(target => {
        switch (target) {
            case 'All Users': return {};
            case 'Staff': return { role: { $nin: ['Customer'] } };
            case 'Customers': return { role: 'Customer' };
            case 'Brand Admins': return { role: 'Brand Admin' };
            case 'Brand Users': return { assignedBrand: senderUser.assignedBrand };
            case 'Brand Staff': return { role: { $nin: ['Customer'] }, assignedBrand: senderUser.assignedBrand };
            case 'Brand Customers': return { role: 'Customer', assignedBrand: senderUser.assignedBrand };
            case 'Area Staff': return { role: { $in: ['Area Manager', 'Store Manager', 'Customers'] }, assignedBrand: senderUser.assignedBrand };
            case 'Area Manager': return { role: 'Area Manager' };
            case 'Store Manager': return { role: 'Store Manager' };
            case 'Store Staff': return { role: { $in: ['Store Manager', 'Customers'] }, assignedOutlets: { $in: senderUser.assignedOutlets || [] } };
            case 'Factory Manager': return { role: 'Factory Manager' };
            default: return null;
        }
    }).filter(q => q !== null);

    if (queries.length === 0) return null;
    if (queries.length === 1) return queries[0];
    return { $or: queries };
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
        const roleQuery = getRoleQueryForTargets(target, req.user);
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
        const { scopeLevel, role, _id: userId, assignedBrand } = req.user;
        let query = { type: 'Manual' };

        if (scopeLevel === 'System') {
            // System sees everything
        } else if (scopeLevel === 'Brand') {
            // Brand level only sees notifications for their brand
            query.brandId = assignedBrand;
        } else if (scopeLevel === 'Outlet') {
            // Outlet staff sees notifications sent to their role or staff globally
            query.$and = [
                { target: { $in: [role, 'Area Manager', 'Store Manager', 'Area Staff', 'Store Staff', 'Staff'] } },
                { $or: [{ brandId: assignedBrand }, { brandId: null }] },
                {
                    $or: [
                        { storeId: null },
                        { storeId: { $in: req.user.assignedOutlets || [] } }
                    ]
                }
            ];
        } else if (scopeLevel === 'Factory') {
            query.$and = [
                { target: { $in: [role, 'Factory Manager', 'Staff'] } },
                { $or: [{ brandId: assignedBrand }, { brandId: null }] }
            ];
        } else {
            // No other scopes have access to history
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
        const { scopeLevel, role, assignedBrand } = req.user;

        // Determine which target groups this scope belongs to.
        let targetGroups = ['All Users'];

        if (scopeLevel === 'System') {
            targetGroups.push('Staff', 'Brand Admins');
        } else if (scopeLevel === 'Brand') {
            targetGroups.push('Staff', 'Brand Admins', 'Brand Users', 'Brand Staff', role);
        } else if (scopeLevel === 'Outlet') {
            targetGroups.push('Staff', 'Store Staff', 'Area Staff', 'Store Manager', 'Area Manager', role);
        } else if (scopeLevel === 'Factory') {
            targetGroups.push('Staff', 'Factory Manager', role);
        } else if (role === 'Customer') {
            // Customers should use the /public endpoint.
            targetGroups = ['All Users', 'Customers'];
        } else {
            targetGroups.push('Staff', role);
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

        // Outlet scope only sees notifications that are store-agnostic OR meant for their specific stores
        if (scopeLevel === 'Outlet') {
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
