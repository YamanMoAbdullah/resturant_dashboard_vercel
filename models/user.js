const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcryptjs = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
        unique: true,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        required: [true, "Please enter your email"],
        validate: [isEmail, 'Please enter a valid email'],
    },
    hashPassword: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: [8, 'Minimum password length is 8 characters'],
    },
    permissions: {
        type: [String], 
        default: ['/admin/dashboard'], 
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superAdmin'],
        default: 'user',
    },
}, { timestamps:true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('hashPassword')) return next();

    const salt = await bcryptjs.genSalt();
    this.hashPassword = await bcryptjs.hash(this.hashPassword, salt);
    next();
});

module.exports = mongoose.model('User', userSchema);
