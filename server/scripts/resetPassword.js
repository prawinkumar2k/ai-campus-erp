/**
 * Reset user password script
 */

import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_db';
    console.log('Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const newPassword = '10000001';
    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    
    console.log('Updating user 10000001...');
    const result = await mongoose.connection.collection('users').updateOne(
      { username: '10000001' },
      { $set: { password: hashedPassword } }
    );

    console.log('Result:', result);
    
    if (result.modifiedCount > 0) {
      console.log('✅ Password updated successfully!');
      console.log('\n📋 Login Credentials:');
      console.log('   Username: 10000001');
      console.log('   Password: 10000001');
      console.log('   Role: Admin');
    } else {
      console.log('⚠️  No documents were modified');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();

