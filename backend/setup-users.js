import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

mongoose.connect('mongodb://localhost:27017/skillweave').then(async () => {
  console.log('Connected to MongoDB\n');
  
  const User = mongoose.connection.collection('users');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  // Add users with your Gmail addresses
  const users = [
    {
      name: 'Dhivya',
      email: 'dhivyakk610@gmail.com',
      password: hashedPassword,
      role: 'student',
      department: 'IT',
      year: '3rd',
      studentId: 'STU001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Dhivyashri',
      email: 'kkdhivyashri@gmail.com',
      password: hashedPassword,
      role: 'student',
      department: 'IT',
      year: '3rd',
      studentId: 'STU002',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Dhivyashri KK',
      email: 'dhivyashrikk.23it@kongu.edu',
      password: hashedPassword,
      role: 'student',
      department: 'IT',
      year: '3rd',
      studentId: 'STU003',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  for (const user of users) {
    try {
      await User.insertOne(user);
      console.log('Added:', user.email);
    } catch (e) {
      if (e.code === 11000) {
        console.log('Already exists:', user.email);
      } else {
        console.log('Error adding', user.email, e.message);
      }
    }
  }
  
  console.log('\n=== LOGIN CREDENTIALS ===');
  console.log('All users password: password123');
  console.log('Admin: admin@byts.com / admin123');
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
