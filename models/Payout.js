const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  razorpayContactId: {
    type: String,
  },
  razorpayFundAccountId: {
    type: String,
  },
  razorpayPayoutId: {
    type: String,
  },
  status: {
    type: String,
    enum: ['INITIATED', 'PROCESSING', 'PROCESSED', 'REVERSED', 'FAILED'],
    default: 'INITIATED',
  },
  mode: {
    type: String,
    enum: ['IMPS', 'NEFT', 'RTGS', 'UPI'],
    default: 'IMPS',
  },
  purpose: {
    type: String,
    default: 'payout',
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    bankName: String,
  },
  failureReason: {
    type: String,
  },
  processedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

payoutSchema.index({ adminId: 1, createdAt: -1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ razorpayPayoutId: 1 });

module.exports = mongoose.model('Payout', payoutSchema);
