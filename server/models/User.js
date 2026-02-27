const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { dokaConnection } = require('../config/db');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Super Admin', 'Brand Admin', 'Area Manager', 'Store Manager', 'Store User', 'Factory Manager'],
        default: 'Store User'
    },
    // Scope fields
    assignedBrand: {
        type: String, // ID of the brand
        default: null
    },
    assignedFactory: {
        type: String, // ID of the factory
        default: null
    },
    assignedOutlets: [{
        type: String // IDs of stores/outlets
    }],
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    loyaltyPoints: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = dokaConnection.model('User', userSchema);

module.exports = User;
