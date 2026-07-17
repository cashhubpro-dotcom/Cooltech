import ClockSettings from '../models/ClockSettings.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await ClockSettings.findOne();
    if (!settings) settings = await ClockSettings.create({});
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const allowed = ['shiftStart','shiftEnd','otThresholdH','weeklyTargetH','breakLimitMins','ipEnabled','allowedIPs'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    let settings = await ClockSettings.findOne();
    if (!settings) {
      settings = await ClockSettings.create(updates);
    } else {
      Object.assign(settings, updates);
      await settings.save();
    }
    res.json({ message: 'Settings updated', settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addIP = async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ error: 'ip required' });
    let settings = await ClockSettings.findOne();
    if (!settings) settings = await ClockSettings.create({});
    if (settings.allowedIPs.includes(ip)) return res.status(409).json({ error: 'IP already exists' });
    settings.allowedIPs.push(ip);
    await settings.save();
    res.json({ message: 'IP added', settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeIP = async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ error: 'ip required' });
    const settings = await ClockSettings.findOne();
    if (!settings) return res.status(404).json({ error: 'Settings not found' });
    settings.allowedIPs = settings.allowedIPs.filter(x => x !== ip);
    await settings.save();
    res.json({ message: 'IP removed', settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};