import SocialChannel from "../models/SocialChannel.js";

export const listChannels = async (req, res) => {
  const channels = await SocialChannel.find();
  res.json(channels);
};

export const toggleChannel = async (req, res) => {
  const channel = await SocialChannel.findOneAndUpdate(
    { channelId: req.params.channelId },
    { connected: req.body.connected },
    { new: true }
  );
  if (!channel) return res.status(404).json({ error: "Channel not found" });
  res.json(channel);
};
