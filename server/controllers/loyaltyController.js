const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const LoyaltyConfig = require('../models/LoyaltyConfig');

// @desc    Get loyalty program configuration
// @route   GET /api/loyalty/config
// @access  Private
const getLoyaltyConfig = asyncHandler(async (req, res) => {
    let config = await LoyaltyConfig.findOne();
    if (!config) {
        // Create default if none exists
        config = await LoyaltyConfig.create({
            tiers: [
                { name: 'Bronze', minPoints: 0, multiplier: 1, color: 'bg-amber-600' },
                { name: 'Silver', minPoints: 1000, multiplier: 1.25, color: 'bg-slate-400' },
                { name: 'Gold', minPoints: 5000, multiplier: 1.5, color: 'bg-yellow-400' },
                { name: 'Platinum', minPoints: 10000, multiplier: 2, color: 'bg-slate-800' }
            ]
        });
    }
    res.json(config);
});

// @desc    Update loyalty program configuration
// @route   PUT /api/loyalty/config
// @access  Private (Super Admin only)
const updateLoyaltyConfig = asyncHandler(async (req, res) => {
    let config = await LoyaltyConfig.findOne();
    if (config) {
        config = await LoyaltyConfig.findByIdAndUpdate(config._id, req.body, { new: true });
    } else {
        config = await LoyaltyConfig.create(req.body);
    }
    res.json(config);
});

// @desc    Get real-time loyalty program statistics
// @route   GET /api/loyalty/stats
// @access  Private (Admin only)
const getLoyaltyStats = asyncHandler(async (req, res) => {
    // If brandId is provided (Brand Scope), filter by it. Otherwise show global (System Scope).
    const filter = {};
    if (req.user && req.user.scopeLevel === 'Brand' && req.user.assignedBrand) {
        filter.brandId = req.user.assignedBrand;
    }

    // 1. Total Points Earned (Sum of earnedLoyaltyPoints from all matching orders)
    const pointsData = await Order.aggregate([
        { $match: filter },
        { $group: { _id: null, totalEarned: { $sum: "$earnedLoyaltyPoints" } } }
    ]);
    const totalPointsEarned = pointsData.length > 0 ? pointsData[0].totalEarned : 0;

    // 2. Active Members
    let activeMembers = 0;

    if (filter.brandId) {
        // Find all unique users who have placed an order with this brand
        const distinctUsersFromBrandOrders = await Order.distinct('user', { brandId: filter.brandId });

        // Count how many of these distinct users have loyaltyPoints > 0
        activeMembers = await User.countDocuments({
            _id: { $in: distinctUsersFromBrandOrders },
            loyaltyPoints: { $gt: 0 }
        });
    } else {
        // Super Admin sees all active members globally
        activeMembers = await User.countDocuments({ loyaltyPoints: { $gt: 0 } });
    }

    // Provide the dynamic stats (simulating some redemption logic as 0 for now until implemented)
    res.json({
        totalPointsEarned,
        totalPointsRedeemed: 0,
        activeMembers,
        redemptionRate: 0
    });
});

module.exports = {
    getLoyaltyStats,
    getLoyaltyConfig,
    updateLoyaltyConfig
};
