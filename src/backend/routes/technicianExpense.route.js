import express from 'express';
import { protect, technicianOnly } from '../middleware/auth.js';
import { handleReceiptUpload } from '../middleware/uploadReceipt.middleware.js';
import { Expense } from '../models/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Technician-facing Expense routes.
// Deliberately NOT built on the generic createCRUD(Expense, ...) router that
// admin uses — that one lists/edits every technician's expenses. Everything
// here is scoped to req.technician (resolved by technicianOnly) so a
// technician can only ever see or touch their own claims, and can never
// approve/reject/reassign a claim by sending extra fields in the body.
// ─────────────────────────────────────────────────────────────────────────────

const router = express.Router();

router.use(protect, technicianOnly);

// Fields a technician's request body is allowed to set. Anything else
// (status, technician, approvedBy, isDeleted, expenseId…) is silently
// dropped — those are admin/system-controlled.
const ALLOWED_FIELDS = ['category', 'description', 'amount', 'date', 'job', 'customerName', 'receipt', 'receiptUrl', 'notes'];

const pickAllowed = (body = {}) => {
  const out = {};
  for (const f of ALLOWED_FIELDS) if (body[f] !== undefined) out[f] = body[f];
  return out;
};

// GET /api/technician/expenses — this technician's own claims only
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, status, category } = req.query;
    const query = { isDeleted: { $ne: true }, technician: req.technician._id };

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { expenseId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Expense.find(query)
        .populate('job', 'jobId customerName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Expense.countDocuments(query),
    ]);

    res.json({ data, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/technician/expenses/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await Expense.findOne({
      _id: req.params.id,
      technician: req.technician._id,
      isDeleted: { $ne: true },
    }).populate('job', 'jobId customerName');

    if (!doc) return res.status(404).json({ message: 'Not found.' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/technician/expenses/upload-receipt
// Upload the file first, get back a URL, then send that URL as `receiptUrl`
// in the create/update call below — same two-step pattern the admin panel
// already uses for its own uploadApi.upload(file).
router.post('/upload-receipt', handleReceiptUpload, (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const url = `/uploads/receipts/${req.file.filename}`;
  res.status(201).json({ url });
});

// POST /api/technician/expenses — always created as 'pending', always tied
// to the authenticated technician regardless of what the client sends.
router.post('/', async (req, res) => {
  try {
    const doc = await Expense.create({
      ...pickAllowed(req.body),
      technician: req.technician._id,
      techName: req.technician.name,
      status: 'pending',
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/technician/expenses/:id — only the owner, only while pending
router.put('/:id', async (req, res) => {
  try {
    const existing = await Expense.findOne({
      _id: req.params.id,
      technician: req.technician._id,
      isDeleted: { $ne: true },
    });
    if (!existing) return res.status(404).json({ message: 'Not found.' });
    if (existing.status !== 'pending') {
      return res.status(403).json({
        message: `This claim is already ${existing.status} and can no longer be edited.`,
      });
    }

    Object.assign(existing, pickAllowed(req.body));
    await existing.save();
    await existing.populate('job', 'jobId customerName');
    res.json(existing);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/technician/expenses/:id — soft delete, only the owner, only while pending
router.delete('/:id', async (req, res) => {
  try {
    const existing = await Expense.findOne({
      _id: req.params.id,
      technician: req.technician._id,
      isDeleted: { $ne: true },
    });
    if (!existing) return res.status(404).json({ message: 'Not found.' });
    if (existing.status !== 'pending') {
      return res.status(403).json({
        message: `This claim is already ${existing.status} and can no longer be deleted.`,
      });
    }

    existing.isDeleted = true;
    existing.deletedAt = new Date();
    await existing.save();
    res.json({ message: 'Moved to trash.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;