// routes/payrollSettings.js
import express from 'express';
import PayrollSettings from '../models/PayrollSettings.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const settings = await PayrollSettings.getSettings();
    res.json({ data: settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { hraPercent, travelDefault, pfPercent, advanceRecoveryMode, advanceRecoveryCapPercent } = req.body;
    let settings = await PayrollSettings.getSettings();

    if (hraPercent != null) settings.hraPercent = hraPercent;
    if (travelDefault != null) settings.travelDefault = travelDefault;
    if (pfPercent != null) settings.pfPercent = pfPercent;
    if (advanceRecoveryMode != null) settings.advanceRecoveryMode = advanceRecoveryMode;
    if (advanceRecoveryCapPercent != null) settings.advanceRecoveryCapPercent = advanceRecoveryCapPercent;
    settings.updatedBy = req.user?._id; // if you have auth middleware attaching req.user

    await settings.save();
    res.json({ data: settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;