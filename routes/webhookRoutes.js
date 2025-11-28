const express = require('express');
const { handleRazorpayWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Razorpay webhook endpoint
// NOTE: This route uses express.json() for body parsing
// Signature verification is done in the controller
router.post('/razorpay', express.json(), handleRazorpayWebhook);

module.exports = router;
