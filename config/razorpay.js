const Razorpay = require('razorpay');

// Standard Razorpay instance (for orders, payments)
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// RazorpayX instance (for payouts)
const razorpayXInstance = new Razorpay({
  key_id: process.env.RAZORPAYX_KEY_ID || process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAYX_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {
  razorpayInstance,
  razorpayXInstance,
};
