/**
 * Database Seeding Script
 * Populates initial roles and test users
 */

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  // Import models
  const { default: mongoose } = await import('mongoose');
  const { default: Role } = await import('../models/Role.js');
  const { default: User } = await import('../models/User.js');
  
  // Connect to database
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cms_db');
  console.log('✅ Connected to MongoDB');

  // Seed roles
  const rolesToCreate = [
    { role: 'Admin' },
    { role: 'Staff' },
    { role: 'HOD' },
    { role: 'Student' }
  ];

  console.log('\n📝 Seeding Roles...');
  for (const roleData of rolesToCreate) {
    const exists = await Role.findOne({ role: roleData.role });
    if (!exists) {
      await Role.create(roleData);
      console.log(`  ✓ Created role: ${roleData.role}`);
    } else {
      console.log(`  ✓ Role already exists: ${roleData.role}`);
    }
  }

  // Seed test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const usersToCreate = [
    {
      role: 'Admin',
      staffName: 'Administrator',
      staffId: 'ADM001',
      username: 'admin',
      password: hashedPassword,
      moduleAccess: [
        'dashboard', 'user_management', 'roles_permissions',
        'academic', 'admission', 'attendance',
        'examination', 'fee_management', 'reports',
        'administration', 'staff_management', 'transport'
      ]
    },
    {
      role: 'Staff',
      staffName: 'John Doe',
      staffId: 'STF001',
      username: 'johndoe',
      password: hashedPassword,
      moduleAccess: [
        'dashboard', 'attendance', 'academic',
        'examination', 'marks_entry'
      ]
    },
    {
      role: 'HOD',
      staffName: 'Jane Smith',
      staffId: 'HOD001',
      username: 'janesmith',
      password: hashedPassword,
      moduleAccess: [
        'dashboard', 'academic', 'examination',
        'reports', 'staff_management'
      ]
    }
  ];

  console.log('\n👥 Seeding Users...');
  for (const userData of usersToCreate) {
    const exists = await User.findOne({ username: userData.username });
    if (!exists) {
      await User.create(userData);
      console.log(`  ✓ Created user: ${userData.username} (${userData.role})`);
    } else {
      console.log(`  ✓ User already exists: ${userData.username}`);
    }
  }

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📋 Test Credentials:');
  console.log('  Admin:    admin / password123');
  console.log('  Staff:    johndoe / password123');
  console.log('  HOD:      janesmith / password123');

  process.exit(0);
} catch (error) {
  console.error('❌ Seeding error:', error.message);
  process.exit(1);
}
