const mongoose = require('mongoose');

const SessionLogSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  device: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Logged Out'],
    default: 'Active'
  }
});

module.exports = mongoose.model('SessionLog', SessionLogSchema);
