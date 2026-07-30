// One-off script — same pattern as your other seed/backfill scripts.
// Run once after deploying the updated AdvanceIncentive schema + frontend.
//
// Backfills the new structured fields from the old free-text convention:
//   - incentive records: reason was "[Type] rest of reason" → split it into
//     incentiveType + reason
//   - advance records: recoveryMonths was only implied by notes text
//     ("₹X/month for N months" or "X in full next month") → parse it back out
//
// Usage: node backfillAdvanceIncentiveFields.js
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { AdvanceIncentive } from './models/extendedModels.js';

await connectDB();

// ── Incentives: pull "[Type] rest" back apart ──────────────────────────────
const incentives = await AdvanceIncentive.find({ type: 'incentive', incentiveType: { $in: [null, undefined] } });
let incentivesFixed = 0;
let incentivesSkipped = 0;

for (const doc of incentives) {
  const m = /^\[([^\]]+)\]\s*(.*)$/.exec(doc.reason || '');
  if (m) {
    doc.incentiveType = m[1];
    doc.reason = m[2];
    try {
      await doc.save();
      incentivesFixed++;
    } catch (err) {
      incentivesSkipped++;
      console.warn(`⚠️  Skipped incentive ${doc.recordId} (${doc.techName || 'unknown tech'}): ${err.message}`);
    }
  }
}

// ── Advances: parse recovery months back out of notes ──────────────────────
const advances = await AdvanceIncentive.find({ type: 'advance', recoveryMonths: { $in: [null, undefined] } });
let advancesFixed = 0;
let advancesSkipped = 0;

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
    doc.recoveryMonths = months;
    doc.recoveryPlan = months === 1 ? '1 month (full)' : `${months} months (split)`;
    try {
      await doc.save();
      advancesFixed++;
    } catch (err) {
      advancesSkipped++;
      console.warn(`⚠️  Skipped advance ${doc.recordId} (${doc.techName || 'unknown tech'}): ${err.message}`);
    }
  }
}

console.log(`\nBackfilled ${incentivesFixed} incentive record(s), ${advancesFixed} advance record(s).`);
if (incentivesSkipped || advancesSkipped) {
  console.log(`Skipped ${incentivesSkipped} incentive record(s), ${advancesSkipped} advance record(s) due to validation errors — see warnings above.`);
  console.log(`These need a manual look: either seed the missing option-set value, or fix the record's recoveryPlan/incentiveType by hand.`);
}

await mongoose.disconnect();