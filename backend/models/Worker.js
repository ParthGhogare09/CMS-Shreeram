const mongoose = require('mongoose');

const WorkerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  dailyWage: { type: Number, required: true },
  contactInfo: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  addedBy: { type: String, default: '' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  joinedAt: { type: Date, default: Date.now },
  advance: { type: Number, default: 0 }
});

module.exports = mongoose.model('Worker', WorkerSchema);
