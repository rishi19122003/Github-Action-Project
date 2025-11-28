const express = require('express');
const { body } = require('express-validator');
const {
  createCourse,
  getAllCourses,
  getCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middlewares/auth');
const validateRequest = require('../middlewares/validateRequest');

const router = express.Router();

// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourse);

// Protected routes (Admin only)
router.post(
  '/',
  protect,
  authorize('ADMIN'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('adminCommission').isNumeric().withMessage('Admin commission must be a number'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  validateRequest,
  createCourse
);

router.put('/:id', protect, authorize('ADMIN'), updateCourse);
router.delete('/:id', protect, authorize('ADMIN'), deleteCourse);

module.exports = router;
