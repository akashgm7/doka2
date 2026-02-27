const Order = require('../models/Order');

// Helper to get date query based on range string
const getDateQuery = (dateRange) => {
    const now = new Date();
    const query = {};
    if (dateRange === 'Today') {
        const start = new Date(now.setHours(0, 0, 0, 0));
        query.createdAt = { $gte: start };
    } else if (dateRange === 'Yesterday') {
        const start = new Date(now);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        query.createdAt = { $gte: start, $lte: end };
    } else if (dateRange === 'This Week') {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        query.createdAt = { $gte: start };
    } else if (dateRange === 'This Month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        query.createdAt = { $gte: start };
    } else if (dateRange === 'This Year') {
        const start = new Date(now.getFullYear(), 0, 1);
        query.createdAt = { $gte: start };
    }
    return query;
};

// @desc    Get analytics data for Reports page
// @route   GET /api/reports/analytics
// @access  Private
const getAnalytics = async (req, res) => {
    const { role, assignedBrand, assignedOutlets, assignedFactory } = req.user;
    const { dateRange } = req.query;

    let matchQuery = getDateQuery(dateRange || 'This Month');

    // Role-based scoping
    if (role === 'Brand Admin') {
        matchQuery.brandId = assignedBrand;
    } else if (role === 'Area Manager' || role === 'Store Manager') {
        if (assignedOutlets && assignedOutlets.length > 0) {
            matchQuery.storeId = { $in: assignedOutlets };
        } else {
            matchQuery._id = null;
        }
        matchQuery.isMMC = true;
    } else if (role !== 'Super Admin') {
        // Fallback for unauthorized roles, though middleware should catch
        matchQuery._id = null;
    }

    try {
        const orders = await Order.find(matchQuery);

        // Calculate Overview
        let totalRevenue = 0;
        let totalOrders = orders.length;

        const paymentMethodsMap = {};
        const popularItemsMap = {};

        // Let's populate revenue trend based on days of the week for simplicity right now
        // In a real app we'd group by day of month, but let's emulate the mock format initially
        const revenueTrendMap = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (const order of orders) {
            const amount = Number(order.totalPrice || order.totalAmount || 0);

            // Only count revenue for paid/completed orders
            if (order.paymentStatus === 'Paid' || order.isPaid || order.status === 'Delivered') {
                totalRevenue += amount;
            }

            // Payment Methods
            const method = order.paymentMethod || 'Razorpay';
            paymentMethodsMap[method] = (paymentMethodsMap[method] || 0) + 1;

            // Popular Items
            if (order.orderItems && order.orderItems.length > 0) {
                for (const item of order.orderItems) {
                    const itemName = item.name;
                    const qty = Number(item.qty || 1);
                    popularItemsMap[itemName] = (popularItemsMap[itemName] || 0) + qty;
                }
            }

            // Trend
            const orderDate = new Date(order.createdAt);
            const dayName = days[orderDate.getDay()];
            revenueTrendMap[dayName] += amount;
        }

        const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

        // Format Popular Items
        const popularItems = Object.entries(popularItemsMap)
            .map(([name, orders]) => ({ name, orders }))
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 5); // Top 5

        // Format payment methods
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1'];
        const paymentMethods = Object.entries(paymentMethodsMap).map(([name, count], index) => {
            return {
                name,
                value: Math.round((count / totalOrders) * 100) || 0,
                color: colors[index % colors.length]
            };
        });

        // Format trend
        // To keep the chart ordered Mon-Sun
        const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const revenueTrend = orderedDays.map(day => ({
            name: day,
            revenue: revenueTrendMap[day]
        }));

        res.json({
            overview: {
                totalRevenue,
                totalOrders,
                avgOrderValue,
                // Hardcoding growth to 0 for now as it requires previous period calculation
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
    const { role, assignedBrand, assignedOutlets, assignedFactory } = req.user;
    const { type, dateRange } = req.query;

    let matchQuery = getDateQuery(dateRange || 'This Month');

    // Role-based scoping
    if (role === 'Brand Admin') {
        matchQuery.brandId = assignedBrand;
    } else if (role === 'Area Manager' || role === 'Store Manager') {
        if (assignedOutlets && assignedOutlets.length > 0) {
            matchQuery.storeId = { $in: assignedOutlets };
        } else {
            matchQuery._id = null;
        }
        matchQuery.isMMC = true;
    } else if (role !== 'Super Admin') {
        matchQuery._id = null;
    }

    try {
        const orders = await Order.find(matchQuery).populate('user', 'name email');

        let csvContent = '';

        if (type === 'Sales' || type === 'Summary') {
            csvContent += 'Date,Order ID,Customer,Amount,Status\n';
            orders.forEach(o => {
                const dateSplit = o.createdAt.toISOString().split('T')[0];
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
