import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  channel:   { type: String, required: true },           // 'general', 'techs', etc.
  from:      { type: String, required: true },           // sender name
  msg:       { type: String, required: true },
  self:      { type: Boolean, default: false },          // true = sent by Admin
  readBy:    [{ type: String }],                         // array of user names who read it
  isDeleted: { type: Boolean, default: false }, // ← add this
  deletedAt: { type: Date },                    // ← add this
}, { timestamps: true });

const channelSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true }, // 'general', 'techs', etc.
  label:     { type: String, required: true },
  icon:      { type: String, default: '💬' },
  unread:    { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export const Channel = mongoose.model('Channel', channelSchema);
export const Message = mongoose.model('Message', messageSchema);