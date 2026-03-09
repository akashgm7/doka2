const Order = require('../models/Order');

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

// Helper to get date query based on range string
const getDateQuery = (range, qStart, qEnd) => {
    let startDate = getISTStartOfDay(new Date());
    let endDate = getISTEndOfDay(new Date());

    if ((range === 'Custom' || range === 'Custom Date' || range === 'Date Range') && qStart) {
        const [y, m, d] = qStart.split('-').map(Number);
        const startDt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
        startDate = new Date(startDt.getTime() - IST_OFFSET);

        if (qEnd) {
            const [ey, em, ed] = qEnd.split('-').map(Number);
            const endDt = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));
            endDate = new Date(endDt.getTime() - IST_OFFSET);
        } else {
            endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);
        }
    } else if (range === 'Today') {
        // Default is Today
    } else if (range === 'Yesterday') {
        const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        startDate = getISTStartOfDay(yesterday);
        endDate = getISTEndOfDay(yesterday);
    } else if (range === 'This Week' || range === 'Week') {
        startDate = new Date(getISTStartOfDay(new Date()).getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = getISTEndOfDay(new Date());
    } else if (range === 'This Month' || range === 'Month') {
        const now = new Date(new Date().getTime() + IST_OFFSET);
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        startDate = new Date(monthStart.getTime() - IST_OFFSET);
        endDate = getISTEndOfDay(new Date());
    } else if (range === 'Last Month') {
        const now = new Date(new Date().getTime() + IST_OFFSET);
        const firstOfThisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const firstOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
        startDate = new Date(firstOfLastMonth.getTime() - IST_OFFSET);
        endDate = new Date(firstOfThisMonth.getTime() - IST_OFFSET - 1);
    } else if (range === 'This Year' || range === 'Year') {
        const now = new Date(new Date().getTime() + IST_OFFSET);
        const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
        startDate = new Date(yearStart.getTime() - IST_OFFSET);
        endDate = getISTEndOfDay(new Date());
    } else if (range === 'All Time') {
        return {};
    }

    return { createdAt: { $gte: startDate, $lte: endDate } };
};

// @desc    Get analytics data for Reports page
// @route   GET /api/reports/analytics
// @access  Private
const getAnalytics = async (req, res) => {
    const { scopeLevel, assignedBrand, assignedOutlets } = req.user;
    const { dateRange, startDate: qStart, endDate: qEnd } = req.query;

    let dateQuery = getDateQuery(dateRange || 'This Month', qStart, qEnd);
    let matchQuery = { ...dateQuery };

    // Scope-level driven filtering
    if (scopeLevel === 'Brand') {
        const brandId = req.query.brandId || assignedBrand;
        if (brandId) matchQuery.brandId = brandId;
    } else if (scopeLevel === 'Outlet') {
        const storeIdArr = req.query.assignedOutlets || assignedOutlets;
        if (storeIdArr && storeIdArr.length > 0) {
            matchQuery.storeId = { $in: storeIdArr };
        } else {
            // Nullify results if no outlets assigned but restricted to Outlet scope
            matchQuery._id = null;
        }
    } else if (scopeLevel === 'None') {
        matchQuery._id = null;
    }

    try {
        // 1. Overview Metrics (Total Revenue, Total Orders, Avg Order Value)
        // Only count revenue for paid/completed orders
        const revenueMatch = {
            ...matchQuery,
            $or: [
                { paymentStatus: 'Paid' },
                { isPaid: true },
                { status: 'Delivered' }
            ]
        };

        const overviewAgg = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ["$paymentStatus", "Paid"] },
                                        { $eq: ["$isPaid", true] },
                                        { $eq: ["$status", "Delivered"] }
                                    ]
                                },
                                { $ifNull: ["$totalPrice", "$totalAmount"] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const overview = overviewAgg[0] || { totalOrders: 0, totalRevenue: 0 };
        const avgOrderValue = overview.totalOrders > 0 ? Number((overview.totalRevenue / overview.totalOrders).toFixed(2)) : 0;

        // 2. Revenue Trend (Daily, IST-aware)
        const revenueTrendAgg = await Order.aggregate([
            { $match: revenueMatch },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" } },
                    revenue: { $sum: { $ifNull: ["$totalPrice", "$totalAmount"] } }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Filling in dates for the chart
        const start = dateQuery.createdAt?.$gte || new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
        const end = dateQuery.createdAt?.$lte || new Date();
        const trendMap = {};
        revenueTrendAgg.forEach(item => { trendMap[item._id] = item.revenue; });

        const revenueTrend = [];
        let curr = new Date(start);
        while (curr <= end) {
            const istDate = new Date(curr.getTime() + IST_OFFSET);
            const dateStr = istDate.toISOString().split('T')[0];
            revenueTrend.push({
                name: dateStr,
                revenue: trendMap[dateStr] || 0
            });
            curr.setDate(curr.getDate() + 1);
        }

        // 3. Payment Methods
        const paymentMethodsAgg = await Order.aggregate([
            { $match: matchQuery },
            { $group: { _id: { $ifNull: ["$paymentMethod", "Razorpay"] }, count: { $sum: 1 } } }
        ]);

        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1'];
        const paymentMethods = paymentMethodsAgg.map((item, index) => ({
            name: item._id,
            value: Number(((item.count / (overview.totalOrders || 1)) * 100).toFixed(0)),
            color: colors[index % colors.length]
        }));

        // 4. Popular Items
        const popularItemsAgg = await Order.aggregate([
            { $match: matchQuery },
            { $unwind: "$orderItems" },
            {
                $group: {
                    _id: "$orderItems.name",
                    orders: { $sum: { $ifNull: ["$orderItems.qty", 1] } }
                }
            },
            { $sort: { orders: -1 } },
            { $limit: 5 }
        ]);

        const popularItems = popularItemsAgg.map(item => ({
            name: item._id,
            orders: item.orders
        }));

        res.json({
            overview: {
                totalRevenue: overview.totalRevenue,
                totalOrders: overview.totalOrders,
                avgOrderValue,
                growth: 0
            },
            revenueTrend,
            popularItems,
            paymentMethods
        });
    } catch (error) {
        console.error('getAnalytics error', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download CSV Report
// @route   GET /api/reports/download?type=Sales&dateRange=This Month
// @access  Private
const downloadReport = async (req, res) => {
    const { scopeLevel, assignedBrand, assignedOutlets, assignedFactory } = req.user;
    const { type, dateRange, startDate: qStart, endDate: qEnd } = req.query;

    let matchQuery = getDateQuery(dateRange || 'This Month', qStart, qEnd);

    // Scope-level driven filtering
    if (scopeLevel === 'Brand') {
        matchQuery.brandId = assignedBrand;
    } else if (scopeLevel === 'Outlet') {
        if (assignedOutlets && assignedOutlets.length > 0) {
            matchQuery.storeId = { $in: assignedOutlets };
        } else {
            matchQuery._id = null;
        }
        matchQuery.isMMC = true;
    } else if (scopeLevel === 'Factory') {
        matchQuery.factoryId = assignedFactory;
    } else if (scopeLevel === 'None') {
        matchQuery._id = null;
    }

    try {
        const orders = await Order.find(matchQuery).populate('user', 'name email');

        let csvContent = '';

        if (type === 'Sales' || type === 'Summary') {
            csvContent += 'Date,Order ID,Customer,Amount,Status\n';
            orders.forEach(o => {
                const istDate = new Date(o.createdAt.getTime() + IST_OFFSET);
                const dateSplit = istDate.toISOString().split('T')[0];
                const orderId = o.orderId || o._id.toString();
                const cust = o.user?.name || o.customerName || 'Guest';
                const amt = Number(o.totalPrice || o.totalAmount || 0);
                const status = o.status;
                csvContent += `${dateSplit},${orderId},${cust},${amt},${status}\n`;
            });
        } else if (type === 'Inventory' || type === 'Product Analysis') {
            const itemMap = {};
            orders.forEach(o => {
                const items = o.orderItems || [];
                items.forEach(item => {
                    if (!itemMap[item.name]) {
                        itemMap[item.name] = { qty: 0, revenue: 0 };
                    }
                    itemMap[item.name].qty += Number(item.qty || 1);
                    itemMap[item.name].revenue += Number(item.price || 0) * Number(item.qty || 1);
                });
            });
            csvContent += 'Product Name,Category,Quantity Sold,Revenue\n';
            for (const [name, data] of Object.entries(itemMap)) {
                // Category is mostly unknown at this level without populating product, using NA
                csvContent += `${name},N/A,${data.qty},${data.revenue}\n`;
            }
        } else {
            // Audit - mock for now, actual audit would require an audit log table
            csvContent += 'Timestamp,User,Action,Details\n';
            csvContent += `${new Date().toISOString()},${req.user.email},Generate Audit Report,Downloaded audit logs\n`;
        }

        res.header('Content-Type', 'text/csv');
        res.attachment(`${type}_Report_${dateRange || 'All'}.csv`);
        res.send(csvContent);
    } catch (error) {
        console.error('downloadReport error', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAnalytics,
    downloadReport
};
