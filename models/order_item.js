const mongoose = require('mongoose');

// create oreder item scema
const orderItemSchema = new mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'order',
        required: true,
    },
    menu_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'The quantity must bat at least 1'],
    },
    unit_price: {
        type: Number,
        required: true,
        min: [0, 'Unit price cannot be negative number'],
    }
}, {timestamps: true});

module.exports = mongoose.model('OrderItem', orderItemSchema);