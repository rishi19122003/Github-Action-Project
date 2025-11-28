const express = require('express');
const { body } = require('express-validator');
const {
  createAdminPayout,
  getPayoutDetails,
  getAllPayouts,
} = require('../controllers/payoutController');
const { protect, authorize } = require('../middlewares/auth');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

// All routes are admin only
router.use(protect);
router.use(authorize('ADMIN'));

// Create payout (Admin withdraws collected commissions)
router.post(
  '/create',
  [
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('bankDetails.accountNumber').notEmpty().withMessage('Account number is required'),
    body('bankDetails.ifscCode').notEmpty().withMessage('IFSC code is required'),
    body('bankDetails.accountHolderName').notEmpty().withMessage('Account holder name is required'),
    body('mode').optional().isIn(['IMPS', 'NEFT', 'RTGS', 'UPI']).withMessage('Invalid mode'),
  ],
  validateRequest,
  createAdminPayout
);

// Get payout details
router.get('/:payoutId', getPayoutDetails);

// Get all payouts
router.get('/', getAllPayouts);

module.exports = router;
