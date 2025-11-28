const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  resellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coursePrice: {
    type: Number,
    required: true,
  },
  adminCommission: {
    type: Number,
    required: true,
  },
  resellerEarning: {
    type: Number,
    required: true,
    comment: 'coursePrice - adminCommission',
  },
  razorpayOrderId: {
    type: String,
    required: true,
    unique: true,
  },
  razorpayPaymentId: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  commissionStatus: {
    type: String,
    enum: ['PAID', 'PENDING', 'FAILED'],
    default: 'PENDING',
  },
  commissionDeductedAt: {
    type: Date,
  },
  enrolledAt: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: false,
    comment: 'Activated only after commission is paid or pending is recorded',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

enrollmentSchema.index({ resellerId: 1, createdAt: -1 });
enrollmentSchema.index({ studentId: 1, createdAt: -1 });
enrollmentSchema.index({ razorpayOrderId: 1 });
enrollmentSchema.index({ razorpayPaymentId: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
