import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  announcementId: { type: String, unique: true },
  title:    { type: String, required: true, trim: true },
  message:  { type: String, required: true, trim: true },
  icon:     { type: String, default: '📢' },
  audience: { type: String, enum: ['all', 'clients', 'technicians'], default: 'clients' },
  isActive: { type: Boolean, default: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
}, { timestamps: true });

announcementSchema.pre('save', async function (next) {
  if (this.isNew && !this.announcementId) {
    const count = await this.constructor.countDocuments();
    this.announcementId = `ANN-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

// Fast path for the client portal's "active announcements" query
announcementSchema.index({ isActive: 1, audience: 1, createdAt: -1 });

export default mongoose.model('Announcement', announcementSchema);