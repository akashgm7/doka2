const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, hasPermission('manage_users'), getUsers)
    .post(protect, hasPermission('manage_users'), createUser);

router.route('/:id')
    .put(protect, hasPermission('manage_users'), updateUser)
    .delete(protect, hasPermission('manage_users'), deleteUser);

module.exports = router;
