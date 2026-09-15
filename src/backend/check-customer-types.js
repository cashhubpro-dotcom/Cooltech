import 'dotenv/config';
import mongoose from 'mongoose';
import { CustomerType } from './models/extendedModels.js';

// ⚠️ replace MONGO_URI below with whatever your .env actually calls it
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function run() {
  if (!MONGO_URI) {
    console.error('No Mongo URI found. Check your .env file for the correct variable name.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  const all = await CustomerType.find({}).sort({ typeId: 1 });
  console.log('── All CustomerType docs (including soft-deleted) ──');
  all.forEach(t => {
    console.log(`${t.typeId} | name: "${t.name}" | isActive: ${t.isActive} | isDeleted: ${t.isDeleted} | _id: ${t._id}`);
  });

  const collision = await CustomerType.findOne({ typeId: 'CT-004' });
  console.log('\n── CT-004 details ──');
  console.log(collision);

  await mongoose.disconnect();
}

run().catch(console.error);