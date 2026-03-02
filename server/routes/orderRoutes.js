const express = require('express');
const router = express.Router();
const { getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, hasPermission('view_orders'), getOrders);

router.route('/:id')
    .get(protect, hasPermission('view_orders'), getOrderById);

router.route('/:id/status')
    .patch(protect, hasPermission('manage_orders'), updateOrderStatus);

module.exports = router;
