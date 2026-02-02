import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

mongoose.connect('mongodb://localhost:27017/skillweave').then(async () => {
  console.log('Connected to MongoDB\n');
  
  const User = mongoose.connection.collection('users');
  
  // Add sample users for testing
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  const usersToAdd = [
    {
      name: 'Test Student',
      email: 'student@test.com',
      password: hashedPassword,
      role: 'student',
      department: 'CSE',
      year: '3rd',
      studentId: 'STU001',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Dhivya',
      email: 'dhivyakk610@gmail.com',
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
      email: 'kkdhivyashri@gmail.com',
      password: hashedPassword,
      role: 'student',
      department: 'IT',
      year: '3rd',
      studentId: 'STU003',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Dhivyashri College',
      email: 'dhivyashrikk.23it@kongu.edu',
      password: hashedPassword,
      role: 'student',
      department: 'IT',
      year: '3rd',
      studentId: 'STU004',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  for (const user of usersToAdd) {
    const exists = await User.findOne({ email: user.email });
    if (exists) {
      // Update with password if missing
      if (!exists.password) {
        await User.updateOne({ email: user.email }, { $set: { password: hashedPassword } });
        console.log(`Updated password for: ${user.email}`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    } else {
      await User.insertOne(user);
      console.log(`Created user: ${user.email}`);
    }
  }
  
  console.log('\n--- All users can now login with: ---');
  console.log('Password: password123');
  console.log('OR use "Continue with Google" with the same email\n');
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
