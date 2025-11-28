require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const { createAdminUser } = require('./utils/seedAdmin');

const app = express();

// Connect to MongoDB
connectDB();

// Create default admin user
createAdminUser();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const walletRoutes = require('./routes/walletRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const adminRoutes = require('./routes/adminRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const publicRoutes = require('./routes/publicRoutes');
const testRoutes = require('./routes/testRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payout', payoutRoutes);
app.use('/api/public', publicRoutes);

// TEST ROUTES - Remove in production
if (process.env.NODE_ENV === 'development') {
  app.use('/api/test', testRoutes);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Course Reseller Platform - Server Started                ║
║  Port: ${PORT}                                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║  MongoDB: Connected                                        ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
