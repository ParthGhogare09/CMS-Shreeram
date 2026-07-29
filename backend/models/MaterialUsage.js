const mongoose = require('mongoose');

const MaterialUsageSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: false },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, default: 'Material' }, // 'Material' or 'Miscellaneous'
  miscName: { type: String, default: '' },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'Units' },
  distributionRate: { type: Number, required: true },
  purchaseRateInfo: { type: String, default: '' }, // e.g. "₹350" or "₹350 (10 Bags), ₹380 (5 Bags)"
  purchaseCost: { type: Number, default: 0 }, // Total cost of consumed quantity based on batch rates
  batchesConsumed: { type: String, default: '' }, // e.g. "Batch 1" or "Batch 1, Batch 2"
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  addedBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MaterialUsage', MaterialUsageSchema);
