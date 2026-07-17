import { AdCampaign } from '../models/AdCampaign.model.js';
import { createCRUD }  from './crudHelper.js';
import { protect }     from '../middleware/auth.js';

const adCampaignRouter = createCRUD(AdCampaign, {
  searchFields: ['adCampaignId', 'name', 'goal', 'status'],
  filterFields: ['status', 'goal'],
  softDelete: true,          // uses isDeleted / deletedAt like your other models
});

// ── Static routes BEFORE /:id ──────────────────────────────────────────────────

// GET /api/ad-campaigns/stats/overview
adCampaignRouter.get('/stats/overview', protect, async (req, res) => {
  try {
    const all = await AdCampaign.find({ isDeleted: { $ne: true } });
    const stats = {
      total:        all.length,
      active:       all.filter(c => c.status === 'active').length,
      completed:    all.filter(c => c.status === 'completed').length,
      totalBudget:  all.reduce((s, c) => s + c.budget,      0),
      totalSpent:   all.reduce((s, c) => s + c.spent,       0),
      totalLeads:   all.reduce((s, c) => s + c.leads,       0),
      totalRevenue: all.reduce((s, c) => s + c.revenue,     0),
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/ad-campaigns/deleted
adCampaignRouter.get('/deleted', protect, async (req, res) => {
  try {
    const deleted = await AdCampaign.find({ isDeleted: true }).sort({ deletedAt: -1 });
    res.json({ success: true, data: deleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/ad-campaigns/:id/restore
adCampaignRouter.put('/:id/restore', protect, async (req, res) => {
  try {
    const doc = await AdCampaign.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default adCampaignRouter;