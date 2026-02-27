const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

router.get('/stats', protect, hasPermission('view_dashboard'), getDashboardStats);

module.exports = router;
