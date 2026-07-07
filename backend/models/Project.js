const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  clientName: { type: String, required: true, trim: true },
  budget: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Planning', 'Active', 'Completed', 'On Hold'], 
    default: 'Active' 
  },
  location: { type: String, trim: true },
  startDate: { type: Date },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);
