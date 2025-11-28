const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { verifyWebhookSignature } = require('../utils/razorpayHelper');
const { processCommissionDeduction } = require('../utils/walletHelper');
const { creditWallet, clearPendingCommissions } = require('../utils/walletHelper');

/**
 * Handle Razorpay webhook events
 * This handles BOTH course purchase payments and wallet top-up payments
 */
const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    // TEMPORARILY DISABLED FOR POSTMAN TESTING - ENABLE IN PRODUCTION!
    if (process.env.NODE_ENV === 'production') {
      const isValid = verifyWebhookSignature(req.body, webhookSignature, webhookSecret);

      if (!isValid) {
        console.error('Invalid webhook signature');
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook signature',
        });
      }
    } else {
      console.log('[WEBHOOK] Signature verification SKIPPED in development mode');
    }

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    console.log(`[WEBHOOK] Event received: ${event}`);
    console.log(`[WEBHOOK] Order ID: ${payload.order_id}`);

    // Handle payment.captured event
    if (event === 'payment.captured') {
      const { order_id, id: paymentId, amount, status, notes } = payload;

      // Determine if this is a course purchase or wallet top-up
      const purpose = notes?.purpose || 'UNKNOWN';

      if (purpose === 'COURSE_PURCHASE') {
        // COURSE PURCHASE FLOW
        await handleCoursePurchasePayment(order_id, paymentId, amount, notes);
      } else if (purpose === 'WALLET_TOP_UP') {
        // WALLET TOP-UP FLOW
        await handleWalletTopUpPayment(order_id, paymentId, amount, notes);
      } else {
        console.error(`[WEBHOOK] Unknown purpose: ${purpose}`);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
      });
    }

    // Handle payment.failed event
    if (event === 'payment.failed') {
      const { order_id, notes } = payload;
      const purpose = notes?.purpose || 'UNKNOWN';

      if (purpose === 'COURSE_PURCHASE') {
        const enrollment = await Enrollment.findOne({ razorpayOrderId: order_id });
        if (enrollment) {
          enrollment.paymentStatus = 'FAILED';
          await enrollment.save();
          console.log(`[WEBHOOK] Enrollment marked as FAILED: ${enrollment._id}`);
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    // Always return 200 to Razorpay to avoid retries
    res.status(200).json({ success: false, error: error.message });
  }
};

/**
 * Handle course purchase payment
 * AUTO-DEDUCT COMMISSION FROM RESELLER WALLET
 */
const handleCoursePurchasePayment = async (orderId, paymentId, amount, notes) => {
  try {
    console.log(`[WEBHOOK] Processing course purchase: ${orderId}`);

    // Find enrollment by order ID
    const enrollment = await Enrollment.findOne({ razorpayOrderId: orderId });

    if (!enrollment) {
      console.error(`[WEBHOOK] Enrollment not found for order: ${orderId}`);
      return;
    }

    // Update enrollment with payment details
    enrollment.razorpayPaymentId = paymentId;
    enrollment.paymentStatus = 'COMPLETED';
    enrollment.enrolledAt = new Date();
    await enrollment.save();

    console.log(`[WEBHOOK] Enrollment updated: ${enrollment._id}`);

    // Get course details
    const course = await Course.findById(enrollment.courseId);

    if (!course) {
      console.error(`[WEBHOOK] Course not found: ${enrollment.courseId}`);
      return;
    }

    // AUTO-DEDUCT COMMISSION FROM RESELLER WALLET
    console.log(`[WEBHOOK] Deducting commission: ${enrollment.adminCommission} from reseller: ${enrollment.resellerId}`);

    const commissionResult = await processCommissionDeduction(
      enrollment._id,
      enrollment.resellerId,
      enrollment.adminCommission,
      course.title
    );

    // Update enrollment commission status
    enrollment.commissionStatus = commissionResult.commissionStatus;
    enrollment.commissionDeductedAt = new Date();
    enrollment.isActive = true; // Activate enrollment
    await enrollment.save();

    console.log(`[WEBHOOK] Commission processed: ${commissionResult.commissionStatus}`);
    console.log(`[WEBHOOK] Enrollment activated: ${enrollment._id}`);
  } catch (error) {
    console.error('[WEBHOOK] Error processing course purchase:', error);
    throw error;
  }
};

/**
 * Handle wallet top-up payment
 * CREDIT RESELLER WALLET AND CLEAR PENDING COMMISSIONS
 */
const handleWalletTopUpPayment = async (orderId, paymentId, amount, notes) => {
  try {
    console.log(`[WEBHOOK] Processing wallet top-up: ${orderId}`);

    const userId = notes.userId;
    const amountInRupees = amount / 100; // Convert from paise to rupees

    // Credit wallet
    const { wallet, transaction } = await creditWallet(
      userId,
      amountInRupees,
      'TOP_UP',
      `Wallet top-up via Razorpay`,
      paymentId,
      { orderId, paymentId, method: 'RAZORPAY' }
    );

    console.log(`[WEBHOOK] Wallet credited: ${amountInRupees} to user: ${userId}`);

    // Try to clear pending commissions
    const clearResult = await clearPendingCommissions(userId);

    if (clearResult.success) {
      console.log(`[WEBHOOK] Pending commissions cleared for user: ${userId}`);
    } else {
      console.log(`[WEBHOOK] Pending commissions not cleared: ${clearResult.message}`);
    }
  } catch (error) {
    console.error('[WEBHOOK] Error processing wallet top-up:', error);
    throw error;
  }
};

module.exports = {
  handleRazorpayWebhook,
};
