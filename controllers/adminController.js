const PendingCommission = require('../models/PendingCommission');
const Enrollment = require('../models/Enrollment');
const Wallet = require('../models/Wallet');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * Get all pending commissions
 */
const getPendingCommissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pendingCommissions = await PendingCommission.find({ status: 'PENDING' })
      .populate('resellerId', 'name email phone isBlocked')
      .populate({
        path: 'enrollmentId',
        populate: [
          { path: 'courseId', select: 'title price' },
          { path: 'studentId', select: 'name email' },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await PendingCommission.countDocuments({ status: 'PENDING' });

    // Calculate total pending amount
    const totalPending = await PendingCommission.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        commissions: pendingCommissions,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalPendingCommissions: count,
        totalPendingAmount: totalPending[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get commission statistics
 */
const getCommissionStats = async (req, res, next) => {
  try {
    // Total commissions paid
    const totalPaid = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: '$totalCommissionPaid' } } },
    ]);

    // Total commissions pending
    const totalPending = await Wallet.aggregate([
      { $group: { _id: null, total: { $sum: '$totalCommissionPending' } } },
    ]);

    // Total enrollments
    const totalEnrollments = await Enrollment.countDocuments({ paymentStatus: 'COMPLETED' });

    // Blocked resellers
    const blockedResellers = await User.countDocuments({ role: 'RESELLER', isBlocked: true });

    // Total resellers
    const totalResellers = await User.countDocuments({ role: 'RESELLER' });

    // Admin wallet (total collected commissions)
    const adminWallet = await Wallet.aggregate([
      { $group: { _id: null, totalCollected: { $sum: '$totalCommissionPaid' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCommissionPaid: totalPaid[0]?.total || 0,
        totalCommissionPending: totalPending[0]?.total || 0,
        totalEnrollments,
        blockedResellers,
        totalResellers,
        adminWalletBalance: adminWallet[0]?.totalCollected || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reseller-wise commission breakdown
 */
const getResellerCommissionBreakdown = async (req, res, next) => {
  try {
    const breakdown = await Wallet.find({ userId: { $ne: null } })
      .populate('userId', 'name email phone isBlocked role')
      .select('userId balance totalCommissionPaid totalCommissionPending totalEarned totalTopUp')
      .lean();

    // Filter only resellers
    const resellerBreakdown = breakdown.filter(w => w.userId?.role === 'RESELLER');

    res.status(200).json({
      success: true,
      data: resellerBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role } = req.query;

    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalUsers: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Block/Unblock user (Admin only)
 */
const toggleUserBlock = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isBlocked } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin dashboard stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    // Total users by role
    const userStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    // Total courses
    const totalCourses = await require('../models/Course').countDocuments();

    // Total revenue (all enrollments)
    const revenueStats = await Enrollment.aggregate([
      { $match: { paymentStatus: 'COMPLETED' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$coursePrice' },
          totalCommissions: { $sum: '$adminCommission' },
          totalEnrollments: { $sum: 1 },
        },
      },
    ]);

    // Recent enrollments
    const recentEnrollments = await Enrollment.find({ paymentStatus: 'COMPLETED' })
      .populate('courseId', 'title')
      .populate('studentId', 'name email')
      .populate('resellerId', 'name')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        userStats,
        totalCourses,
        revenue: revenueStats[0] || { totalRevenue: 0, totalCommissions: 0, totalEnrollments: 0 },
        recentEnrollments,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingCommissions,
  getCommissionStats,
  getResellerCommissionBreakdown,
  getAllUsers,
  toggleUserBlock,
  getDashboardStats,
};
