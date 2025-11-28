const express = require('express');
const { protect, authorize } = require('../middlewares/auth');
const Wallet = require('../models/Wallet');

const router = express.Router();

/**
 * TEST ONLY: Add test commission to admin wallet
 * Remove this in production!
 */
router.post('/add-test-commission', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { amount } = req.body;
    const adminId = req.user.id;

    let wallet = await Wallet.findOne({ userId: adminId });
    
    if (!wallet) {
      wallet = await Wallet.create({ userId: adminId, balance: 0 });
    }

    wallet.totalCommissionPaid += amount || 1000;
    await wallet.save();

    res.json({
      success: true,
      message: `Added ₹${amount || 1000} test commission to admin wallet`,
      data: wallet
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
