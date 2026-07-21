import 'dotenv/config';
import mongoose from 'mongoose';
import SalesOrder from './models/SalesOrder.js';

const SEED_ORDERS = [
  {
    soId: 'SO-0091',
    customer: 'Arjun Mehta',
    phone: '98765 43210',
    address: '12, Satellite Road, Ahmedabad',
    items: [
      { name: 'Split AC 1.5T', qty: 1, rate: 42000, total: 42000 },
      { name: 'Installation Kit', qty: 2, rate: 800, total: 1600 },
      { name: 'Copper Pipe 3m', qty: 3, rate: 600, total: 1800 },
    ],
    subtotal: 45400,
    gst: 8172,
    total: 53572,
    orderDate: new Date('2026-04-15'),
    deliveryDate: new Date('2026-04-20'),
    status: 'delivered',
    payStatus: 'paid',
    notes: 'Premium installation requested.',
  },
  {
    soId: 'SO-0090',
    customer: 'Priya Sharma',
    phone: '91234 56789',
    address: '45, Navrangpura, Ahmedabad',
    items: [{ name: 'Window AC 1T', qty: 1, rate: 18000, total: 18000 }],
    subtotal: 18000,
    gst: 3240,
    total: 21240,
    orderDate: new Date('2026-04-14'),
    deliveryDate: new Date('2026-04-18'),
    status: 'shipped',
    payStatus: 'paid',
    notes: '',
  },
  {
    soId: 'SO-0089',
    customer: 'Rohan Constructions',
    phone: '90000 11223',
    address: 'Plot 8, GIDC Estate, Vatva',
    items: [
      { name: 'Cassette AC 2T', qty: 2, rate: 68000, total: 136000 },
      { name: 'Stabilizer', qty: 2, rate: 3500, total: 7000 },
      { name: 'AMC Package', qty: 1, rate: 12000, total: 12000 },
      { name: 'Installation', qty: 2, rate: 2500, total: 5000 },
    ],
    subtotal: 160000,
    gst: 28800,
    total: 188800,
    orderDate: new Date('2026-04-12'),
    deliveryDate: new Date('2026-04-16'),
    status: 'delivered',
    payStatus: 'paid',
    notes: 'Bulk order — dedicated technician assigned.',
  },
  {
    soId: 'SO-0088',
    customer: 'Sneha Patel',
    phone: '87654 32109',
    address: '7, Paldi Cross Road, Ahmedabad',
    items: [
      { name: 'Inverter AC 1.5T', qty: 1, rate: 38000, total: 38000 },
      { name: 'Extended Warranty', qty: 1, rate: 4500, total: 4500 },
    ],
    subtotal: 42500,
    gst: 7650,
    total: 50150,
    orderDate: new Date('2026-04-10'),
    deliveryDate: new Date('2026-04-14'),
    status: 'processing',
    payStatus: 'pending',
    notes: 'Preferred delivery after 6 PM.',
  },
  {
    soId: 'SO-0087',
    customer: 'Vikram HVAC Works',
    phone: '99887 76655',
    address: '22, Iscon Ambli Road, Bopal',
    items: [
      { name: 'Duct AC 3T', qty: 1, rate: 95000, total: 95000 },
      { name: 'Copper Pipe 5m', qty: 4, rate: 900, total: 3600 },
    ],
    subtotal: 98600,
    gst: 17748,
    total: 116348,
    orderDate: new Date('2026-04-09'),
    deliveryDate: new Date('2026-04-13'),
    status: 'processing',
    payStatus: 'pending',
    notes: '',
  },
  {
    soId: 'SO-0086',
    customer: 'Deepa Iyer',
    phone: '76543 21098',
    address: '3, Vastrapur Lake Road, Ahmedabad',
    items: [{ name: 'Portable AC 1T', qty: 1, rate: 22000, total: 22000 }],
    subtotal: 22000,
    gst: 3960,
    total: 25960,
    orderDate: new Date('2026-04-07'),
    deliveryDate: new Date('2026-04-11'),
    status: 'delivered',
    payStatus: 'paid',
    notes: '',
  },
];

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ Missing MONGO_URI / MONGODB_URI in your .env file');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  await SalesOrder.deleteMany({ soId: { $in: SEED_ORDERS.map((o) => o.soId) } });
  await SalesOrder.insertMany(SEED_ORDERS);

  console.log(`✅ Seeded ${SEED_ORDERS.length} sales orders`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});