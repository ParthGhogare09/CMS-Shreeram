const mongoose = require('mongoose');

const MaterialUsageSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  quantity: { type: Number, required: true },
  distributionRate: { type: Number, required: true },
  purchaseRateInfo: { type: String, default: '' }, // e.g. "₹350" or "₹350 (10 Bags), ₹380 (5 Bags)"
  purchaseCost: { type: Number, default: 0 }, // Total cost of consumed quantity based on batch rates
  batchesConsumed: { type: String, default: '' }, // e.g. "Batch 1" or "Batch 1, Batch 2"
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MaterialUsage', MaterialUsageSchema);
