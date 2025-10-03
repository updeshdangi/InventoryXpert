const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
  colors: [{
    type: String,
  }],
  sizes: [{
    type: String,
  }],
  initialQuantity: {
    type: Number,
    default: 0,
  },
  soldQuantity: {
    type: Number,
    default: 0,
  },
  supplier: {
    type: String,
  },
  reorderThreshold: {
    type: Number,
    default: 2,
  },
  barcode: {
    type: String,
    unique: true,
  },
  category: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for remaining quantity
itemSchema.virtual('remainingQuantity').get(function() {
  return this.initialQuantity - this.soldQuantity;
});

// Ensure virtual fields are serialized
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Item', itemSchema);
