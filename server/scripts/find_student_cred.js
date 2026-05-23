import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_db');
  const student = await mongoose.connection.db.collection('students').findOne({});
  console.log('STUDENT:', JSON.stringify(student, null, 2));
  
  const user = await mongoose.connection.db.collection('users').findOne({});
  console.log('USER:', JSON.stringify(user, null, 2));

  await mongoose.disconnect();
};

run().catch(console.error);
