import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/skillweave').then(async () => {
  console.log('Connected to MongoDB\n');
  
  const User = mongoose.connection.collection('users');
  
  // Remove test users I added (keep admin)
  const testEmails = [
    'student@test.com',
    'dhivyakk610@gmail.com', 
    'kkdhivyashri@gmail.com',
    'dhivyashrikk.23it@kongu.edu'
  ];
  
  for (const email of testEmails) {
    const result = await User.deleteOne({ email });
    if (result.deletedCount > 0) {
      console.log(`Deleted: ${email}`);
    }
  }
  
  console.log('\nRemaining users:');
  const users = await User.find({}).toArray();
  users.forEach(u => console.log(`- ${u.email} (${u.role})`));
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
