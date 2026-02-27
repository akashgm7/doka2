const express = require('express');
const router = express.Router();
const { getLoyaltyStats, getLoyaltyConfig, updateLoyaltyConfig } = require('../controllers/loyaltyController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/config').get(protect, getLoyaltyConfig).put(protect, admin, updateLoyaltyConfig);
router.route('/stats').get(protect, getLoyaltyStats);

module.exports = router;
