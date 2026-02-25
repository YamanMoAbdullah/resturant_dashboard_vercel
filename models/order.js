const mongoose = require('mongoose');

// crate order schema 
const orderSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    total_price: {
        type: Number,
        required: true,
        min: [0, 'The total price cannot be negative number'],
    },
    status: {
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'cancelled', 'processing'],
        default: 'pending'
    }
},  {timestamps: true});

module.exports = mongoose.model('Order', orderSchema);