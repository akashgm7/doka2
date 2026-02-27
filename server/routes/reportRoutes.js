const express = require('express');
const router = express.Router();
const { getAnalytics, downloadReport } = require('../controllers/reportController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

router.use(protect);

// Require view_reports permission for both endpoints
router.get('/analytics', hasPermission('view_reports'), getAnalytics);
router.get('/download', hasPermission('view_reports'), downloadReport);

module.exports = router;
