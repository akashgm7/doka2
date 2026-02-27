const Order = require('../models/Order');
const Store = require('../models/Store');
const User = require('../models/User');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    const { role, assignedBrand, assignedFactory, assignedOutlets } = req.user;
    const { range } = req.query;
    console.log(`[Dashboard API] Role: ${role}, Brand: ${assignedBrand}, Range: "${range}"`);

    // Date Filtering Logic
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    let endDate = null;

    if (range === 'Today') {
        // Keeps startDate at 00:00:00 today, endDate open
    } else if (range === 'Yesterday') {
        startDate.setDate(startDate.getDate() - 1);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
    } else if (range === 'This Week' || range === 'Week') {
        startDate.setDate(startDate.getDate() - 7);
    } else if (range === 'This Month' || range === 'Month') {
        startDate.setDate(1);
    } else if (range === 'Last Month') {
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
    } else if (range === 'This Year' || range === 'Year') {
        startDate.setMonth(0, 1);
    }

    let baseQuery = {};
    if (range !== 'All Time') {
        baseQuery.createdAt = { $gte: startDate };
        if (endDate) {
            baseQuery.createdAt.$lte = endDate;
        }
    }

    // Role Scope
    if (role === 'Brand Admin') {
        baseQuery.brandId = assignedBrand;
    } else if (role === 'Store User' || role === 'Store Manager' || role === 'Area Manager') {
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
            console.log(`[Dashboard-Base] ${role} allPossible storeIds:`, allPossible);

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

        // Today's Stats for Comparison
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayQuery = { ...baseQuery, createdAt: { $gte: startOfToday } };

        const todayOrders = await Order.countDocuments(todayQuery);
        const todayRevenueAgg = await Order.aggregate([
            { $match: todayQuery },
            { $group: { _id: null, total: { $sum: { $ifNull: ["$totalPrice", "$totalAmount"] } } } }
        ]);
        const todayRevenue = todayRevenueAgg.length > 0 ? todayRevenueAgg[0].total : 0;

        // Status Counts
        const pendingOrders = await Order.countDocuments({ ...baseQuery, status: 'Pending' });
        const preparingOrders = await Order.countDocuments({ ...baseQuery, status: 'Preparing' });
        const readyOrders = await Order.countDocuments({ ...baseQuery, status: 'Ready' });
        const completedOrders = await Order.countDocuments({ ...baseQuery, status: 'Delivered' });

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
            userQuery.role = 'Store User';
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

        // Charts: Revenue Trend (Last 7 Days including today)
        // Use +05:30 timezone for UTC to IST conversion in aggregation to match local view
        const revenueTrendAgg = await Order.aggregate([
            { $match: { ...baseQuery, createdAt: { $gte: new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000) } } },
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
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfToday.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
            const dateStr = getLocalDateStr(d);
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
        let mmcQueue = 0;
        let calendar = [];
        if (role === 'Factory Manager' || role === 'Factory User' || role === 'Super Admin') {
            mmcQueue = await Order.countDocuments({
                ...baseQuery,
                isMMC: true,
                status: { $in: ['Pending', 'Preparing'] }
            });

            // Next 7 days production planning
            for (let i = 0; i < 7; i++) {
                const date = new Date(startOfToday);
                date.setDate(date.getDate() + i);
                const dateStr = date.toISOString().split('T')[0];
                const count = await Order.countDocuments({
                    ...baseQuery,
                    isMMC: true,
                    createdAt: { $gte: date, $lt: new Date(date.getTime() + 86400000) }
                });
                calendar.push({
                    date: dateStr.slice(5),
                    orders: count,
                    status: count > 5 ? 'Full' : 'Available'
                });
            }
        }

        // Delivery Health (Success Rate)
        const deliveredCount = await Order.countDocuments({ ...baseQuery, status: 'Delivered' });
        const failedCount = await Order.countDocuments({ ...baseQuery, status: 'Cancelled' });
        const meaningfulOrders = deliveredCount + failedCount;
        const successRate = meaningfulOrders > 0 ? Math.round((deliveredCount / meaningfulOrders) * 100) : 100;

        res.json({
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
            mmcQueue,
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
