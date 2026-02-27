const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/auditController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

router.get('/', protect, hasPermission('view_audit_logs'), getLogs);

module.exports = router;
