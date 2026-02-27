const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Private (Admin/Manager)
const getLogs = async (req, res) => {
    console.log(`[AuditController] getLogs called by ${req.user.email} (${req.user.role})`);
    try {
        const { search, status, action, brandId } = req.query;
        let query = {};

        console.log('[AuditController] Filters:', { search, status, action, brandId });

        if (req.user.role === 'Brand Admin') {
            query.brandId = req.user.assignedBrand;
            query.role = { $in: ['Brand Admin', 'Area Manager', 'Store Manager', 'Store User'] };
        } else if (req.user.role === 'Area Manager') {
            query.outletId = { $in: req.user.assignedOutlets };
            query.role = { $in: ['Area Manager', 'Store Manager', 'Store User'] };
        } else if (req.user.role === 'Store Manager') {
            query.outletId = { $in: req.user.assignedOutlets };
            query.role = { $in: ['Store Manager', 'Store User'] };
        } else if (req.user.role === 'Factory Manager') {
            query.factoryId = req.user.assignedFactory;
            query.role = { $in: ['Factory Manager', 'Factory User'] };
        }

        // If super admin passed a brandId filter (or search)
        if (req.user.role === 'Super Admin') {
            if (brandId && brandId !== 'null' && brandId !== 'undefined') {
                query.brandId = brandId;
            }
        }

        // Apply filters
        if (search) {
            query.$or = [
                { user: { $regex: search, $options: 'i' } },
                { action: { $regex: search, $options: 'i' } },
                { resource: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'All') {
            query.status = status;
        }

        if (action && action !== 'All') {
            query.action = action;
        }

        console.log('[AuditController] Final Query:', JSON.stringify(query));

        const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(100);
        console.log(`[AuditController] Found ${logs.length} logs`);
        res.json(logs);
    } catch (error) {
        console.error("[AuditController] Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Internal utility to create a log
const createLog = async (logData) => {
    try {
        const log = new AuditLog(logData);
        await log.save();
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};

module.exports = { getLogs, createLog };
