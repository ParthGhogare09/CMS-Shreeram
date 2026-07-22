const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  purchaseRate: { type: Number, required: true },
  quantityPurchased: { type: Number, required: true },
  quantityAvailable: { type: Number, required: true },
  purchaseDate: { type: String, required: true }
});

const MaterialSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  unit: { type: String, required: true, trim: true },
  stock: { type: Number, default: 0 },
  lowStockWarning: { type: Number, default: 20 },
  purchaseAmount: { type: Number, default: 0 }, // Price per unit (default/latest purchase rate)
  batches: { type: [BatchSchema], default: [] }
});

module.exports = mongoose.model('Material', MaterialSchema);
