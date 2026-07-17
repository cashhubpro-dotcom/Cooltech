// routes/feedback.routes.js
import express          from 'express';
import Feedback         from '../models/Feedback.js';
import FeedbackRequest  from '../models/FeedbackRequest.js';
import Customer         from '../models/Customer.js';
import Job              from '../models/Job.js';
import { protect }      from '../middleware/auth.js';
import { dispatch }     from '../services/notificationService.js';

const router = express.Router();
router.use(protect);

const notDeleted = { isDeleted: { $ne: true } };

// ─────────────────────────────────────────────────────────────────────────────
//  GET /api/feedback
//  Query: ?rating=5 &resolved=false &category=Repair &search=xyz &page=1&limit=50
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rating, resolved, category, search, page = 1, limit = 50 } = req.query;
    const q = { ...notDeleted };

    if (rating   !== undefined) q.rating   = Number(rating);
    if (category)               q.category = category;
    if (resolved !== undefined) q.resolved = resolved === 'true';
    if (search) {
      const re = new RegExp(search, 'i');
      q.$or = [{ customerName: re }, { jobRef: re }, { comment: re }, { techName: re }];
    }

    const total    = await Feedback.countDocuments(q);
    const feedback = await Feedback
      .find(q)
      .populate('customer',   'name phone email')
      .populate('job',        'jobId type')
      .populate('technician', 'name')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ data: feedback, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/feedback/stats ───────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const all = await Feedback.find(notDeleted);

    const total      = all.length;
    const avgRating  = total
      ? Number((all.reduce((s, f) => s + f.rating, 0) / total).toFixed(1))
      : 0;
    const recommend  = all.filter(f => f.recommend).length;
    const unreplied  = all.filter(f => !f.replied).length;
    const needsFollowUp = all.filter(f => !f.resolved).length;
    const byRating   = [5, 4, 3, 2, 1].map(s => ({
      stars: s,
      count: all.filter(f => f.rating === s).length,
    }));

    // Avg resolution: days between createdAt and followUpAt for resolved negative items
    const resolved = all.filter(f => f.rating <= 2 && f.resolved && f.followUpAt);
    const avgResolution = resolved.length
      ? (resolved.reduce((sum, f) => {
          return sum + (new Date(f.followUpAt) - new Date(f.createdAt)) / 86400000;
        }, 0) / resolved.length).toFixed(1)
      : null;

    res.json({
      total, avgRating, recommend, unreplied, needsFollowUp,
      avgResolution, byRating,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/feedback/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const fb = await Feedback
      .findOne({ _id: req.params.id, ...notDeleted })
      .populate('customer job technician');
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });
    res.json(fb);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/feedback — create feedback entry ────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const fb = await Feedback.create(req.body);
    res.status(201).json(fb);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/feedback/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const fb = await Feedback.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true }
    );
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });
    res.json(fb);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── DELETE /api/feedback/:id — soft delete ────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Feedback.findByIdAndUpdate(req.params.id, {
      isDeleted: true, deletedAt: new Date(),
    });
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/feedback/deleted — for RecycleBin page ───────────────────────────
router.get('/deleted', async (req, res) => {
  try {
    const items = await Feedback.find({ isDeleted: true }).sort({ deletedAt: -1 });
    res.json({ data: items, total: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /api/feedback/:id/restore ─────────────────────────────────────────────
router.put('/:id/restore', async (req, res) => {
  try {
    const fb = await Feedback.findByIdAndUpdate(
      req.params.id, { isDeleted: false, deletedAt: null }, { new: true }
    );
    res.json(fb);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /api/feedback/:id/reply
//  Body: { reply: "Thank you..." }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/reply', async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply?.trim()) return res.status(400).json({ message: 'Reply text is required' });

    const fb = await Feedback.findByIdAndUpdate(
      req.params.id,
      { reply, replied: true, repliedAt: new Date(), repliedBy: req.user._id },
      { new: true }
    );
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });
    res.json(fb);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  PUT /api/feedback/:id/follow-up
//  Body: { note: "Called customer, resolved issue." }
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/follow-up', async (req, res) => {
  try {
    const { note } = req.body;
    const fb = await Feedback.findByIdAndUpdate(
      req.params.id,
      { resolved: true, followUpNote: note || '', followUpAt: new Date() },
      { new: true }
    );
    if (!fb) return res.status(404).json({ message: 'Feedback not found' });
    res.json(fb);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/feedback/request-feedback
//
//  Body: { customerId, jobId?, message, subject? }
//  Resolves customer.email → sends email → saves FeedbackRequest record
// ─────────────────────────────────────────────────────────────────────────────
router.post('/request-feedback', async (req, res) => {
  try {
    const {
      customerId,
      jobId,
      message,
      subject = 'How was our service? — CoolTech AC Services',
    } = req.body;

    if (!customerId) return res.status(400).json({ message: 'customerId is required' });
    if (!message)    return res.status(400).json({ message: 'message is required' });

    // ── Resolve customer ──────────────────────────────────────────────────────
    const customer = await Customer.findById(customerId);
    if (!customer)  return res.status(404).json({ message: 'Customer not found' });

    const recipient = customer.email;
    if (!recipient) {
      return res.status(400).json({
        message: `Customer "${customer.name}" has no email address on file.`,
      });
    }

    // ── Resolve job ref ───────────────────────────────────────────────────────
    let jobRef = '';
    let jobDoc = null;
    if (jobId) {
      jobDoc = await Job.findById(jobId).select('jobId type');
      jobRef = jobDoc?.jobId || '';
    }

    // ── Save request record (pending) ─────────────────────────────────────────
    const request = await FeedbackRequest.create({
      customer:     customer._id,
      customerName: customer.name,
      job:          jobDoc?._id,
      jobRef,
      recipient,
      subject,
      message,
      status:  'pending',
      sentBy:  req.user._id,
    });

    // ── Send email ────────────────────────────────────────────────────────────
    try {
      const result = await dispatch('Email', recipient, message, subject, customer.name);

      await FeedbackRequest.findByIdAndUpdate(request._id, {
        status:    'sent',
        messageId: result.messageId || '',
        sentAt:    new Date(),
      });

      res.json({
        success:   true,
        message:   `Feedback request emailed to ${recipient}`,
        requestId: request.requestId,
        messageId: result.messageId,
      });
    } catch (emailErr) {
      await FeedbackRequest.findByIdAndUpdate(request._id, {
        status:   'failed',
        errorMsg: emailErr.message,
      });

      res.status(200).json({
        success: false,
        message: emailErr.message,
        hint:    'Ensure EMAIL_USER and EMAIL_PASS are set in your .env file.',
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;