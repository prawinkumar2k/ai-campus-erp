/**
 * Fix all admin/staff passwords to known values for demo
 */

import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_db';
    console.log('Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Reset 'admin' user password to 'admin123'
    const adminPassword = 'admin123';
    const adminHash = await bcryptjs.hash(adminPassword, 10);
    
    const adminResult = await db.collection('users').updateOne(
      { username: 'admin' },
      { $set: { password: adminHash } }
    );
    console.log(`✅ admin user → password: ${adminPassword} | modified: ${adminResult.modifiedCount}`);

    // Reset '10000001' user password to 'admin123'
    const superAdminResult = await db.collection('users').updateOne(
      { username: '10000001' },
      { $set: { password: adminHash } }
    );
    console.log(`✅ 10000001 user → password: ${adminPassword} | modified: ${superAdminResult.modifiedCount}`);

    // Also set all students' passwords to 'student123'
    const studentPassword = 'student123';
    const studentResult = await db.collection('students').updateMany(
      {},
      { $set: { password: studentPassword } }
    );
    console.log(`✅ All students → password: ${studentPassword} | modified: ${studentResult.modifiedCount}`);

    console.log('\n📋 Demo Login Credentials:');
    console.log('   Admin: username=admin, password=admin123, role=Admin');
    console.log('   Admin2: username=10000001, password=admin123, role=Admin');
    console.log('   Student: username=560023529001, password=student123, role=Student');

    // Quick verify
    const adminUser = await db.collection('users').findOne({ username: 'admin' });
    const match = await bcryptjs.compare(adminPassword, adminUser.password);
    console.log(`\n🔍 Verification: admin/admin123 bcrypt match = ${match}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
