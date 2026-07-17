// models/FeedbackRequest.js
import mongoose from 'mongoose';

const feedbackRequestSchema = new mongoose.Schema({
  requestId:    { type: String, unique: true },        // FBR-1001
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  job:          { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  jobRef:       { type: String },

  // ── Email details ─────────────────────────────────────────────────────────
  recipient:    { type: String },                      // email address
  subject:      { type: String },
  message:      { type: String },

  // ── Delivery status ───────────────────────────────────────────────────────
  status:       { type: String, enum: ['pending','sent','failed'], default: 'pending' },
  messageId:    { type: String },                      // nodemailer messageId
  sentAt:       { type: Date },
  errorMsg:     { type: String },
  sentBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

feedbackRequestSchema.pre('save', async function (next) {
  if (!this.isNew || this.requestId) return next();
  const count    = await mongoose.model('FeedbackRequest').countDocuments();
  this.requestId = `FBR-${1000 + count + 1}`;
  next();
});

export default mongoose.model('FeedbackRequest', feedbackRequestSchema);