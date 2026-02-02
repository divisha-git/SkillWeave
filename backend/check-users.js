import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

mongoose.connect('mongodb://localhost:27017/skillweave').then(async () => {
  console.log('Connected to MongoDB\n');
  
  const User = mongoose.connection.collection('users');
  
  // Get all users
  const users = await User.find({}).toArray();
  console.log(`Found ${users.length} users in database:\n`);
  
  for (const user of users) {
    console.log(`- ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Has Password: ${!!user.password}`);
    console.log(`  Has GoogleId: ${!!user.googleId}`);
    console.log(`  Password looks hashed: ${user.password ? user.password.startsWith('$2') : 'N/A'}`);
    console.log('');
  }
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
