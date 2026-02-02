import mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/skillweave').then(async () => {
  console.log('Connected to MongoDB\n');
  
  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log(`Total users in DB: ${users.length}\n`);
  
  users.forEach(u => {
    console.log(`Email: ${u.email}`);
    console.log(`  Name: ${u.name}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Has Password: ${!!u.password}`);
    console.log('');
  });
  
  mongoose.disconnect();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
