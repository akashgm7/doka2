const express = require('express');
const router = express.Router();
const {
    getStores,
    getStoreById,
    createStore,
    updateStore,
    deleteStore,
    geocodeAddress
} = require('../controllers/storeController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

router.post('/geocode', protect, geocodeAddress);

router.route('/')
    .get(getStores)
    .post(protect, hasPermission('manage_locations'), createStore);

router.route('/:id')
    .get(getStoreById)
    .put(protect, hasPermission('manage_locations'), updateStore)
    .delete(protect, hasPermission('manage_locations'), deleteStore);

module.exports = router;
