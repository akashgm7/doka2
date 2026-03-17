const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getMe, logoutUser, getDevCredentials } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getMe);
router.get('/dev-credentials', getDevCredentials);

module.exports = router;
