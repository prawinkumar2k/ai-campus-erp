import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cms_db';

mongoose.connect(mongoUri)
  .then(async () => {
    const db = mongoose.connection.db;
    
    const firstUser = await db.collection('users').findOne({});
    console.log('--- FIRST USER ---');
    console.log(JSON.stringify(firstUser, null, 2));
    
    const firstStudent = await db.collection('students').findOne({});
    console.log('--- FIRST STUDENT ---');
    console.log(JSON.stringify(firstStudent, null, 2));

    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
