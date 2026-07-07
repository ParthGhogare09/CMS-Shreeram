const mongoose = require('mongoose');

const WorkerLogSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Can be null if Absent or Leave
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  roleAtTime: { type: String },
  wageAtTime: { type: Number },
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Half Day', 'Leave'], 
    default: 'Present' 
  },
  workTime: { 
    type: String, 
    enum: ['Full Day', 'Half Day', 'Overtime', '-'], 
    default: 'Full Day' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['Paid', 'Pending', 'Partial'], 
    default: 'Pending' 
  },
  amountPaid: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WorkerLog', WorkerLogSchema);
