// routes/technicianLookups.js
// Mount at: router.use('/technician-lookups', technicianLookupsRouter)

import express from 'express';
import { TechnicianLookup } from '../models/TechnicianLookup.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

const DEFAULTS = {
  role:           ['Junior Technician', 'Technician', 'Senior Technician', 'Lead Technician', 'Supervisor', 'Foreman'],
  department:     ['Field Service', 'Installation', 'AMC', 'Repair', 'VRF / Chillers'],
  employmentType: ['Full-time', 'Part-time', 'Contract', 'Freelancer', 'Apprentice'],
  reportingTo:    ['Admin / Owner', 'Branch Manager', 'Regional Manager', 'General Manager'],
  vehicleType:    ['None', 'Bike (Own)', 'Bike (Company)', 'Van (Company)'],
  bank:           ['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Bank of Baroda', 'Punjab National Bank'],
};

// ── GET /  — all items, grouped by category ───────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const data = await TechnicianLookup.find(query).sort({ category: 1, order: 1, createdAt: 1 });

    // Build grouped map for convenience
    const grouped = {};
    data.forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });

    res.json({ data, grouped, total: data.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /seed  — seed defaults (only inserts missing ones) ───────────────────
// IMPORTANT: static route must be before /:id
router.post('/seed', async (req, res) => {
  try {
    const ops = [];
    for (const [category, values] of Object.entries(DEFAULTS)) {
      values.forEach((value, idx) => {
        ops.push({
          updateOne: {
            filter: { category, value },
            update: { $setOnInsert: { category, value, order: idx + 1, isActive: true } },
            upsert: true,
          },
        });
      });
    }
    const result = await TechnicianLookup.bulkWrite(ops);
    res.json({ message: 'Seeded.', upserted: result.upsertedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /reset/:category  — reset one category to defaults ──────────────────
router.post('/reset/:category', async (req, res) => {
  try {
    const { category } = req.params;
    if (!DEFAULTS[category]) {
      return res.status(400).json({ message: `Unknown category: ${category}` });
    }
    // Delete all existing for this category
    await TechnicianLookup.deleteMany({ category });
    // Re-insert defaults
    const docs = DEFAULTS[category].map((value, idx) => ({ category, value, order: idx + 1, isActive: true }));
    const inserted = await TechnicianLookup.insertMany(docs);
    res.json({ message: 'Reset.', data: inserted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /:id ──────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doc = await TechnicianLookup.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found.' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /  — create one item ─────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { category, value, order, isActive } = req.body;
    if (!category || !value) {
      return res.status(400).json({ message: 'category and value are required.' });
    }
    const doc = await TechnicianLookup.create({ category, value: value.trim(), order, isActive });
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This value already exists in this category.' });
    }
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /:id  — update value / isActive / order ───────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { value, isActive, order } = req.body;
    const update = {};
    if (value     !== undefined) update.value    = value.trim();
    if (isActive  !== undefined) update.isActive = isActive;
    if (order     !== undefined) update.order    = order;

    const doc = await TechnicianLookup.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: 'Not found.' });
    res.json(doc);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This value already exists in this category.' });
    }
    res.status(400).json({ message: err.message });
  }
});

// ── DELETE /:id  — hard delete ────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const doc = await TechnicianLookup.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found.' });
    res.json({ message: 'Deleted.', doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;