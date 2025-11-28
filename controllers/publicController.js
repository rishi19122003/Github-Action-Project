const User = require('../models/User');

/**
 * Get all active resellers (public endpoint for students)
 */
const getActiveResellers = async (req, res, next) => {
  try {
    const resellers = await User.find({ 
      role: 'RESELLER',
      isActive: true,
      isBlocked: false 
    })
    .select('_id name email')
    .lean();

    res.status(200).json({
      success: true,
      data: resellers,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveResellers,
};
