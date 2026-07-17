import { Channel, Message } from '../models/chatModel.js';

const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  data });
const err = (res, msg,  status = 500) => res.status(status).json({ success: false, message: msg });

// ── CHANNELS ─────────────────────────────────────────────────────────────────

// GET /api/chat/channels
export const getChannels = async (req, res) => {
  try {
    const channels = await Channel.find({ isDeleted: false }).sort({ createdAt: 1 });
    ok(res, channels);
  } catch (e) { err(res, e.message); }
};

// POST /api/chat/channels
export const createChannel = async (req, res) => {
  try {
    const { id, label, icon } = req.body;
    if (!id || !label) return err(res, 'id and label are required', 400);

    const exists = await Channel.findOne({ id });
    if (exists) return err(res, 'Channel already exists', 400);

    const channel = await Channel.create({ id, label, icon: icon || '💬' });
    ok(res, channel, 201);
  } catch (e) { err(res, e.message); }
};

// DELETE /api/chat/channels/:id
export const deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findOneAndUpdate(
      { id: req.params.id },
      { isDeleted: true },
      { new: true }
    );
    if (!channel) return err(res, 'Channel not found', 404);
    ok(res, { message: 'Channel deleted' });
  } catch (e) { err(res, e.message); }
};

// ── MESSAGES ─────────────────────────────────────────────────────────────────

// GET /api/chat/messages/:channel?page=1&limit=50
export const getMessages = async (req, res) => {
  try {
    const { channel } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const channelExists = await Channel.findOne({ id: channel, isDeleted: false });
    if (!channelExists) return err(res, 'Channel not found', 404);

    const total    = await Message.countDocuments({ channel, isDeleted: { $ne: true } });
    const messages = await Message.find({ channel, isDeleted: { $ne: true } }) // ← add filter
      .sort({ createdAt: 1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    const data = messages.map(m => ({
      id:        m._id.toString(),
      from:      m.from,
      msg:       m.msg,
      self:      m.self,
      time:      m.createdAt,
      readBy:    m.readBy,
      channel:   m.channel,
    }));

    ok(res, { messages: data, pagination: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / +limit) } });
  } catch (e) { err(res, e.message); }
};

// POST /api/chat/messages
export const sendMessage = async (req, res) => {
  try {
    const { channel, from, msg, self = false } = req.body;
    if (!channel || !from || !msg) return err(res, 'channel, from, and msg are required', 400);

    const channelExists = await Channel.findOne({ id: channel, isDeleted: false });
    if (!channelExists) return err(res, 'Channel not found', 404);

    const message = await Message.create({ channel, from, msg, self, readBy: [from] });

    // bump unread count on channel for everyone except sender
    await Channel.findOneAndUpdate({ id: channel }, { $inc: { unread: 1 } });

    const data = {
      id:      message._id.toString(),
      from:    message.from,
      msg:     message.msg,
      self:    message.self,
      time:    message.createdAt,
      channel: message.channel,
      readBy:  message.readBy,
    };

    ok(res, data, 201);
  } catch (e) { err(res, e.message); }
};

// DELETE /api/chat/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!message) return err(res, 'Message not found', 404);
    ok(res, { message: 'Message deleted' });
  } catch (e) { err(res, e.message); }
};

// PATCH /api/chat/messages/:id/read  — mark message read by a user
export const markRead = async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName) return err(res, 'userName is required', 400);

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { readBy: userName } },
      { new: true }
    );
    if (!message) return err(res, 'Message not found', 404);
    ok(res, { id: message._id.toString(), readBy: message.readBy });
  } catch (e) { err(res, e.message); }
};

// PATCH /api/chat/channels/:id/clear-unread — reset unread count
export const clearUnread = async (req, res) => {
  try {
    const channel = await Channel.findOneAndUpdate(
      { id: req.params.id },
      { unread: 0 },
      { new: true }
    );
    if (!channel) return err(res, 'Channel not found', 404);
    ok(res, { id: channel.id, unread: 0 });
  } catch (e) { err(res, e.message); }
};

// GET /api/chat/stats
export const getChatStats = async (req, res) => {
  try {
    const [totalMessages, totalChannels, unreadAgg] = await Promise.all([
      Message.countDocuments(),
      Channel.countDocuments({ isDeleted: false }),
      Channel.aggregate([{ $group: { _id: null, total: { $sum: '$unread' } } }]),
    ]);
    ok(res, {
      totalMessages,
      totalChannels,
      totalUnread: unreadAgg[0]?.total || 0,
    });
  } catch (e) { err(res, e.message); }
};

// POST /api/chat/channels/dm  — get or create a DM channel
export const getOrCreateDM = async (req, res) => {
  try {
    const { techName } = req.body;
    if (!techName) return err(res, 'techName is required', 400);

    const id    = `dm_${techName.toLowerCase().replace(/\s+/g, '_')}`;
    const label = techName;

    let channel = await Channel.findOne({ id });
    if (!channel) {
      channel = await Channel.create({ id, label, icon: '👤', unread: 0 });
    }

    ok(res, channel, 201);
  } catch (e) { err(res, e.message); }
};

// GET /api/chat/channels/deleted
export const getDeletedChannels = async (req, res) => {
  try {
    const channels = await Channel.find({ isDeleted: true }).sort({ updatedAt: -1 });
    ok(res, channels);
  } catch (e) { err(res, e.message); }
};

// GET /api/chat/messages/deleted
export const getDeletedMessages = async (req, res) => {
  try {
    const messages = await Message.find({ isDeleted: true }).sort({ updatedAt: -1 });
    ok(res, messages);
  } catch (e) { err(res, e.message); }
};

// PUT /api/chat/channels/:id/restore
export const restoreChannel = async (req, res) => {
  try {
    const channel = await Channel.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );
    if (!channel) return err(res, 'Channel not found', 404);
    ok(res, channel);
  } catch (e) { err(res, e.message); }
};

// PUT /api/chat/messages/:id/restore
export const restoreMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );
    if (!message) return err(res, 'Message not found', 404);
    ok(res, message);
  } catch (e) { err(res, e.message); }
};

// DELETE /api/chat/channels/:id/hard
export const hardDeleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findByIdAndDelete(req.params.id);
    if (!channel) return err(res, 'Channel not found', 404);
    // also hard delete all messages in this channel
    await Message.deleteMany({ channel: channel.id });
    ok(res, { message: 'Channel permanently deleted' });
  } catch (e) { err(res, e.message); }
};

// DELETE /api/chat/messages/:id/hard
export const hardDeleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) return err(res, 'Message not found', 404);
    ok(res, { message: 'Message permanently deleted' });
  } catch (e) { err(res, e.message); }
};