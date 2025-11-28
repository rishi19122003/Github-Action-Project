const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const { razorpayInstance } = require('../config/razorpay');
const { creditWallet, clearPendingCommissions } = require('../utils/walletHelper');

/**
 * Get wallet balance and details
 */
const getWalletBalance = async (req, res, next) => {
  try {
    const userId = req.user.role === 'ADMIN' ? req.params.userId : req.user.id;

    const wallet = await Wallet.findOne({ userId }).populate('userId', 'name email isBlocked');

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }

    res.status(200).json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Razorpay order for wallet top-up
 * Money goes to ADMIN/PLATFORM account
 */
const createTopUpOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be at least 1 INR',
      });
    }

    // Check if wallet exists
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found',
      });
    }

    // Create Razorpay order (money comes to platform/admin)
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `top_${Date.now().toString().slice(-10)}`, // Max 40 chars
      notes: {
        purpose: 'WALLET_TOP_UP',
        userId: userId.toString(),
        userName: req.user.name,
        userEmail: req.user.email,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      message: 'Top-up order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manual wallet top-up (Admin only)
 */
const manualTopUp = async (req, res, next) => {
  try {
    const { userId, amount, description } = req.body;

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    const { wallet, transaction } = await creditWallet(
      userId,
      amount,
      'TOP_UP',
      description || 'Manual wallet top-up by admin',
      null,
      { method: 'MANUAL', adminId: req.user.id }
    );

    // Try to clear pending commissions if any
    await clearPendingCommissions(userId);

    res.status(200).json({
      success: true,
      message: 'Wallet topped up successfully',
      data: {
        wallet,
        transaction,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get wallet transaction history
 */
const getTransactionHistory = async (req, res, next) => {
  try {
    const userId = req.user.role === 'ADMIN' ? req.params.userId : req.user.id;
    const { page = 1, limit = 20, type, category } = req.query;

    const query = { userId };
    
    if (type) query.type = type;
    if (category) query.category = category;

    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await WalletTransaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        transactions,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalTransactions: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWalletBalance,
  createTopUpOrder,
  manualTopUp,
  getTransactionHistory,
};
