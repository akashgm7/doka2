const Order = require('../models/Order');
const Store = require('../models/Store');
const User = require('../models/User');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    const { scopeLevel, role, assignedBrand, assignedFactory, assignedOutlets } = req.user;
    const { range, startDate: qStart, endDate: qEnd } = req.query;
    console.log(`[Dashboard API] Role: ${role}, Range: "${range}", qStart: "${qStart}", qEnd: "${qEnd}"`);

    // IST Date Boundary Helper (IST is UTC +5:30)
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

    let startDate = getISTStartOfDay(new Date());
    let endDate = null;

    if (range === 'Custom' && qStart) {
        // qStart is expected as YYYY-MM-DD
        const [y, m, d] = qStart.split('-').map(Number);
        const startDt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
        // This UTC date represents 00:00 UTC on that day. 
        // We want 00:00 IST on that day.
        startDate = new Date(startDt.getTime() - IST_OFFSET);

        if (qEnd) {
            const [ey, em, ed] = qEnd.split('-').map(Number);
            const endDt = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));
            endDate = new Date(endDt.getTime() - IST_OFFSET);
        } else {
            endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
        }
    } else if (range === 'Today') {
        // Already set to IST start of today
        endDate = getISTEndOfDay(new Date());
    } else if (range === 'Yesterday') {
        const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        startDate = getISTStartOfDay(yesterday);
        endDate = getISTEndOfDay(yesterday);
    } else if (range === 'This Week' || range === 'Week') {
        // Last 7 days in IST
        startDate = new Date(getISTStartOfDay(new Date()).getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = getISTEndOfDay(new Date());
    } else if (range === 'This Month' || range === 'Month') {
        const now = new Date(new Date().getTime() + IST_OFFSET);
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        startDate = new Date(monthStart.getTime() - IST_OFFSET);
        endDate = getISTEndOfDay(new Date());
    } else if (range === 'Last Month') {
        const now = new Date(Date.now() + IST_OFFSET);
        const firstOfThis = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const lastOfLast = new Date(firstOfThis.getTime() - 1);
        const firstOfLast = new Date(Date.UTC(lastOfLast.getUTCFullYear(), lastOfLast.getUTCMonth(), 1));
        startDate = new Date(firstOfLast.getTime() - IST_OFFSET);
        const lastOfLastIST = new Date(lastOfLast.getTime() + IST_OFFSET);
        lastOfLastIST.setUTCHours(23, 59, 59, 999);
        endDate = new Date(lastOfLastIST.getTime() - IST_OFFSET);
    } else if (range === 'This Year' || range === 'Year') {
        const now = new Date(Date.now() + IST_OFFSET);
        const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        startDate = new Date(yearStart.getTime() - IST_OFFSET);
        endDate = getISTEndOfDay(new Date());
    }

    console.log(`[Dashboard API] Resolved Boundaries (UTC for Query): start=${startDate.toISOString()}, end=${endDate ? endDate.toISOString() : 'OPEN'}`);

    let baseQuery = {};
    if (range !== 'All Time') {
        baseQuery.createdAt = { $gte: startDate };
        if (endDate) {
            baseQuery.createdAt.$lte = endDate;
        }
    }

    // Scope-level filtering
    if (scopeLevel === 'Brand') {
        baseQuery.brandId = assignedBrand;
    } else if (scopeLevel === 'Outlet') {
        if (assignedOutlets && assignedOutlets.length > 0) {
            // Resolve by name
            const storesByName = await Store.find({ name: { $in: assignedOutlets } }).select('_id');
            const nameBasedIds = storesByName.map(s => s._id.toString());

            // Resolve by ObjectId string
            const storesByIdStr = await Store.find({
                _id: { $in: assignedOutlets.filter(o => /^[0-9a-fA-F]{24}$/.test(o)) }
            }).select('_id name');
            const idBasedIds = storesByIdStr.map(s => s._id.toString());
            const idBasedNames = storesByIdStr.map(s => s.name);

            // Combine all possible matching values
            const allPossible = [...new Set([...assignedOutlets, ...nameBasedIds, ...idBasedIds, ...idBasedNames])];
            console.log(`[Dashboard-Base] Outlet Scope allPossible storeIds:`, allPossible);

            // Use $or: match orders with a storeId in the list, OR orders with no storeId
            const brandId = assignedBrand || 'brand-001';
            baseQuery.$or = [
                { storeId: { $in: allPossible } },
                { storeId: { $exists: false }, brandId: brandId },
                { storeId: null, brandId: brandId }
            ];
        } else {
            baseQuery._id = null; // No outlets → no orders
        }
    } else if (scopeLevel === 'Factory') {
        baseQuery.isMMC = true;
        // Optionally filter by assigned factory if multiple factories exist
        // if (assignedFactory) baseQuery.storeId = assignedFactory;
    } else if (scopeLevel === 'None') {
        baseQuery._id = null;
    }

    try {
        console.log(`[Dashboard] Executing Order.countDocuments with query:`, JSON.stringify(baseQuery));
        const totalOrders = await Order.countDocuments(baseQuery);
        console.log(`Total Orders for Query: ${totalOrders}`);

        // Revenue Aggregation
        const revenueAgg = await Order.aggregate([
            { $match: baseQuery },
            { $group: { _id: null, total: { $sum: { $ifNull: ["$totalPrice", "$totalAmount"] } } } }
        ]);
        const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

        // Recent Orders (Last 5)
        // Recent Orders (Last 5)
        const recentOrders = await Order.find(baseQuery)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({ path: 'user', model: User, select: 'name' });

        // Map for frontend compatibility
        const formattedRecentOrders = recentOrders.map(o => ({
            id: o._id,
            customer: o.user?.name || (o.customerName) || 'Guest User',
            items: (o.orderItems || o.items)?.length || 0,
            total: o.totalPrice || o.totalAmount,
            status: o.status,
            time: o.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        // Avg Order Value
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // For comparison, we use today's stats for the same scope
        const startOfToday = getISTStartOfDay(new Date());
        const endOfToday = getISTEndOfDay(new Date());
        const todayQuery = { ...baseQuery, createdAt: { $gte: startOfToday, $lte: endOfToday } };

        const todayOrders = await Order.countDocuments(todayQuery);
        const todayRevenueAgg = await Order.aggregate([
            { $match: todayQuery },
            { $group: { _id: null, total: { $sum: { $ifNull: ["$totalPrice", "$totalAmount"] } } } }
        ]);
        const todayRevenue = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].total : 0;

        // Status Counts (Matching Order model enums)
        const pendingOrders = await Order.countDocuments({ ...baseQuery, status: { $in: ['PENDING', 'Pending'] } });
        const preparingOrders = await Order.countDocuments({ ...baseQuery, status: { $in: ['CONFIRMED', 'IN_PRODUCTION', 'Preparing'] } });
        const readyOrders = await Order.countDocuments({ ...baseQuery, status: { $in: ['READY', 'Ready'] } });
        const completedOrders = await Order.countDocuments({ ...baseQuery, status: { $in: ['DELIVERED', 'Delivered'] } });

        const orderBreakdown = {
            pending: pendingOrders,
            preparing: preparingOrders,
            ready: readyOrders,
            completed: completedOrders
        };

        // Active Stores & Factories (Admin Scope)
        let activeOutlets = 0;
        let activeFactories = 0;
        let brands = [];

        if (role === 'Super Admin' || role === 'Brand Admin') {
            const storeQuery = { status: 'Open' };
            if (role === 'Brand Admin') storeQuery.brandId = assignedBrand;

            activeOutlets = await Store.countDocuments({ ...storeQuery, type: 'Outlet' });
            activeFactories = await Store.countDocuments({ ...storeQuery, type: 'Factory' });

            // Mock brands for Super Admin (in real app, fetch from Brand model)
            // Mock brands for Super Admin (in real app, fetch from Brand model)
            if (role === 'Super Admin') brands = ['brand-001'];
        }

        // Count Users (Total Staff) for current scope
        let userQuery = {};

        // Resolve store IDs if we have assigned outlet names
        let allAssignedIds = [...(assignedOutlets || [])];
        if (assignedOutlets && assignedOutlets.length > 0) {
            const assignedStores = await Store.find({ name: { $in: assignedOutlets } }).select('_id');
            const mappedIds = assignedStores.map(s => s._id.toString());
            allAssignedIds = [...allAssignedIds, ...mappedIds];
        }

        if (role === 'Super Admin') {
            userQuery = {}; // Super Admin sees all users
        } else if (role === 'Brand Admin') {
            userQuery.assignedBrand = assignedBrand;
        } else if (role === 'Area Manager') {
            // Area Managers look after Store Managers in their outlets
            userQuery.role = 'Store Manager';
            if (allAssignedIds.length > 0) {
                userQuery.assignedOutlets = { $in: allAssignedIds };
            }
        } else if (role === 'Store Manager') {
            // Store Managers look after Store Users (Staff) in their outlets
            userQuery.role = 'Customers';
            if (allAssignedIds.length > 0) {
                userQuery.assignedOutlets = { $in: allAssignedIds };
            }
        } else {
            // Safety fallback – unknown role, return 0 to avoid full DB scan
            userQuery._id = null;
        }

        console.log(`[Dashboard] Role: ${role}, AllAssignedIds: ${JSON.stringify(allAssignedIds)}, UserQuery:`, JSON.stringify(userQuery));

        const usersCount = await User.countDocuments(userQuery);

        // Charts: Orders by Type
        const ordersByTypeAgg = await Order.aggregate([
            { $match: baseQuery },
            {
                $group: {
                    _id: { $toBool: { $ifNull: ["$isMMC", false] } },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Deduplicate in JS just in case Mongo aggregation returns multiple falsey groups (rare but possible with mixed types)
        const typeMap = { 'Standard': 0, 'Custom (MMC)': 0 };
        ordersByTypeAgg.forEach(item => {
            const label = item._id ? 'Custom (MMC)' : 'Standard';
            typeMap[label] += item.count;
        });

        const ordersByType = Object.entries(typeMap)
            .filter(([_, val]) => val > 0)
            .map(([name, value]) => ({ name, value }));

        // Charts: Orders by Status
        const ordersByStatusAgg = await Order.aggregate([
            { $match: baseQuery },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        const ordersByStatus = ordersByStatusAgg.map(item => ({
            name: item._id || 'Pending',
            value: item.count
        }));

        // Charts: Revenue Trend
        // Use +05:30 timezone for UTC to IST conversion in aggregation to match local view
        const revenueTrendAgg = await Order.aggregate([
            { $match: baseQuery },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } },
                    revenue: { $sum: { $ifNull: ["$totalPrice", "$totalAmount"] } },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const getLocalDateStr = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const revenueTrend = [];
        const actualEndDate = endDate || new Date();
        const diffTime = Math.abs(actualEndDate.getTime() - startDate.getTime());
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 31) diffDays = 31;

        for (let i = 0; i <= diffDays; i++) {
            const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            if (d > actualEndDate) break;

            const istDate = new Date(d.getTime() + IST_OFFSET);
            const dateStr = istDate.toISOString().split('T')[0]; // YYYY-MM-DD in IST

            const found = revenueTrendAgg.find(item => item._id === dateStr);
            revenueTrend.push({
                name: dateStr.slice(5), // MM-DD
                revenue: found ? found.revenue : 0,
                orders: found ? found.orders : 0
            });
        }

        // Outlet/Store Performance (for Area Managers & Admins)
        let outletsPerformance = [];
        if (role === 'Area Manager' || role === 'Brand Admin' || role === 'Super Admin') {
            const performanceAgg = await Order.aggregate([
                { $match: baseQuery },
                {
                    $group: {
                        _id: "$storeId",
                        revenue: { $sum: { $ifNull: ["$totalPrice", "$totalAmount"] } },
                        orders: { $sum: 1 }
                    }
                }
            ]);

            const storeIds = performanceAgg.map(p => p._id).filter(id => id && /^[a-fA-F0-9]{24}$/.test(id.toString()));
            const stores = await Store.find({ _id: { $in: storeIds } });

            outletsPerformance = performanceAgg.map(p => {
                const store = stores.find(s => s._id.toString() === p._id?.toString());
                return {
                    name: store ? store.name : (p._id || 'Standard Outlet'),
                    status: store ? store.status : 'Open',
                    revenue: p.revenue,
                    orders: p.orders
                };
            });
        }

        // Factory Specific Metrics
        let mmcQueueOrders = [];
        let mmcQueueCount = 0;
        let calendar = [];
        if (role === 'Factory Manager' || role === 'Factory User' || role === 'Super Admin') {
            // Include all "work in progress" or "new" MMC orders
            const queueStatuses = ['PENDING', 'Pending', 'CONFIRMED', 'Confirmed', 'IN_PRODUCTION', 'Preparing', 'Ready', 'READY'];
            
            mmcQueueCount = await Order.countDocuments({
                ...baseQuery,
                isMMC: true,
                status: { $in: queueStatuses }
            });

            mmcQueueOrders = await Order.find({
                ...baseQuery,
                isMMC: true,
                status: { $in: queueStatuses }
            }).sort({ createdAt: -1 }).limit(10);

            // Individual orders for the MMC Queue list
            const rawQueueOrders = await Order.find({
                ...baseQuery,
                isMMC: true,
                status: { $in: queueStatuses }
            }).sort({ createdAt: -1 }).limit(10);

            mmcQueueOrders = rawQueueOrders.map(o => ({
                orderNumber: o.orderId || o._id.toString().slice(-6).toUpperCase(),
                details: o.orderItems?.length > 0 ? o.orderItems[0].name : 'Special Request',
                dueDate: o.createdAt ? new Date(o.createdAt.getTime() + 86400000).toLocaleDateString() : 'Today',
                status: o.status
            }));

            // Individual orders for Today's Fulfillment
            const todayStart = getISTStartOfDay(new Date());
            const todayEnd = getISTEndOfDay(new Date());
            const todayOrders = await Order.find({
                isMMC: true,
                createdAt: { $gte: todayStart, $lte: todayEnd }
            }).limit(10);

            calendar = todayOrders.map(o => ({
                time: o.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                outletName: o.storeId || 'Central Kitchen',
                itemsCount: o.orderItems?.length || 0,
                orderNumber: o.orderId || o._id.toString().slice(-6).toUpperCase()
            }));
        }

        // Delivery Health (Success Rate)
        const deliveredCount = await Order.countDocuments({ ...baseQuery, status: 'Delivered' });
        const failedCount = await Order.countDocuments({ ...baseQuery, status: 'Cancelled' });
        const meaningfulOrders = deliveredCount + failedCount;
        const successRate = meaningfulOrders > 0 ? Math.round((deliveredCount / meaningfulOrders) * 100) : 100;

        res.json({
            meta: {
                range,
                qStart,
                qEnd,
                resolvedStart: startDate.toISOString(),
                resolvedEnd: endDate ? endDate.toISOString() : 'OPEN'
            },
            revenue: totalRevenue,
            totalOrders: totalOrders,
            orders: totalOrders,
            usersCount,
            todayRevenue,
            todayOrders,
            avgOrderValue,
            orderBreakdown,
            activeOutlets,
            activeFactories,
            brands,
            ordersByType,
            ordersByStatus,
            revenueTrend,
            recentOrders: formattedRecentOrders,
            outlets: outletsPerformance,
            mmcQueue: mmcQueueOrders,
            mmcQueueCount: mmcQueueCount,
            calendar,
            slotUtilization: (role === 'Factory Manager' || role === 'Factory User') ? '75%' : undefined,
            deliveryHealth: {
                successRate: `${successRate}%`,
                failure: failedCount
            },
            integrationHealth: {
                paymentGateway: 'Connected',
                inventorySystem: 'Connected',
                notifications: 'Connected'
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getDashboardStats };
