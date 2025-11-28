const express = require('express');
const { body } = require('express-validator');
const {
  getWalletBalance,
  createTopUpOrder,
  manualTopUp,
  getTransactionHistory,
} = require('../controllers/walletController');
const { protect, authorize } = require('../middlewares/auth');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

// Get wallet balance (own wallet or admin can view any)
router.get('/balance', protect, getWalletBalance);
router.get('/balance/:userId', protect, authorize('ADMIN'), getWalletBalance);

// Create Razorpay order for wallet top-up
router.post(
  '/topup/create-order',
  protect,
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
  ],
  validateRequest,
  createTopUpOrder
);

// Manual wallet top-up (Admin only)
router.post(
  '/topup/manual',
  protect,
  authorize('ADMIN'),
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
  ],
  validateRequest,
  manualTopUp
);

// Get transaction history
router.get('/transactions', protect, getTransactionHistory);
router.get('/transactions/:userId', protect, authorize('ADMIN'), getTransactionHistory);

module.exports = router;
