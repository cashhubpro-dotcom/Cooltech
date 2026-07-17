import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Customer from './models/Customer.js';

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // ── Admin ──────────────────────────────────────────────────────────────
  if (!(await User.findOne({ email: 'admin@cooltech.com' }))) {
    await User.create({
      name: 'Admin User',
      email: 'admin@cooltech.com',
      password: 'Admin@123',   // pre-save hook hashes it
      role: 'admin',
      isActive: true,
    });
    console.log('Seeded admin → admin@cooltech.com / Admin@123');
  } else {
    console.log('Admin already exists, skipping.');
  }

  // ── Technician ─────────────────────────────────────────────────────────
  if (!(await User.findOne({ email: 'tech@cooltech.com' }))) {
    await User.create({
      name: 'Raj Patel',
      email: 'tech@cooltech.com',
      password: 'Tech@1234',
      role: 'technician',
      isActive: true,
    });
    console.log('Seeded technician → tech@cooltech.com / Tech@1234');
  } else {
    console.log('Technician already exists, skipping.');
  }

  // ── Client ──────────────────────────────
  if (!(await User.findOne({ email: 'client@cooltech.com' }))) {
    await User.create({
      name: 'Sunrise Apartments',
      email: 'client@cooltech.com',
      password: 'client123',
      role: 'client',
      isActive: true,
    });
    console.log('Seeded client → client@cooltech.com / client123');
  } else {
    console.log('Client user already exists, skipping.');
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });