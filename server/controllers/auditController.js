const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit
// @access  Private (Admin/Manager)
const getLogs = async (req, res) => {
    console.log(`[AuditController] getLogs called by ${req.user.email} (${req.user.role})`);
    try {
        const { search, status, action, brandId, startDate, endDate, range } = req.query;
        let query = {};

        console.log('[AuditController] Filters:', { search, status, action, brandId, startDate, endDate, range });

        // Dynamic scope-level filtering for audit logs
        if (req.user.scopeLevel === 'Brand') {
            query.brandId = req.user.assignedBrand;
            // Removed role exclusion so Brand Admins can see Super Admin actions on their brand resources
        } else if (req.user.scopeLevel === 'Outlet') {
            query.outletId = { $in: req.user.assignedOutlets };
            // Outlet level scopes see outlet employees and customers
            query.role = { $nin: ['Super Admin', 'Brand Admin'] };
        } else if (req.user.scopeLevel === 'Factory') {
            query.factoryId = req.user.assignedFactory;
            // Factory level scopes see factory employees
            query.role = { $nin: ['Super Admin', 'Brand Admin', 'Area Manager'] };
        } else if (req.user.scopeLevel === 'None') {
            query._id = null; // Prevent access
        }

        // System level scopes (like Super Admin) can filter freely
        if (req.user.scopeLevel === 'System') {
            if (brandId && brandId !== 'null' && brandId !== 'undefined') {
                query.brandId = brandId;
            }
        }

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

        // Date Range Logic
        if ((range === 'Custom' || range === 'Custom Date' || range === 'Date Range') && (startDate || endDate)) {
            query.timestamp = {};
            if (startDate) {
                const [y, m, d] = startDate.split('-').map(Number);
                const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - IST_OFFSET);
                query.timestamp.$gte = start;
            }
            if (endDate) {
                const [ey, em, ed] = endDate.split('-').map(Number);
                const end = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999) - IST_OFFSET);
                query.timestamp.$lte = end;
            }
        } else if (range && range !== 'All Time') {
            let start, end = getISTEndOfDay(new Date());

            if (range === 'Today') {
                start = getISTStartOfDay(new Date());
            } else if (range === 'Yesterday') {
                const yest = new Date(Date.now() - 86400000);
                start = getISTStartOfDay(yest);
                end = getISTEndOfDay(yest);
            } else if (range === 'This Week') {
                start = new Date(getISTStartOfDay(new Date()).getTime() - 7 * 24 * 60 * 60 * 1000);
            } else if (range === 'This Month') {
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
            }

            if (start) {
                query.timestamp = { $gte: start, $lte: end };
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
            query.action = { $regex: action, $options: 'i' };
        }

        console.log('[AuditController] Final Query:', JSON.stringify(query));

        const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(200);
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
