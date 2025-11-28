const crypto = require('crypto');

/**
 * Verify Razorpay webhook signature
 */
const verifyWebhookSignature = (webhookBody, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(webhookBody))
    .digest('hex');

  return expectedSignature === signature;
};

/**
 * Verify Razorpay payment signature (for frontend verification)
 */
const verifyPaymentSignature = (orderId, paymentId, signature, secret) => {
  const body = orderId + '|' + paymentId;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = {
  verifyWebhookSignature,
  verifyPaymentSignature,
};
