import express from 'express';
import PartRequest from '../models/PartRequest.js';
import Technician from '../models/Technician.js';

// Mounted as: app.use('/api/part-requests/mine', protect, partRequestMineRoutes)
// MUST be registered before app.use('/api/part-requests', protect, partRequestRoutes)
// — otherwise Express would match "mine" against the main router's GET /:id
// and try to look it up as a Mongo _id (same class of bug the crudHelper.js
// comment already warns about for /deleted vs /:id).
const router = express.Router();

// GET /api/part-requests/mine — the logged-in technician's own requests
router.get('/', async (req, res) => {
  try {
    const tech = await Technician.findOne({ user: req.user._id });
    if (!tech) return res.status(403).json({ message: 'No technician profile is linked to this account.' });

    const data = await PartRequest.find({ technician: tech._id, isDeleted: { $ne: true } })
      .populate('part')
      .sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;