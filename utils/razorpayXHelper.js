const { razorpayXInstance } = require('../config/razorpay');

/**
 * Create contact in RazorpayX
 */
const createContact = async (name, email, phone, type = 'vendor') => {
  try {
    const contact = await razorpayXInstance.contacts.create({
      name,
      email,
      contact: phone,
      type,
      reference_id: `contact_${Date.now()}`,
    });

    return contact;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
};

/**
 * Create fund account for bank transfer
 */
const createFundAccount = async (contactId, accountNumber, ifsc, accountHolderName) => {
  try {
    const fundAccount = await razorpayXInstance.fundAccount.create({
      contact_id: contactId,
      account_type: 'bank_account',
      bank_account: {
        name: accountHolderName,
        ifsc: ifsc,
        account_number: accountNumber,
      },
    });

    return fundAccount;
  } catch (error) {
    console.error('Error creating fund account:', error);
    throw error;
  }
};

/**
 * Create payout
 */
const createPayout = async (fundAccountId, amount, currency = 'INR', mode = 'IMPS', purpose = 'payout') => {
  try {
    const payout = await razorpayXInstance.payouts.create({
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: amount * 100, // Convert to paise
      currency,
      mode,
      purpose,
      queue_if_low_balance: true,
      reference_id: `payout_${Date.now()}`,
      narration: 'Commission Payout',
    });

    return payout;
  } catch (error) {
    console.error('Error creating payout:', error);
    throw error;
  }
};

/**
 * Get payout status
 */
const getPayoutStatus = async (payoutId) => {
  try {
    const payout = await razorpayXInstance.payouts.fetch(payoutId);
    return payout;
  } catch (error) {
    console.error('Error fetching payout:', error);
    throw error;
  }
};

module.exports = {
  createContact,
  createFundAccount,
  createPayout,
  getPayoutStatus,
};
