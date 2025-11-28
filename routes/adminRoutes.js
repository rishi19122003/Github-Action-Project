const express = require('express');
const { body } = require('express-validator');
const {
  getPendingCommissions,
  getCommissionStats,
  getResellerCommissionBreakdown,
  getAllUsers,
  toggleUserBlock,
  getDashboardStats,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

// All routes are admin only
router.use(protect);
router.use(authorize('ADMIN'));

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Commission management
router.get('/commissions/pending', getPendingCommissions);
router.get('/commissions/stats', getCommissionStats);
router.get('/commissions/reseller-breakdown', getResellerCommissionBreakdown);

// User management
router.get('/users', getAllUsers);
router.patch(
  '/users/:userId/block',
  [
    body('isBlocked').isBoolean().withMessage('isBlocked must be a boolean'),
  ],
  validateRequest,
  toggleUserBlock
);

module.exports = router;
