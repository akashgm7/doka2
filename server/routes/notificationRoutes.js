const express = require('express');
const router = express.Router();
const {
    createBulkNotification,
    getNotificationHistory,
    getMyNotifications,
    getPublicNotifications
} = require('../controllers/notificationController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

// PUBLIC — For the user-facing CAKE app (no auth required)
// Returns only notifications targeted at All Users / Customers
router.get('/public', getPublicNotifications);

// Get user's personal notification feed (admin users)
router.get('/', protect, getMyNotifications);

// Bulk notifications (Requires specific permission)
router.post('/bulk', protect, hasPermission('notifications'), createBulkNotification);

// Notification history (For admins to see what was sent)
router.get('/history', protect, hasPermission('notifications'), getNotificationHistory);

module.exports = router;
