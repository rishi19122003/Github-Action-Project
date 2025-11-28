const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Course price is required'],
    min: 0,
  },
  adminCommission: {
    type: Number,
    required: [true, 'Admin commission is required'],
    min: 0,
    comment: 'Fixed commission amount admin earns per sale',
  },
  commissionType: {
    type: String,
    enum: ['FIXED', 'PERCENTAGE'],
    default: 'FIXED',
  },
  thumbnail: {
    type: String,
  },
  category: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', courseSchema);
