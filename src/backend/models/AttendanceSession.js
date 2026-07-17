import mongoose from 'mongoose';

const breakSchema = new mongoose.Schema({
  startTime:    { type: Date, required: true },
  endTime:      { type: Date },
  durationSecs: { type: Number, default: 0 },
}, { _id: false });

const attendanceSessionSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date:           { type: String, required: true },
    clockInTime:    { type: Date, required: true },
    clockOutTime:   { type: Date },
    breaks:         [breakSchema],
    totalBreakSecs: { type: Number, default: 0 },
    workedMins:     { type: Number, default: 0 },
    lateMins:       { type: Number, default: 0 },
    otMins:         { type: Number, default: 0 },
    status:         { type: String, enum: ['active', 'on_break', 'complete'], default: 'active' },
    ipAddress:      { type: String },
    notes:          { type: String },
    // ── Soft-delete ──────────────────────────────────────────────────────────
    isDeleted:  { type: Boolean, default: false, index: true },
    deletedAt:  { type: Date },
    deletedBy:  { type: String },
  },
  { timestamps: true }
);

// NOTE: No pre-hook — we handle isDeleted filtering manually in each controller
// function so restore/hard-delete can still find soft-deleted docs.

export default mongoose.model('AttendanceSession', attendanceSessionSchema);