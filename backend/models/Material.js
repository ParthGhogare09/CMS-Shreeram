const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  unit: { type: String, required: true, trim: true },
  stock: { type: Number, default: 0 },
  lowStockWarning: { type: Number, default: 20 },
  purchaseAmount: { type: Number, default: 0 } // Price per unit
});

module.exports = mongoose.model('Material', MaterialSchema);
