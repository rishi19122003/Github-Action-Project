const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const PendingCommission = require('../models/PendingCommission');
const User = require('../models/User');

/**
 * Credit wallet (add money)
 */
const creditWallet = async (userId, amount, category, description, referenceId = null, metadata = null, session = null) => {
  const wallet = await Wallet.findOne({ userId });
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const balanceBefore = wallet.balance;
  wallet.balance += amount;
  const balanceAfter = wallet.balance;

  if (category === 'TOP_UP') {
    wallet.totalTopUp += amount;
    wallet.lastTopUpAt = new Date();
  }

  await wallet.save();

  // Create transaction record
  const transaction = await WalletTransaction.create({
    walletId: wallet._id,
    userId,
    type: 'CREDIT',
    category,
    amount,
    balanceBefore,
    balanceAfter,
    description,
    referenceId,
    metadata,
  });

  return { wallet, transaction };
};

/**
 * Debit wallet (deduct money)
 */
const debitWallet = async (userId, amount, category, description, referenceId = null, metadata = null, session = null) => {
  const wallet = await Wallet.findOne({ userId });
  
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const balanceBefore = wallet.balance;
  wallet.balance -= amount;
  const balanceAfter = wallet.balance;

  await wallet.save();

  // Create transaction record
  const transaction = await WalletTransaction.create({
    walletId: wallet._id,
    userId,
    type: 'DEBIT',
    category,
    amount,
    balanceBefore,
    balanceAfter,
    description,
    referenceId,
    metadata,
  });

  return { wallet, transaction };
};

/**
 * Process commission deduction after payment
 * CORE BUSINESS LOGIC
 * NOTE: Transactions disabled for local MongoDB (requires replica set)
 */
const processCommissionDeduction = async (enrollmentId, resellerId, commissionAmount, courseTitle) => {
  try {
    const wallet = await Wallet.findOne({ userId: resellerId });
    
    if (!wallet) {
      throw new Error('Wallet not found for reseller');
    }

    const reseller = await User.findById(resellerId);
    
    if (!reseller) {
      throw new Error('Reseller not found');
    }

    // Check if wallet has sufficient balance
    if (wallet.balance >= commissionAmount) {
      // SUFFICIENT BALANCE - Deduct commission immediately
      await debitWallet(
        resellerId,
        commissionAmount,
        'COMMISSION_DEDUCTION',
        `Commission deducted for course: ${courseTitle}`,
        enrollmentId.toString(),
        { courseTitle, commissionAmount, status: 'PAID' }
      );

      wallet.totalCommissionPaid += commissionAmount;
      await wallet.save();

      return {
        success: true,
        commissionStatus: 'PAID',
        message: 'Commission deducted successfully',
        walletBalance: wallet.balance,
      };
    } else {
      // INSUFFICIENT BALANCE - Create pending commission and block reseller
      
      // Deduct anyway (balance goes negative)
      await debitWallet(
        resellerId,
        commissionAmount,
        'COMMISSION_DEDUCTION',
        `Commission deducted (PENDING) for course: ${courseTitle}`,
        enrollmentId.toString(),
        { courseTitle, commissionAmount, status: 'PENDING' }
      );

      wallet.totalCommissionPending += commissionAmount;
      await wallet.save();

      // Create pending commission record
      await PendingCommission.create({
        enrollmentId,
        resellerId,
        amount: commissionAmount,
        status: 'PENDING',
        walletBalanceAtTime: wallet.balance + commissionAmount, // Balance before deduction
      });

      // Block reseller from future sales
      reseller.isBlocked = true;
      await reseller.save();

      return {
        success: true,
        commissionStatus: 'PENDING',
        message: 'Insufficient balance. Commission marked as pending. Reseller blocked.',
        walletBalance: wallet.balance,
      };
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Clear pending commissions when wallet is topped up
 * NOTE: Transactions disabled for local MongoDB (requires replica set)
 */
const clearPendingCommissions = async (resellerId) => {
  try {
    const wallet = await Wallet.findOne({ userId: resellerId });
    const reseller = await User.findById(resellerId);

    if (!wallet || !reseller) {
      throw new Error('Wallet or Reseller not found');
    }

    // If balance is now positive/zero and there are pending commissions
    if (wallet.balance >= 0 && wallet.totalCommissionPending > 0) {
      // Move pending to paid
      wallet.totalCommissionPaid += wallet.totalCommissionPending;
      wallet.totalCommissionPending = 0;
      await wallet.save();

      // Update all pending commissions to PAID
      await PendingCommission.updateMany(
        { resellerId, status: 'PENDING' },
        { status: 'PAID', paidAt: new Date() }
      );

      // Unblock reseller
      reseller.isBlocked = false;
      await reseller.save();

      return {
        success: true,
        message: 'Pending commissions cleared. Reseller unblocked.',
      };
    }

    return {
      success: false,
      message: 'Insufficient balance to clear pending commissions',
      requiredBalance: Math.abs(wallet.balance),
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  creditWallet,
  debitWallet,
  processCommissionDeduction,
  clearPendingCommissions,
};
