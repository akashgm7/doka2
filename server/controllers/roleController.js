const Role = require('../models/Role');
let PERMISSIONS = require('../constants/permissions');

// @desc    Get all permissible strings
// @route   GET /api/roles/permissions
// @access  Private (Admin)
const getPermissions = async (req, res) => {
    try {
        delete require.cache[require.resolve('../constants/permissions')];
        const LATEST_PERMISSIONS = require('../constants/permissions');
        res.json(LATEST_PERMISSIONS);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private (Admin)
const getRoles = async (req, res) => {
    try {
        console.log('GET /api/roles - Fetching all roles');
        const roles = await Role.find({});
        console.log(`Found ${roles.length} roles`);
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Private (Admin)
const getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (role) {
            res.json(role);
        } else {
            res.status(404).json({ message: 'Role not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new role
// @route   POST /api/roles
// @access  Private (Admin)
const createRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;

        const roleExists = await Role.findOne({ name });
        if (roleExists) {
            return res.status(400).json({ message: 'Role already exists' });
        }

        // Validate permissions
        if (permissions && permissions.length > 0) {
            delete require.cache[require.resolve('../constants/permissions')];
            const LATEST_PERMISSIONS = require('../constants/permissions');
            const validPermIds = LATEST_PERMISSIONS.map(p => p.id);
            const invalidPerms = permissions.filter(p => !validPermIds.includes(p));
            if (invalidPerms.length > 0) {
                return res.status(400).json({
                    message: `Invalid permissions provided: ${invalidPerms.join(', ')}`
                });
            }
        }

        const role = new Role({
            name,
            description,
            permissions
        });

        const createdRole = await role.save();
        res.status(201).json(createdRole);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a role
// @route   PUT /api/roles/:id
// @access  Private (Admin)
const updateRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (role) {
            role.name = req.body.name || role.name;
            role.description = req.body.description || role.description;

            if (req.body.permissions) {
                // Validate permissions
                delete require.cache[require.resolve('../constants/permissions')];
                const LATEST_PERMISSIONS = require('../constants/permissions');
                const validPermIds = LATEST_PERMISSIONS.map(p => p.id);
                console.log('Valid IDs in memory:', validPermIds);
                console.log('Incoming permissions:', req.body.permissions);
                const invalidPerms = req.body.permissions.filter(p => !validPermIds.includes(p));
                if (invalidPerms.length > 0) {
                    console.error('Validation FAILED for IDs:', invalidPerms);
                    return res.status(400).json({
                        message: `Invalid permissions provided: ${invalidPerms.join(', ')}`
                    });
                }
                role.permissions = req.body.permissions;
            }

            const updatedRole = await role.save();
            res.json(updatedRole);
        } else {
            res.status(404).json({ message: 'Role not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a role
// @route   DELETE /api/roles/:id
// @access  Private (Admin)
const deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (role) {
            if (role.isSystem) {
                return res.status(400).json({ message: 'Cannot delete system role' });
            }
            await role.deleteOne();
            res.json({ message: 'Role removed' });
        } else {
            res.status(404).json({ message: 'Role not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    getPermissions
};
