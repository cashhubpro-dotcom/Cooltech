// Dry-run / diagnostic script — run this BEFORE backfillAdvanceIncentiveFields.js.
//
// It doesn't write anything. It just parses the same "recoveryPlan" strings
// your backfill script would generate from notes text, and tells you which
// of those values are missing from the RecoveryPlan option-set collection
// (the thing advanceIncentiveSchema.recoveryPlan validates against).
//
// Usage: node checkMissingRecoveryPlans.js

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { AdvanceIncentive } from './models/extendedModels.js';
import { RecoveryPlan } from './models/optionSetModels.js';

await connectDB();

const advances = await AdvanceIncentive.find({
  type: 'advance',
  recoveryMonths: { $in: [null, undefined] },
});

// Build the same recoveryPlan string the backfill script would produce,
// but just count distinct values instead of saving anything.
const generated = new Map(); // recoveryPlan string -> count of docs that would use it

for (const doc of advances) {
  const notes = doc.notes || '';
  let months = null;

  if (/in full next month/i.test(notes)) {
    months = 1;
  } else {
    const m = /for (\d+) months?/i.exec(notes);
    if (m) months = Number(m[1]);
  }

  if (months) {
    const plan = months === 1 ? '1 month (full)' : `${months} months (split)`;
    generated.set(plan, (generated.get(plan) || 0) + 1);
  }
}

console.log(`\nFound ${advances.length} advance record(s) missing recoveryMonths.`);
console.log(`Backfill would generate ${generated.size} distinct recoveryPlan value(s):\n`);

// Check each generated value against the live RecoveryPlan option set.
const existing = await RecoveryPlan.find({ isActive: true, isDeleted: false }, 'name');
const existingNames = new Set(existing.map((r) => r.name));

const missing = [];
const valid = [];

for (const [plan, count] of [...generated.entries()].sort()) {
  if (existingNames.has(plan)) {
    valid.push({ plan, count });
  } else {
    missing.push({ plan, count });
  }
}

if (valid.length) {
  console.log('✅ Already valid (exist in RecoveryPlan):');
  for (const { plan, count } of valid) {
    console.log(`   "${plan}"  — ${count} record(s)`);
  }
  console.log('');
}

if (missing.length) {
  console.log('❌ MISSING from RecoveryPlan (backfill will fail validation on these):');
  for (const { plan, count } of missing) {
    console.log(`   "${plan}"  — ${count} record(s)`);
  }
  console.log(`\nTo seed these as active options, you could run something like:\n`);
  console.log(`  await RecoveryPlan.insertMany([`);
  for (const { plan } of missing) {
    console.log(`    { name: '${plan}', isActive: true },`);
  }
  console.log(`  ]);\n`);
} else {
  console.log('Nothing missing — every generated value already exists in RecoveryPlan.\n');
}

await mongoose.disconnect();