import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_db');
  
  // Set password for all students to 'password123'
  const result = await mongoose.connection.db.collection('students').updateMany(
    {},
    { $set: { password: 'password123' } }
  );
  
  console.log(`Updated ${result.modifiedCount} students with password: password123`);
  
  const sample = await mongoose.connection.db.collection('students').findOne({});
  console.log('Sample student registerNumber:', sample.registerNumber);
  console.log('Sample student password:', sample.password);

  await mongoose.disconnect();
};

run().catch(console.error);
