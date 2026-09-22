// controllers/gstReviewController.js
import GstReview from '../models/GstReview.js';

// Financial-year label matching how the UI banner talks about "revise every
// April" — periods roll over on April 1. Jan–Mar counts as the FY that
// started the previous April, e.g. Feb 2027 -> "2026-27".
const currentPeriod = () => {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1; // month index 3 = April
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
};

// GET /api/gst/review — review status for the current financial year
export const getReviewStatus = async (req, res) => {
  try {
    const period = currentPeriod();
    const review = await GstReview.findOne({ period });
    if (!review) {
      // No row yet for this FY simply means it hasn't been reviewed —
      // report that without writing anything until someone confirms it.
      return res.json({
        success: true,
        data: { period, reviewed: false, reviewedBy: null, reviewedAt: null, notes: '' },
      });
    }
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch review status', error: err.message });
  }
};

// POST /api/gst/review — mark the current financial year as reviewed
export const markReviewed = async (req, res) => {
  try {
    const period = currentPeriod();
    const review = await GstReview.findOneAndUpdate(
      { period },
      {
        period,
        reviewed: true,
        reviewedBy: req.user?._id ?? null,
        reviewedAt: new Date(),
        ...(req.body?.notes !== undefined ? { notes: req.body.notes } : {}),
      },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update review status', error: err.message });
  }
};