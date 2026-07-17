// controllers/accountSettings.controller.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// ══════════════════════════════════════════════════════════════════════════════
// PASSWORD TAB
// ══════════════════════════════════════════════════════════════════════════════

// PUT /api/settings/password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Current and new password are required.' });

    if (newPassword.length < 8)
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });

    // Fetch user with password (select: false by default)
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ message: 'Current password is incorrect.' });

    user.password = newPassword; // pre('save') will hash it
    await user.save();

    await user.logActivity('Changed account password', '#8B5CF6');

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS TAB
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/settings/notifications
export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user.notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/settings/notifications
// Body: { jobAssigned: true, smsAlerts: false, ... } (any subset of keys)
export const updateNotifications = async (req, res) => {
  try {
    const ALLOWED_KEYS = [
      'jobAssigned', 'newQuotation', 'invoiceOverdue',
      'technicianAlert', 'dailySummary', 'smsAlerts',
      'emailDigest', 'browserPush',
    ];

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    ALLOWED_KEYS.forEach(key => {
      if (req.body[key] !== undefined) user.notifications[key] = Boolean(req.body[key]);
    });

    await user.save();
    res.json({ message: 'Notification preferences saved.', notifications: user.notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// APPEARANCE TAB
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/settings/preferences
export const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user.preferences);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/settings/preferences
// Body: { theme: "dark", language: "en-IN", timezone: "Asia/Kolkata", currency: "INR" }
export const updatePreferences = async (req, res) => {
  try {
    const ALLOWED = ['theme', 'language', 'timezone', 'currency'];
    const VALID_THEMES = ['light', 'dark', 'auto'];

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (req.body.theme && !VALID_THEMES.includes(req.body.theme))
      return res.status(400).json({ message: `theme must be one of: ${VALID_THEMES.join(', ')}` });

    ALLOWED.forEach(key => {
      if (req.body[key] !== undefined) user.preferences[key] = req.body[key];
    });

    await user.save();
    res.json({ message: 'Appearance preferences saved.', preferences: user.preferences });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY TAB
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/settings/security
// Returns: twoFactorEnabled, activeSessions, loginHistory
export const getSecurityInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('twoFactorEnabled activeSessions loginHistory');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({
      twoFactorEnabled: user.twoFactorEnabled,
      activeSessions:   user.activeSessions,
      loginHistory:     user.loginHistory,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /api/settings/security/2fa
// Body: { enabled: true | false }
export const toggle2FA = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean')
      return res.status(400).json({ message: 'enabled (boolean) is required.' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.twoFactorEnabled = enabled;
    await user.save();

    await user.logActivity(
      `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`,
      enabled ? '#22C55E' : '#DC2626'
    );

    res.json({ message: `2FA ${enabled ? 'enabled' : 'disabled'}.`, twoFactorEnabled: user.twoFactorEnabled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/settings/security/sessions/:sessionId
// Revoke a specific session
export const revokeSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const before = user.activeSessions.length;
    user.activeSessions = user.activeSessions.filter(
      s => s._id.toString() !== req.params.sessionId
    );

    if (user.activeSessions.length === before)
      return res.status(404).json({ message: 'Session not found.' });

    await user.save();
    res.json({ message: 'Session revoked.', activeSessions: user.activeSessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/settings/security/sessions
// Revoke ALL sessions except the current one
export const revokeAllSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Keep only the current session (matched by token passed in header)
    const currentTokenId = req.user.sessionId; // set in auth middleware
    user.activeSessions = user.activeSessions.filter(
      s => s._id.toString() === currentTokenId
    );

    await user.save();
    await user.logActivity('Revoked all other sessions', '#DC2626');

    res.json({ message: 'All other sessions revoked.', activeSessions: user.activeSessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /api/settings/account
// Soft-delete / deactivate account
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password)
      return res.status(400).json({ message: 'Please confirm your password to delete the account.' });

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: 'Incorrect password.' });

    user.isActive         = false;
    user.activeSessions   = [];
    await user.save();

    res.json({ message: 'Account deactivated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};