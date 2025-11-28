const express = require('express');
const { body } = require('express-validator');
const {
  createCourseOrder,
  getEnrollmentDetails,
  getMyEnrollments,
  getResellerEnrollments,
} = require('../controllers/enrollmentController');
const { protect, authorize, checkResellerBlocked } = require('../middlewares/auth');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

// Create course purchase order (Student only, checks if reseller is blocked)
router.post(
  '/create-order',
  protect,
  authorize('STUDENT'),
  [
    body('courseId').notEmpty().withMessage('Course ID is required'),
    body('resellerId').notEmpty().withMessage('Reseller ID is required'),
  ],
  validateRequest,
  createCourseOrder
);

// Get enrollment details
router.get('/:enrollmentId', protect, getEnrollmentDetails);

// Get my enrollments (Student)
router.get('/my/enrollments', protect, authorize('STUDENT'), getMyEnrollments);

// Get reseller enrollments (Reseller or Admin)
router.get('/reseller/enrollments', protect, authorize('RESELLER', 'ADMIN'), getResellerEnrollments);
router.get('/reseller/:resellerId/enrollments', protect, authorize('ADMIN'), getResellerEnrollments);

module.exports = router;
