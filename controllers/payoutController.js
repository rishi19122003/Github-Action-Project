const Payout = require('../models/Payout');
const Wallet = require('../models/Wallet');
const { createContact, createFundAccount, createPayout, getPayoutStatus } = require('../utils/razorpayXHelper');
const { debitWallet } = require('../utils/walletHelper');

/**
 * Create payout (Admin withdraws collected commissions)
 * Uses RazorpayX for real bank transfers
 */
const createAdminPayout = async (req, res, next) => {
  try {
    const { amount, bankDetails, mode } = req.body;
    const adminId = req.user.id;

    // Validate amount
    if (amount < 100) {
      return res.status(400).json({
        success: false,
        error: 'Minimum payout amount is 100 INR',
      });
    }

    // Get admin wallet
    const adminWallet = await Wallet.findOne({ userId: adminId });

    if (!adminWallet) {
      return res.status(404).json({
        success: false,
        error: 'Admin wallet not found',
      });
    }

    // Check if admin has enough collected commissions
    if (adminWallet.totalCommissionPaid < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${adminWallet.totalCommissionPaid} INR`,
      });
    }

    // Validate bank details
    if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      return res.status(400).json({
        success: false,
        error: 'Complete bank details are required',
      });
    }

    try {
      // Step 1: Create contact in RazorpayX
      console.log('[PAYOUT] Creating contact...');
      const contact = await createContact(
        bankDetails.accountHolderName,
        req.user.email,
        req.user.phone,
        'vendor'
      );

      // Step 2: Create fund account
      console.log('[PAYOUT] Creating fund account...');
      const fundAccount = await createFundAccount(
        contact.id,
        bankDetails.accountNumber,
        bankDetails.ifscCode,
        bankDetails.accountHolderName
      );

      // Step 3: Create payout
      console.log('[PAYOUT] Creating payout...');
      const razorpayPayout = await createPayout(
        fundAccount.id,
        amount,
        'INR',
        mode || 'IMPS',
        'payout'
      );

      // Step 4: Create payout record in database
      const payout = await Payout.create({
        adminId,
        amount,
        razorpayContactId: contact.id,
        razorpayFundAccountId: fundAccount.id,
        razorpayPayoutId: razorpayPayout.id,
        status: razorpayPayout.status.toUpperCase(),
        mode: mode || 'IMPS',
        bankDetails,
      });

      // Step 5: Debit from admin wallet (mark as withdrawn)
      await debitWallet(
        adminId,
        amount,
        'PAYOUT',
        `Payout to bank account ${bankDetails.accountNumber}`,
        razorpayPayout.id,
        { payoutId: payout._id, bankDetails }
      );

      console.log('[PAYOUT] Payout created successfully:', payout._id);

      res.status(200).json({
        success: true,
        message: 'Payout initiated successfully',
        data: {
          payout,
          razorpayPayoutId: razorpayPayout.id,
          status: razorpayPayout.status,
        },
      });
    } catch (razorpayError) {
      console.error('[PAYOUT] RazorpayX Error:', razorpayError);

      // In TEST mode, create a simulated payout
      if (process.env.NODE_ENV === 'development') {
        console.log('[PAYOUT] TEST MODE: Creating simulated payout');

        const payout = await Payout.create({
          adminId,
          amount,
          status: 'PROCESSED',
          mode: mode || 'IMPS',
          bankDetails,
          processedAt: new Date(),
        });

        await debitWallet(
          adminId,
          amount,
          'PAYOUT',
          `TEST MODE: Payout to bank account ${bankDetails.accountNumber}`,
          `test_payout_${Date.now()}`,
          { payoutId: payout._id, bankDetails, testMode: true }
        );

        return res.status(200).json({
          success: true,
          message: 'TEST MODE: Payout simulated successfully',
          data: {
            payout,
            testMode: true,
          },
        });
      }

      throw razorpayError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get payout status
 */
const getPayoutDetails = async (req, res, next) => {
  try {
    const { payoutId } = req.params;

    const payout = await Payout.findById(payoutId).populate('adminId', 'name email');

    if (!payout) {
      return res.status(404).json({
        success: false,
        error: 'Payout not found',
      });
    }

    // Fetch latest status from RazorpayX if payout ID exists
    if (payout.razorpayPayoutId) {
      try {
        const razorpayPayout = await getPayoutStatus(payout.razorpayPayoutId);
        
        // Update status if changed
        if (razorpayPayout.status.toUpperCase() !== payout.status) {
          payout.status = razorpayPayout.status.toUpperCase();
          
          if (razorpayPayout.status === 'processed') {
            payout.processedAt = new Date();
          }
          
          await payout.save();
        }
      } catch (error) {
        console.error('[PAYOUT] Error fetching status from RazorpayX:', error);
      }
    }

    res.status(200).json({
      success: true,
      data: payout,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all payouts (Admin only)
 */
const getAllPayouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.status = status.toUpperCase();

    const payouts = await Payout.find(query)
      .populate('adminId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Payout.countDocuments(query);

    // Calculate total payout amount
    const totalPayout = await Payout.aggregate([
      { $match: { status: 'PROCESSED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        payouts,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalPayouts: count,
        totalPayoutAmount: totalPayout[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAdminPayout,
  getPayoutDetails,
  getAllPayouts,
};
