// One-off: gives EXISTING won leads a wonAt date and EXISTING resolved/closed
// complaints a resolvedAt date, so "Won This Month" / "Resolved this month" are
// right for records created before these dates were tracked.
// It uses each record's last-updated time as the best available date.
//
// Run once from the backend folder, after deploying the new models/index.js:
//     node scripts/backfill-dates.js
// Safe to run again: it only touches records that have no date yet.
import 'dotenv/config';
import mongoose from 'mongoose';
import { Lead, Complaint } from './models/index.js';

await mongoose.connect(process.env.MONGO_URI);

const leads = await Lead.collection.updateMany(
  { stage: 'won', wonAt: { $in: [null, undefined] } },
  [{ $set: { wonAt: '$updatedAt' } }]
);
const complaints = await Complaint.collection.updateMany(
  { status: { $in: ['resolved', 'closed'] }, resolvedAt: { $in: [null, undefined] } },
  [{ $set: { resolvedAt: '$updatedAt' } }]
);

console.log(`Leads updated: ${leads.modifiedCount}`);
console.log(`Complaints updated: ${complaints.modifiedCount}`);
await mongoose.disconnect();