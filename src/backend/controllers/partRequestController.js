import PartRequest from '../models/PartRequest.js';
import { Inventory } from '../models/index.js';

/**
 * PUT /api/part-requests/:id/approve
 * Admin approves a pending request — decrements Inventory stock by the
 * requested qty. Blocks the approval if stock is insufficient so the admin
 * has to adjust inventory first rather than silently going negative.
 */
export const approveRequest = async (req, res) => {
  try {
    const request = await PartRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}.` });
    }

    const inv = await Inventory.findById(request.part);
    if (!inv) return res.status(404).json({ message: 'Linked inventory item no longer exists.' });
    if (inv.qty < request.qty) {
      return res.status(400).json({ message: `Insufficient stock. Only ${inv.qty} ${inv.unit} available.` });
    }

    inv.qty -= request.qty;
    await inv.save();

    request.status    = 'approved';
    request.decidedBy = req.user._id;
    request.decidedAt = new Date();
    await request.save();

    const doc = await PartRequest.findById(request._id)
      .populate('part')
      .populate('technician')
      .populate('decidedBy', 'name email');

    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/part-requests/:id/reject
 * body: { reason }
 */
export const rejectRequest = async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const request = await PartRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Request is already ${request.status}.` });
    }

    request.status           = 'rejected';
    request.rejectionReason  = reason;
    request.decidedBy        = req.user._id;
    request.decidedAt        = new Date();
    await request.save();

    const doc = await PartRequest.findById(request._id)
      .populate('part')
      .populate('technician')
      .populate('decidedBy', 'name email');

    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/part-requests/stats/summary
 * Counts for the admin KPI cards.
 */
export const getStats = async (req, res) => {
  try {
    const rows = await PartRequest.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const summary = { pending: 0, approved: 0, rejected: 0 };
    rows.forEach((r) => { if (summary[r._id] !== undefined) summary[r._id] = r.count; });

    const urgent = await PartRequest.countDocuments({ isDeleted: { $ne: true }, urgent: true, status: 'pending' });

    res.json({ success: true, data: { ...summary, urgent } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};