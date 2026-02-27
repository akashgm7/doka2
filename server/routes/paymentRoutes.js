const express = require('express');
const router = express.Router();
const { getPayments, getPaymentStats } = require('../controllers/paymentController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', hasPermission('view_payments'), getPayments);
router.get('/stats', hasPermission('view_payments'), getPaymentStats);

module.exports = router;
