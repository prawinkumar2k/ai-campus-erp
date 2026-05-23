/**
 * Add Roles and Auth to existing cms_db users
 */

import bcryptjs from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/cms_db';
    console.log('Connecting to:', mongoUri);
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Ensure roles exist
    const rolesCollection = mongoose.connection.collection('roles');
    const rolesToCreate = [
      { role: 'Admin' },
      { role: 'Staff' },
      { role: 'HOD' },
      { role: 'Student' }
    ];

    console.log('\n📝 Creating roles...');
    for (const role of rolesToCreate) {
      const exists = await rolesCollection.findOne({ role: role.role });
      if (!exists) {
        await rolesCollection.insertOne(role);
        console.log(`  ✓ Created: ${role.role}`);
      } else {
        console.log(`  ✓ Exists: ${role.role}`);
      }
    }

    //Update all users to have proper passwords if missing
    const usersCollection = mongoose.connection.collection('users');
    const allUsers = await usersCollection.find({}).toArray();
    
    console.log(`\n👥 Processing ${allUsers.length} users...`);
    
    let updated = 0;
    for (const user of allUsers) {
      // If password doesn't look like bcrypt (doesn't start with $2), hash it
      if (!user.password || !user.password.startsWith('$2')) {
        const plainPassword = user.password || user.username; // Use existing password or username as fallback
        const hashedPassword = await bcryptjs.hash(plainPassword, 10);
        
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );
        updated++;
        console.log(`  ✓ Updated: ${user.username} (${user.staffName})`);
      } else {
        console.log(`  ✓ Already bcrypted: ${user.username}`);
      }
    }

    console.log(`\n✅ Seeding completed!`);
    console.log(`   - Roles ensured`);
    console.log(`   - ${updated} passwords updated`);
    console.log(`\n📋 Available Login Credentials:`);
    console.log(`   Username: 10000001`);
    console.log(`   Password: 10000001 (or original password if was plain text)`);
    console.log(`   Role: Admin`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
