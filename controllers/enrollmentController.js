const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { razorpayInstance } = require('../config/razorpay');

/**
 * Create Razorpay order for course purchase
 * IMPORTANT: Money goes directly to RESELLER's Razorpay account
 * In production, use Razorpay Route/Transfer API
 */
const createCourseOrder = async (req, res, next) => {
  try {
    const { courseId, resellerId } = req.body;
    const studentId = req.user.id;

    // Validate course
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Course not found or inactive',
      });
    }

    // Validate reseller
    const reseller = await User.findById(resellerId);
    if (!reseller || reseller.role !== 'RESELLER') {
      return res.status(404).json({
        success: false,
        error: 'Reseller not found',
      });
    }

    // Check if reseller is blocked
    if (reseller.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'This reseller is currently blocked. Please contact support.',
      });
    }

    // Check if student already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      courseId,
      paymentStatus: 'COMPLETED',
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        error: 'You are already enrolled in this course',
      });
    }

    // Calculate commission
    let adminCommission = course.adminCommission;
    if (course.commissionType === 'PERCENTAGE') {
      adminCommission = (course.price * course.adminCommission) / 100;
    }

    const resellerEarning = course.price - adminCommission;

    // Create Razorpay order
    // NOTE: In production with Razorpay Route API, you'd specify transfers here
    const options = {
      amount: course.price * 100, // Convert to paise
      currency: 'INR',
      receipt: `crs_${Date.now().toString().slice(-10)}`, // Max 40 chars
      notes: {
        purpose: 'COURSE_PURCHASE',
        courseId: courseId.toString(),
        resellerId: resellerId.toString(),
        studentId: studentId.toString(),
        studentEmail: req.user.email,
        adminCommission: adminCommission,
        resellerEarning: resellerEarning,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    // Create enrollment record
    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      resellerId,
      coursePrice: course.price,
      adminCommission,
      resellerEarning,
      razorpayOrderId: order.id,
      paymentStatus: 'PENDING',
    });

    res.status(200).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        enrollmentId: enrollment._id,
        course: {
          title: course.title,
          price: course.price,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get enrollment details
 */
const getEnrollmentDetails = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;

    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('courseId', 'title description price thumbnail')
      .populate('resellerId', 'name email')
      .populate('studentId', 'name email');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        error: 'Enrollment not found',
      });
    }

    // Check authorization
    if (
      req.user.role !== 'ADMIN' &&
      enrollment.studentId._id.toString() !== req.user.id &&
      enrollment.resellerId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this enrollment',
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get my enrollments (Student)
 */
const getMyEnrollments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { studentId: req.user.id };
    if (status) query.paymentStatus = status;

    const enrollments = await Enrollment.find(query)
      .populate('courseId', 'title price thumbnail category')
      .populate('resellerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Enrollment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        enrollments,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalEnrollments: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reseller enrollments (Reseller)
 */
const getResellerEnrollments = async (req, res, next) => {
  try {
    const resellerId = req.user.role === 'ADMIN' ? req.params.resellerId : req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { resellerId };
    if (status) query.paymentStatus = status;

    const enrollments = await Enrollment.find(query)
      .populate('courseId', 'title price')
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Enrollment.countDocuments(query);

    // Calculate total earnings
    const stats = await Enrollment.aggregate([
      { $match: { resellerId: query.resellerId, paymentStatus: 'COMPLETED' } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$resellerEarning' },
          totalCommissions: { $sum: '$adminCommission' },
          totalSales: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        enrollments,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalEnrollments: count,
        stats: stats[0] || { totalEarnings: 0, totalCommissions: 0, totalSales: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourseOrder,
  getEnrollmentDetails,
  getMyEnrollments,
  getResellerEnrollments,
};
