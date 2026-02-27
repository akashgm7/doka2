const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { sendTemporaryPasswordEmail } = require('../services/emailService');

// Helper: generate a secure random temporary password
const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
    try {
        const currentUser = req.user;
        let query = {};

        // Role-based scoping (mirrors frontend logic for security)
        if (currentUser.role === 'Brand Admin') {
            query.assignedBrand = currentUser.assignedBrand;
        } else if (currentUser.role === 'Area Manager') {
            // Area Managers can see users in their outlets
            query.assignedOutlets = { $in: currentUser.assignedOutlets || [] };
            query.assignedBrand = currentUser.assignedBrand;
        } else if (currentUser.role === 'Store Manager') {
            // Store Managers see users in their store
            query.assignedOutlets = { $in: currentUser.assignedOutlets || [] };
        } else if (currentUser.role !== 'Super Admin') {
            // Default restrict to nothing for others
            return res.status(403).json({ message: 'Not authorized to view users' });
        }

        const users = await User.find(query).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res) => {
    try {
        console.log('Create User Request Body:', req.body);
        const { name, email, role, brandId, assignedOutlets, assignedFactory } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            console.log('User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate a secure temporary password
        const tempPassword = generateTempPassword();

        // Hash the temp password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            assignedBrand: brandId || req.body.assignedBrand,
            assignedOutlets,
            assignedFactory,
            status: 'Active',
            loyaltyPoints: req.body.loyaltyPoints || 0
        });

        if (user) {
            console.log('User created successfully:', user._id);

            // Send the temporary password to the user's email
            try {
                await sendTemporaryPasswordEmail(email, name, tempPassword);
            } catch (emailError) {
                // User is still created even if email fails — log for admin awareness
                console.error('⚠ User created but email failed:', emailError.message);
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                loyaltyPoints: user.loyaltyPoints
            });
        } else {
            console.log('Invalid user data (user creation failed)');
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Create User Error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.assignedBrand = req.body.assignedBrand !== undefined ? req.body.assignedBrand : (req.body.brandId !== undefined ? req.body.brandId : user.assignedBrand);
            user.assignedOutlets = req.body.assignedOutlets || user.assignedOutlets;
            user.assignedFactory = req.body.assignedFactory !== undefined ? req.body.assignedFactory : user.assignedFactory;
            user.status = req.body.status || user.status;

            // Allow Super Admins to manually adjust loyalty points if provided
            if (req.body.loyaltyPoints !== undefined && req.user.role === 'Super Admin') {
                user.loyaltyPoints = req.body.loyaltyPoints;
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                status: updatedUser.status,
                loyaltyPoints: updatedUser.loyaltyPoints
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            // Prevent deleting yourself
            if (user._id.toString() === req.user._id.toString()) {
                return res.status(400).json({ message: 'Cannot delete your own account' });
            }

            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};
