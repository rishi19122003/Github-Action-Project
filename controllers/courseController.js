const Course = require('../models/Course');

/**
 * Create new course (Admin only)
 */
const createCourse = async (req, res, next) => {
  try {
    const { title, description, price, adminCommission, commissionType, category, duration, thumbnail } = req.body;

    const course = await Course.create({
      title,
      description,
      price,
      adminCommission,
      commissionType: commissionType || 'FIXED',
      category,
      duration,
      thumbnail,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all courses
 */
const getAllCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, isActive } = req.query;

    const query = {};
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        courses,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalCourses: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single course
 */
const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update course (Admin only)
 */
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete course (Admin only)
 */
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourse,
  updateCourse,
  deleteCourse,
};
