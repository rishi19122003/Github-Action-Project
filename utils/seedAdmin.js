const User = require('../models/User');
const Wallet = require('../models/Wallet');

/**
 * Create default admin user if not exists
 */
const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'ADMIN' });

    if (!adminExists) {
      const admin = await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@platform.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        phone: '9999999999',
        role: 'ADMIN',
        isActive: true,
      });

      // Create admin wallet
      await Wallet.create({
        userId: admin._id,
        balance: 0,
      });

      console.log('✅ Default admin user created');
      console.log(`   Email: ${admin.email}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    }
  } catch (error) {
    console.error('Error creating admin user:', error.message);
  }
};

module.exports = { createAdminUser };
