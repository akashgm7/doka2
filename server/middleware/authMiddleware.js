const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch user and populate their role details (permissions)
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            // Hydrate permissions from the Role collection
            const roleDetails = await Role.findOne({ name: user.role }).lean();

            // Attach user and permissions to request as a plain array
            req.user = user;
            req.user.permissions = roleDetails ? [...roleDetails.permissions] : [];

            console.log(`Protect Middleware: User ${user.email} (${user.role}) authenticated with ${req.user.permissions.length} permissions`);
            next();
        } catch (error) {
            console.error('Protect Middleware Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'Super Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Requires Super Admin role' });
    }
};

// Check if user has specific permission
const hasPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, no user found' });
        }

        // Super Admin bypasses all checks
        if (req.user.role === 'Super Admin') {
            return next();
        }

        if (!req.user.permissions || !req.user.permissions.includes(permission)) {
            console.log(`Permission Denied: User ${req.user.email} lacks '${permission}'`);
            return res.status(403).json({
                message: `Forbidden: You do not have permission to ${permission.replace('_', ' ')}`
            });
        }

        next();
    };
};

// Deprecated: Use hasPermission instead for more granular control
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, no user found' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, admin, authorize, hasPermission };
