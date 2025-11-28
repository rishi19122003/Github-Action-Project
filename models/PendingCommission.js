const mongoose = require('mongoose');

const pendingCommissionSchema = new mongoose.Schema({
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enrollment',
    required: true,
  },
  resellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'CANCELLED'],
    default: 'PENDING',
  },
  walletBalanceAtTime: {
    type: Number,
    comment: 'Wallet balance when commission was due',
  },
  paidAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

pendingCommissionSchema.index({ resellerId: 1, status: 1 });
pendingCommissionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('PendingCommission', pendingCommissionSchema);
