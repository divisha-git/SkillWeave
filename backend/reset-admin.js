import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

mongoose.connect('mongodb://localhost:27017/skillweave').then(async () => {
  console.log('Connected to MongoDB');
  
  const User = mongoose.connection.collection('users');
  
  // Find admin
  const admin = await User.findOne({ email: 'admin@byts.com' });
  console.log('Admin user:', admin ? 'FOUND' : 'NOT FOUND');
  
  if (admin) {
    console.log('Current admin:', { email: admin.email, role: admin.role, hasPassword: !!admin.password });
    
    // Reset password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await User.updateOne({ email: 'admin@byts.com' }, { $set: { password: hashedPassword } });
    console.log('Password has been reset to: admin123');
  } else {
    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await User.insertOne({
      name: 'Admin',
      email: 'admin@byts.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Admin user created with email: admin@byts.com, password: admin123');
  }
  
  mongoose.disconnect();
  console.log('Done!');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
