// backend/routes/clientContract.routes.js
//
// Mirrors the shape of your clientAmc.routes.js / clientPaymentRoutes.js —
// mount it the same way (see server-wiring-fix.js).
//
// Confirmed from your logs: req.user.customer is an ObjectId ref to a
// Customer document, NOT a plain name string. Contract.customer is a plain
// String (the customer's display name). So the link is:
//
//   User.customer (ObjectId) → Customer document → its name field
//                                                       ↓
//                            Contract.customer (String) ← matched against this
//
// I don't know your Customer model's exact field name for the display name,
// so CUSTOMER_NAME_FIELDS below tries the common candidates in order and
// uses whichever one actually has a value. Tell me the real field name and
// I'll trim this to just that one line.

import { Router } from 'express';
import { Contract } from '../models/hrModels.js'; // matches your actual import path
import { protect, clientOnly } from '../middleware/auth.js';
import { buildContractPDF } from '../utils/contractPdf.js';

// Adjust this import if Customer lives in a different file than Contract does.
import Customer from '../models/Customer.js';

const router = Router();
router.use(protect, clientOnly);

const escapeRegex = (val) => String(val ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CLIENT_VISIBLE_STATUSES = ['pending_signature', 'active', 'expired', 'cancelled'];

// Tried in order — first one with a non-empty value wins.
const CUSTOMER_NAME_FIELDS = ['name', 'businessName', 'customerName', 'companyName', 'title'];

const resolveCustomerName = async (customerId) => {
  if (!customerId) return null;
  const doc = await Customer.findById(customerId).lean();
  if (!doc) return null;
  for (const field of CUSTOMER_NAME_FIELDS) {
    if (doc[field]) return doc[field];
  }
  return null;
};

// Builds the Mongo filter that scopes Contract queries to this client.
// Never falls through to "no match key = show everything" — if we can't
// resolve a name AND there's no phone on file, the client sees nothing.
const scopeFilter = async (user) => {
  const or = [];

  const customerName = await resolveCustomerName(user.customer);
  if (customerName) {
    or.push({ customer: new RegExp(`^${escapeRegex(customerName)}$`, 'i') });
  }
  if (user.phone) {
    or.push({ phone: user.phone });
  }

  if (!or.length) return { _id: null };

  return {
    $or: or,
    isDeleted: { $ne: true },
    status: { $in: CLIENT_VISIBLE_STATUSES },
  };
};

// GET /api/client-portal/me/contracts?status=&type=&q=
router.get('/', async (req, res) => {
  try {
    const { status, type, q } = req.query;
    const filter = await scopeFilter(req.user);

    if (status && CLIENT_VISIBLE_STATUSES.includes(status)) filter.status = status;
    if (type) filter.type = type;
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$and = [{ $or: [{ title: rx }, { contractId: rx }, { type: rx }] }];
    }

    const contracts = await Contract.find(filter).sort({ createdAt: -1 });
    res.json({ data: contracts, total: contracts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/client-portal/me/contracts/summary — feeds the KPI cards
router.get('/summary', async (req, res) => {
  try {
    const filter = await scopeFilter(req.user);
    const contracts = await Contract.find(filter);
    res.json({
      totalContracts: contracts.length,
      activeValue: contracts.filter((c) => c.status === 'active').reduce((s, c) => s + (c.value || 0), 0),
      pendingSignature: contracts.filter((c) => c.status === 'pending_signature').length,
      autoRenewing: contracts.filter((c) => c.autoRenew && c.status === 'active').length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/client-portal/me/contracts/:id/download — PDF copy of the contract
router.get('/:id/download', async (req, res) => {
  try {
    const filter = await scopeFilter(req.user);
    const contract = await Contract.findOne({ ...filter, _id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const pdfBuffer = await buildContractPDF(contract);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contract-${contract.contractId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
});

// GET /api/client-portal/me/contracts/:id
router.get('/:id', async (req, res) => {
  try {
    const filter = await scopeFilter(req.user);
    const contract = await Contract.findOne({ ...filter, _id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/client-portal/me/contracts/:id/sign
router.patch('/:id/sign', async (req, res) => {
  try {
    const filter = await scopeFilter(req.user);
    const contract = await Contract.findOne({ ...filter, _id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    if (contract.status !== 'pending_signature') {
      return res.status(400).json({ message: 'This contract is not awaiting signature.' });
    }

    contract.signed = true;
    contract.signedDate = new Date();
    contract.status = 'active';
    contract.signatories = [...(contract.signatories || []), `${req.user.name} (Client)`];

    await contract.save();
    res.json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/client-portal/me/contracts/:id/request-service   body: { note? }
router.patch('/:id/request-service', async (req, res) => {
  try {
    const filter = await scopeFilter(req.user);
    const contract = await Contract.findOne({ ...filter, _id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const stamp = `[Client requested service visit — ${new Date().toLocaleString('en-IN')}]`;
    const note = req.body?.note ? `${stamp} ${req.body.note}` : stamp;
    contract.internalNotes = contract.internalNotes ? `${contract.internalNotes}\n${note}` : note;

    await contract.save();
    res.json({ message: 'Service visit requested', contract });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/client-portal/me/contracts/:id/request-renewal   body: { note? }
router.patch('/:id/request-renewal', async (req, res) => {
  try {
    const filter = await scopeFilter(req.user);
    const contract = await Contract.findOne({ ...filter, _id: req.params.id });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const stamp = `[Client requested renewal — ${new Date().toLocaleString('en-IN')}]`;
    const note = req.body?.note ? `${stamp} ${req.body.note}` : stamp;
    contract.internalNotes = contract.internalNotes ? `${contract.internalNotes}\n${note}` : note;

    await contract.save();
    res.json({ message: 'Renewal requested', contract });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;