const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    comment: 'Current wallet balance - can go negative',
  },
  totalEarned: {
    type: Number,
    default: 0,
    comment: 'Total amount earned from course sales',
  },
  totalCommissionPaid: {
    type: Number,
    default: 0,
    comment: 'Total commission paid to admin',
  },
  totalCommissionPending: {
    type: Number,
    default: 0,
    comment: 'Total pending commission (when balance was insufficient)',
  },
  totalTopUp: {
    type: Number,
    default: 0,
    comment: 'Total amount topped up',
  },
  lastTopUpAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Wallet', walletSchema);
