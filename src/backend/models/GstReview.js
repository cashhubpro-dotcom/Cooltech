// models/GstReview.js
import mongoose from 'mongoose';

const GstReviewSchema = new mongoose.Schema(
  {
    // Financial-year label, e.g. "2026-27" for the Apr-2026 → Mar-2027 cycle —
    // matches the "revise every April" language used in the UI banner.
    period: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('GstReview', GstReviewSchema);