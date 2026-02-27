const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { protect, hasPermission } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getProducts)
    .post(protect, hasPermission('manage_menu'), createProduct);

router.route('/:id')
    .get(protect, getProductById)
    .put(protect, hasPermission('manage_menu'), updateProduct)
    .delete(protect, hasPermission('manage_menu'), deleteProduct);

module.exports = router;
