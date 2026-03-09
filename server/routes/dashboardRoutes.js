const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

router.get('/stats', protect, hasPermission('sys_login'), getDashboardStats);

module.exports = router;
