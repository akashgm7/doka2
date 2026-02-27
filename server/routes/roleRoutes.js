const express = require('express');
const router = express.Router();
const {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getPermissions
} = require('../controllers/roleController');
const { protect, hasPermission, admin } = require('../middleware/authMiddleware');

// All role routes are protected and restricted to Super Admins (using 'admin' middleware for now, will refactor later)
// Permissions list (must be before :id routes)
router.get('/permissions', protect, hasPermission('manage_users'), getPermissions);

// Roles CRUD
router.route('/')
    .get(protect, hasPermission('manage_users'), getRoles)
    .post(protect, admin, createRole);

router.route('/:id')
    .get(protect, hasPermission('manage_users'), getRoleById)
    .put(protect, admin, updateRole)
    .delete(protect, admin, deleteRole);

module.exports = router;
