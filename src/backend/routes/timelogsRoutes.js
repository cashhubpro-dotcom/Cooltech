import express from 'express';
import TimeLog from '../models/TimeLog.js';
import Technician from '../models/Technician.js';

const router = express.Router();

// GET /api/timelogs
router.get('/', async (req, res) => {
  try {
    const logs = await TimeLog.find()
      .populate('technician', 'name')
      .populate('job', 'jobId')
      .sort({ createdAt: -1 });

    // Flatten to match what TimeLogPage expects
    const data = logs.map(l => ({
      _id:      l._id,
      id:       l._id.toString().slice(-6).toUpperCase(),
      tech:     l.technician?.name || '—',
      job:      l.job?.jobId || '—',
      type:     l.type,
      customer: l.customer,
      date:     l.date,
      start:    l.start,
      end:      l.end,
      hrs:      l.hrs,
      billable: l.billable,
      notes:    l.notes,
    }));

    res.json(data);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/timelogs
router.post('/', async (req, res) => {
  try {
    const log = await TimeLog.create(req.body);
    res.status(201).json(log);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PUT /api/timelogs/:id
router.put('/:id', async (req, res) => {
  try {
    const log = await TimeLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(log);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE /api/timelogs/:id
router.delete('/:id', async (req, res) => {
  try {
    await TimeLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;