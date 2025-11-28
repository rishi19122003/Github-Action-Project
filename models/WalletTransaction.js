const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT'],
    required: true,
  },
  category: {
    type: String,
    enum: ['TOP_UP', 'COMMISSION_DEDUCTION', 'REFUND', 'ADJUSTMENT', 'PAYOUT'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  referenceId: {
    type: String,
    comment: 'Razorpay payment ID, enrollment ID, or payout ID',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    comment: 'Additional data like course details, student info, etc.',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ referenceId: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
