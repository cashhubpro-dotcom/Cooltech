// seeds/seedReviews.js
// Seeds the 6 sample Google reviews the Reviews & Reputation page used to show.
//
//   node seeds/seedReviews.js            → insert (skips any that already exist, safe to re-run)
//   node seeds/seedReviews.js --remove   → delete exactly these sample reviews
//
// Run from the backend root (same folder as server.js) so ./config and ./models resolve.
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { Review } from './models/extendedModels.js';

const at = (ymd) => new Date(`${ymd}T10:00:00+05:30`);

const SAMPLE = [
  {
    customerName: 'Priya M.',
    rating: 5,
    date: at('2026-03-02'),
    reviewText: 'Excellent service! Ramesh came on time, fixed the gas leak in an hour. Very professional and affordable. Highly recommend CoolTech!',
    response: "Thank you Priya! We're glad Ramesh could help quickly. See you for the next service!",
  },
  {
    customerName: 'Sunset Hotel GM',
    rating: 4,
    date: at('2026-02-28'),
    reviewText: 'Good service team. They handle all 6 of our ACs under AMC. Reliable and responsive. Minor delay on one visit but otherwise excellent.',
    response: 'Thank you for the kind words! We noted the delay and have improved scheduling. Your business means a lot to us.',
  },
  {
    customerName: 'Rajiv Sharma',
    rating: 5,
    date: at('2026-02-22'),
    reviewText: 'Got 2 ACs installed. Very neat work, clean wiring and pipework. Price was fair. Will definitely use again for servicing.',
  },
  {
    customerName: 'Anonymous',
    rating: 2,
    date: at('2026-02-18'),
    reviewText: "Technician arrived late and didn't explain what was done. The repair didn't last long either. Expected better from a known company.",
    response: "We sincerely apologise for this experience. We've addressed this with our team. Please contact us directly and we'll make it right.",
  },
  {
    customerName: 'Dr. Suresh Nair',
    rating: 5,
    date: at('2026-02-15'),
    reviewText: 'Been with CoolTech for 3 years. Best AC service in the city. Arjun is always thorough and my clinic is always comfortable.',
    response: "Dr. Nair, thank you for your loyalty! It's always a pleasure serving your clinic. We'll keep up the good work!",
  },
  {
    customerName: 'Meena Gupta',
    rating: 4,
    date: at('2026-02-10'),
    reviewText: 'Quick response to emergency call. AC was not working at night and they sent a technician next morning. Good service.',
  },
];

const run = async () => {
  await connectDB();
  const remove = process.argv.includes('--remove');
  let added = 0, skipped = 0, removed = 0;

  // Assign reviewIds explicitly (highest existing + 1) so a gap left by earlier
  // hard-deletes can't collide with the count-based generator in the model.
  const existing = await Review.find({}, 'reviewId').lean();
  let n = existing.reduce((m, r) => Math.max(m, parseInt(String(r.reviewId).split('-')[1], 10) || 0), 0);

  for (const s of SAMPLE) {
    const key = { platform: 'Google', customerName: s.customerName, reviewText: s.reviewText };

    if (remove) {
      const r = await Review.deleteMany(key);
      removed += r.deletedCount;
      continue;
    }
    if (await Review.exists({ ...key, isDeleted: { $ne: true } })) { skipped++; continue; }

    await new Review({
      ...s,
      reviewId: `REV-${String(++n).padStart(4, '0')}`,
      platform: 'Google',
      isPublic: true,
      ...(s.response ? { respondedAt: new Date(s.date.getTime() + 864e5) } : {}),
    }).save();
    added++;
  }

  console.log(remove
    ? `🗑️  Removed ${removed} sample review(s).`
    : `✅ Reviews seeded — added ${added}, skipped ${skipped} already present.`);
  await mongoose.connection.close();
};

run().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});