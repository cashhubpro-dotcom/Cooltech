// scripts/seedIncentiveTypes.js
// ─────────────────────────────────────────────────────────────────────────────
// Seeds the IncentiveType option set with its default values so the
// "INCENTIVE TYPE" DynamicSelect in NewRequestModal has real DB-backed
// options instead of just the frontend fallback array. Safe to re-run —
// checks by `name` first and skips anything that already exists.
//
// Defaults mirror INCENTIVE_TYPES in AdvanceIncentivePage.jsx / the
// useIncentiveTypes() fallback in useOptionSets.js, so nothing changes
// visually — the data just moves from frontend fallback into the real DB.
//
// Run with:  node scripts/seedIncentiveTypes.js
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';
import 'dotenv/config';
import { IncentiveType } from './models/optionSetModels.js'; 

const DEFAULTS = ['Performance', 'Customer Rating', 'Special Duty', 'Referral', 'Project Bonus'];

async function seed() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('✗ No MONGODB_URI / MONGO_URI found in env. Set it before running this script.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✓ Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const name of DEFAULTS) {
    const existing = await IncentiveType.findOne({ name });
    if (existing) {
      console.log(`  · skipped (already exists): "${name}"`);
      skipped++;
      continue;
    }
    // Using .create() (not a raw upsert) so the schema's pre('save') hook
    // still generates the typeId (e.g. INT-001) correctly.
    await IncentiveType.create({ name, isActive: true });
    console.log(`  + created: "${name}"`);
    created++;
  }

  console.log(`\n✓ Done. ${created} created, ${skipped} already existed.`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('✗ Seed failed:', err);
  process.exit(1);
});