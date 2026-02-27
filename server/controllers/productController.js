const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
    const { brandId } = req.query;
    let query = {};

    if (brandId) {
        query.brandId = brandId;
    }

    try {
        const products = await Product.find(query);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Brand Admin)
const createProduct = async (req, res) => {
    try {
        const productData = {
            ...req.body,
            user: req.user._id, // Required by Store schema
            price: req.body.price || req.body.basePrice || 0,
            brand: req.body.brand || req.body.brandId || 'DOKA',
            image: req.body.image || 'https://via.placeholder.com/150',
            description: req.body.description || 'No description provided',
            ingredients: req.body.ingredients || [],
            allergens: req.body.allergens || [],
            calories: req.body.calories
        };
        const product = new Product(productData);
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Brand Admin)
const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            if (req.body.basePrice) req.body.price = req.body.basePrice;
            if (req.body.brandId) req.body.brand = req.body.brandId;

            // Explicitly map metadata fields to ensure they are picked up
            const { ingredients, allergens, calories } = req.body;
            if (ingredients !== undefined) product.ingredients = ingredients;
            if (allergens !== undefined) product.allergens = allergens;
            if (calories !== undefined) product.calories = calories;

            Object.assign(product, req.body);
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Brand Admin)
const deleteProduct = async (req, res) => {
    console.log(`DELETE request received for ID: ${req.params.id} by user: ${req.user.email}`);
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            console.log(`Product found: ${product.name}. Deleting...`);
            await product.deleteOne();
            console.log(`Product ${req.params.id} deleted successfully.`);
            res.json({ message: 'Product removed' });
        } else {
            console.log(`Product ${req.params.id} not found in DB.`);
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        console.error(`Error deleting product ${req.params.id}:`, error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
