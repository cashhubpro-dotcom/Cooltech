import mongoose from 'mongoose';

const adCampaignSchema = new mongoose.Schema({
  adCampaignId: { type: String, unique: true },
  name:         { type: String, required: true },
  goal:         { type: String, enum: ['Leads', 'Bookings', 'Calls', 'AMC Sign-ups', 'Brand Awareness', 'Followers'], default: 'Leads' },
  status:       { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  pauseReason:  { type: String, default: '' },
  channels:     [{ type: String }],   // ['facebook', 'instagram', 'google', ...]
  budget:       { type: Number, default: 0 },
  spent:        { type: Number, default: 0 },
  impressions:  { type: Number, default: 0 },
  reach:        { type: Number, default: 0 },
  clicks:       { type: Number, default: 0 },
  leads:        { type: Number, default: 0 },
  conversions:  { type: Number, default: 0 },
  revenue:      { type: Number, default: 0 },
  startDate:    { type: String },
  endDate:      { type: String },
  isDeleted:    { type: Boolean, default: false },
  deletedAt:    { type: Date,    default: null },
}, { timestamps: true, versionKey: false });

// Auto-generate adCampaignId: ADC-0001, ADC-0002, ...
adCampaignSchema.pre('save', async function (next) {
  if (!this.adCampaignId) {
    const count = await mongoose.model('AdCampaign').countDocuments();
    this.adCampaignId = `ADC-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export const AdCampaign = mongoose.model('AdCampaign', adCampaignSchema);