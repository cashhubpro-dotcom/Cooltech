import mongoose from 'mongoose';

// A technician can never edit their own AttendanceSession / Attendance record
// directly — they raise a CorrectionRequest instead, and an admin approves or
// rejects it. Approval patches the underlying session (see
// controllers/correctionController.js), which then re-syncs the day's
// Attendance record automatically.
const correctionRequestSchema = new mongoose.Schema(
  {
    technician: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: true, index: true },
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session:    { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession' }, // optional — may not exist yet (e.g. missed clock-in entirely)

    targetDate: { type: String, required: true }, // 'YYYY-MM-DD' — the day being corrected
    reason:     { type: String, required: true },

    requestedClockIn:  { type: Date },
    requestedClockOut: { type: Date },

    status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNote: { type: String },
  },
  { timestamps: true }
);

correctionRequestSchema.index({ technician: 1, targetDate: 1 });

export default mongoose.model('CorrectionRequest', correctionRequestSchema);