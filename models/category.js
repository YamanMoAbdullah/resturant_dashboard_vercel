const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    trim: true,
  },
   itemCount: {
    type: Number,
    default: 0,
    min: [0, 'Item count cannot be negative'],
  }
}, {
  timestamps: true, 
});

module.exports = mongoose.model('Category', categorySchema);