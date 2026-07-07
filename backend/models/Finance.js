const mongoose = require('mongoose');

const FinanceSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  category: { type: String, required: true, trim: true }, // 'Site Payment', 'Labor', 'Materials', 'Transportation', 'Rental', 'Miscellaneous'
  paymentType: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'], 
    default: 'Bank Transfer' 
  },
  description: { type: String, trim: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  days: { type: Number }, // For Rental duration or specific log data
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Finance', FinanceSchema);
