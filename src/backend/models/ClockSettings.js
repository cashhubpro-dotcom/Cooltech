import mongoose from 'mongoose';

const clockSettingsSchema = new mongoose.Schema(
  {
    shiftStart:     { type: String,  default: '09:00' },
    shiftEnd:       { type: String,  default: '18:00' },
    otThresholdH:   { type: Number,  default: 9 },
    weeklyTargetH:  { type: Number,  default: 45 },
    breakLimitMins: { type: Number,  default: 60 },
    ipEnabled:      { type: Boolean, default: false },
    allowedIPs:     { type: [String], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model('ClockSettings', clockSettingsSchema);