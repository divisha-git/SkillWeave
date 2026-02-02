import mongoose from 'mongoose';
import User from './models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/byts';

const createAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing admin and create new one
    await User.deleteMany({ role: 'admin' });
    console.log('Deleted existing admin(s)');

    // Create admin user - password will be hashed by the pre-save hook
    const admin = new User({
      name: 'Admin',
      email: 'admin@byts.com',
      password: 'admin123',  // Will be hashed by pre-save hook
      role: 'admin'
    });

    await admin.save();
    console.log('\n=== ADMIN CREATED ===');
    console.log('Email: admin@byts.com');
    console.log('Password: admin123');
    console.log('=====================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
