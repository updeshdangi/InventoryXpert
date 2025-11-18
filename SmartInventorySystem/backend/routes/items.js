const express = require('express');
const router = express.Router();
const Item = require('../models/Item');

// Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get item by ID
router.get('/:id', getItem, (req, res) => {
  res.json(res.item);
});

// Create new item
router.post('/', async (req, res) => {
  const item = new Item({
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
    quantity: req.body.quantity || req.body.initialQuantity || 0,
    colors: req.body.colors,
    sizes: req.body.sizes,
    initialQuantity: req.body.initialQuantity || req.body.quantity || 0,
    soldQuantity: req.body.soldQuantity || 0,
    supplier: req.body.supplier,
    reorderThreshold: req.body.reorderThreshold || 2,
    barcode: req.body.barcode,
    category: req.body.category,
  });

  try {
    const newItem = await item.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update item
router.patch('/:id', getItem, async (req, res) => {
  if (req.body.name != null) {
    res.item.name = req.body.name;
  }
  if (req.body.description != null) {
    res.item.description = req.body.description;
  }
  if (req.body.price != null) {
    res.item.price = req.body.price;
  }
  if (req.body.quantity != null) {
    res.item.quantity = req.body.quantity;
  }
  if (req.body.colors != null) {
    res.item.colors = req.body.colors;
  }
  if (req.body.sizes != null) {
    res.item.sizes = req.body.sizes;
  }
  if (req.body.initialQuantity != null) {
    res.item.initialQuantity = req.body.initialQuantity;
  }
  if (req.body.soldQuantity != null) {
    res.item.soldQuantity = req.body.soldQuantity;
  }
  if (req.body.supplier != null) {
    res.item.supplier = req.body.supplier;
  }
  if (req.body.reorderThreshold != null) {
    res.item.reorderThreshold = req.body.reorderThreshold;
  }
  if (req.body.barcode != null) {
    res.item.barcode = req.body.barcode;
  }
  if (req.body.category != null) {
    res.item.category = req.body.category;
  }

  try {
    const updatedItem = await res.item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Receive stock
router.put('/:id/receive', getItem, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be positive' });
  }

  res.item.initialQuantity += parseInt(amount);
  res.item.updatedAt = Date.now();

  try {
    const updatedItem = await res.item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Sell stock
router.put('/:id/sell', getItem, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Amount must be positive' });
  }

  if (res.item.remainingQuantity < amount) {
    return res.status(400).json({ message: 'Insufficient stock' });
  }

  res.item.soldQuantity += parseInt(amount);
  res.item.updatedAt = Date.now();

  try {
    const updatedItem = await res.item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete item
router.delete('/:id', getItem, async (req, res) => {
  try {
    await res.item.deleteOne();
    res.json({ message: 'Deleted Item' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to get item by ID
async function getItem(req, res, next) {
  let item;
  try {
    item = await Item.findById(req.params.id);
    if (item == null) {
      return res.status(404).json({ message: 'Cannot find item' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.item = item;
  next();
}

module.exports = router;
