const mongoose = require('mongoose');
const { trim, isLowercase } = require('validator');

// createmenu item schema
const menuItemSchema = new mongoose.Schema({
    image: {
        type: String, 
        required: [true, 'Image url is required'],
        trim: true,
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [1, 'The name word length must be at least 1 character long'],
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required'],
    }
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);