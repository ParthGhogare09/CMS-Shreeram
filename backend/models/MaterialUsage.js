const mongoose = require('mongoose');

const MaterialUsageSchema = new mongoose.Schema({
  material: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  quantity: { type: Number, required: true },
  distributionRate: { type: Number, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MaterialUsage', MaterialUsageSchema);
