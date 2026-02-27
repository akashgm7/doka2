const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    try {
        console.log('Initiating User.findOne...');
        const user = await User.findOne({ email }).maxTimeMS(5000);
        console.log(`User query result: ${user ? 'Found' : 'Not Found'}`);
        console.log(`User found: ${user ? 'Yes' : 'No'}`);

        if (user) {
            const isMatch = await user.matchPassword(password);
            console.log(`Password match: ${isMatch}`);

            // Check if user is active
            if (user.status !== 'Active') {
                return res.status(403).json({ message: 'Account is inactive. Please contact support.' });
            }

            if (isMatch) {
                // Fetch dynamic permissions for the user's role
                const Role = require('../models/Role');
                const roleDetails = await Role.findOne({ name: user.role });
                const permissions = roleDetails ? roleDetails.permissions : [];

                res.json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    permissions: permissions, // Include permissions here
                    assignedBrand: user.assignedBrand,
                    assignedFactory: user.assignedFactory,
                    assignedOutlets: user.assignedOutlets,
                    token: generateToken(user._id)
                });

                // Audit Log: Login
                try {
                    const { createLog } = require('./auditController');
                    await createLog({
                        user: user.name,
                        userId: user._id,
                        role: user.role,
                        brandId: user.assignedBrand,
                        action: 'Login',
                        resource: 'Auth',
                        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                        status: 'Success'
                    });
                } catch (auditError) {
                    console.error('Audit log failed:', auditError);
                }
            } else {
                res.status(401).json({ message: 'Invalid email or password' });
            }
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (or Protected Admin)
const registerUser = async (req, res) => {
    const { name, email, password, role, assignedBrand, assignedFactory, assignedOutlets } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            assignedBrand,
            assignedFactory,
            assignedOutlets
        });

        if (user) {
            // Fetch dynamic permissions for the user's role
            const Role = require('../models/Role');
            const roleDetails = await Role.findOne({ name: user.role });
            const permissions = roleDetails ? roleDetails.permissions : [];

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: permissions, // Include permissions here
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            // Re-fetch roles just to be 100% sure for the profile response
            const Role = require('../models/Role');
            const roleDetails = await Role.findOne({ name: user.role });
            const permissions = roleDetails ? roleDetails.permissions : [];

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: permissions,
                assignedBrand: user.assignedBrand,
                assignedFactory: user.assignedFactory,
                assignedOutlets: user.assignedOutlets
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const logoutUser = async (req, res) => {
    try {
        if (req.user) {
            const { createLog } = require('./auditController');
            await createLog({
                user: req.user.name,
                userId: req.user._id,
                role: req.user.role,
                brandId: req.user.assignedBrand,
                action: 'Logout',
                resource: 'Auth',
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                status: 'Success'
            });
        }
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { loginUser, registerUser, getMe, logoutUser };
