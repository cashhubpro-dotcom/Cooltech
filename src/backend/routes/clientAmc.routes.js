// routes/clientAmc.routes.js
// Mount in server.js the same way clientPaymentRoutes is mounted:
//   import clientAmcRoutes from './routes/clientAmc.routes.js';
//   app.use('/api/client-portal/me/amc', clientAmcRoutes);
//
// req.user here is the full Mongoose User doc (set by `protect`), and
// clientOnly already guarantees req.user.customer exists. Every query below
// filters on that, so a client can never read or act on someone else's
// contract — even if they guess an _id in the URL.

import express from 'express';
import AMC from '../models/AMC.js';
import { Ticket } from '../models/index.js'; // named export, matching your model file
import { protect, clientOnly } from '../middleware/auth.js'; // adjust path to match your project

const router = express.Router();

router.use(protect, clientOnly);

const CLIENT_SAFE_EXCLUDE = '-deletedAt -__v';

const scopedFilter = (req) => ({
  customer: req.user.customer,
  isDeleted: { $ne: true },
});

// GET /client-portal/me/amc — list this client's contracts
router.get('/', async (req, res) => {
  try {
    const contracts = await AMC.find(scopedFilter(req))
      .select(CLIENT_SAFE_EXCLUDE)
      .sort({ createdAt: -1 });

    res.json({ data: contracts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /client-portal/me/amc/summary — KPI numbers, computed in the DB
router.get('/summary', async (req, res) => {
  try {
    const [summary] = await AMC.aggregate([
      { $match: scopedFilter(req) },
      {
        $group: {
          _id: null,
          activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          expiringCount: { $sum: { $cond: [{ $eq: ['$status', 'expiring'] }, 1, 0] } },
          totalUnits: { $sum: '$units' },
          visitsAll: { $sum: '$visits' },
          visitsDone: { $sum: '$done' },
        },
      },
    ]);

    res.json(
      summary || { activeCount: 0, expiringCount: 0, totalUnits: 0, visitsAll: 0, visitsDone: 0 }
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /client-portal/me/amc/:id — single contract, ownership enforced
router.get('/:id', async (req, res) => {
  try {
    const contract = await AMC.findOne({ _id: req.params.id, ...scopedFilter(req) }).select(
      CLIENT_SAFE_EXCLUDE
    );

    if (!contract) return res.status(404).json({ message: 'Contract not found' });
    res.json({ data: contract });
  } catch {
    // malformed ObjectId also lands here — treat as "not found", not a 500
    res.status(404).json({ message: 'Contract not found' });
  }
});

// PATCH /client-portal/me/amc/:id/request-service
// Mirrors the PATCH style your reminders API already uses for
// request-service — creates a trackable ticket rather than a silent no-op.
// Body: { note, preferredDate, slot } — all optional, all filled in by the
// "Request Service Visit" modal on the frontend.
router.patch('/:id/request-service', async (req, res) => {
  try {
    const contract = await AMC.findOne({ _id: req.params.id, ...scopedFilter(req) });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const clientName = req.user.name || contract.customerName || 'Client';
    const { note, preferredDate, slot } = req.body || {};

    const slotLabel = { morning: 'Morning (9am–12pm)', afternoon: 'Afternoon (12pm–4pm)', evening: 'Evening (4pm–7pm)' }[slot];
    const scheduleLine = preferredDate
      ? ` Preferred: ${new Date(preferredDate).toDateString()}${slotLabel ? `, ${slotLabel}` : ''}.`
      : '';

    const ticket = await Ticket.create({
      customer: req.user.customer,
      customerName: clientName,
      contact: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
      subject: `Service visit requested — ${contract.amcId}`,
      category: 'scheduling',
      priority: 'medium',
      status: 'open',
      messages: [
        {
          from: clientName,
          msg:
            `Client requested a service visit for AMC contract ${contract.amcId} (${contract.units} unit${contract.units > 1 ? 's' : ''}).${scheduleLine}` +
            (note ? ` Note: ${note}` : ''),
          isClient: true,
        },
      ],
    });

    // TODO: if your existing '/me/tickets' POST route also emits a Socket.IO
    // event (via ticketSocket.js) so admins see new tickets live, call that
    // same emit function here — e.g. emitNewTicket(io, ticket) — so this
    // shows up in real time too, not just after a refresh.

    res.json({ data: { contract, ticket } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /client-portal/me/amc/:id/request-renewal
router.patch('/:id/request-renewal', async (req, res) => {
  try {
    const contract = await AMC.findOne({ _id: req.params.id, ...scopedFilter(req) });
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    const clientName = req.user.name || contract.customerName || 'Client';
    const endLabel = contract.end ? new Date(contract.end).toDateString() : 'soon';

    const ticket = await Ticket.create({
      customer: req.user.customer,
      customerName: clientName,
      contact: req.user.name,
      phone: req.user.phone,
      email: req.user.email,
      subject: `Renewal requested — ${contract.amcId}`,
      category: 'other', // swap for 'billing' if that's a better fit for your team's triage
      priority: contract.status === 'expired' ? 'high' : 'medium',
      status: 'open',
      messages: [
        {
          from: clientName,
          msg:
            req.body?.note ||
            `Client requested renewal for AMC contract ${contract.amcId}, expiring ${endLabel}.`,
          isClient: true,
        },
      ],
    });

    res.json({ data: { contract, ticket } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;