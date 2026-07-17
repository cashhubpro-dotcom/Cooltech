/**
 * seedRecoveryPlans.js — one-time seed for the Recovery Plan option set.
 * Run with:  node src/backend/scripts/seedRecoveryPlans.js
 * (adjust the relative import paths below if your scripts folder sits
 * somewhere else relative to models/db config)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { RecoveryPlan } from './models/optionSetModels.js';

dotenv.config();

const DEFAULTS = [
  { name: '1 month (full)',    description: 'Full amount recovered in the next payroll cycle' },
  { name: '2 months (split)',  description: 'Amount split evenly across 2 payroll cycles' },
  { name: '3 months (split)',  description: 'Amount split evenly across 3 payroll cycles' },
];

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGO_URI / MONGODB_URI in your .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB.');

  for (const plan of DEFAULTS) {
    const existing = await RecoveryPlan.findOne({ name: plan.name });
    if (existing) {
      console.log(`Skipping "${plan.name}" — already exists.`);
      continue;
    }
    const created = await RecoveryPlan.create(plan);
    console.log(`Created "${created.name}" (${created.typeId})`);
  }

  console.log('Recovery Plan seed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});