import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    technician:     { type: mongoose.Schema.Types.ObjectId, ref: 'Technician', required: false },
    technicianName: { type: String, default: '' },
    techName:       { type: String, default: '' },   // ← legacy field support
    leaveId:        { type: String, default: '' },   // ← legacy field support
    type:           { type: String, enum: ['sick', 'casual', 'earned'], required: true },
    from:           { type: Date },                  // new field
    to:             { type: Date },                  // new field
    startDate:      { type: Date },                  // ← legacy field support
    endDate:        { type: Date },                  // ← legacy field support
    days:           { type: Number, required: true },
    reason:         { type: String, required: true, trim: true },
    status:         { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy:     { type: String, default: '' },
    approvalNote:   { type: String, default: '' },
    approvedAt:     { type: Date },
    rejectedAt:     { type: Date },
  },
  { timestamps: true }
);

// ← THIS is the fix: guard against OverwriteModelError on nodemon hot-reload
export default mongoose.models.Leave || mongoose.model('Leave', leaveSchema);