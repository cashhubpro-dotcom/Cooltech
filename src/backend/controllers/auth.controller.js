// controllers/auth.controller.js
import jwt  from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email, isActive: true }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const isMatch = await user.comparePassword(password);

    // ── Log login attempt (success or fail) ──────────────────────────────────
    const device = req.headers['user-agent']?.slice(0, 80) || 'Unknown device';
    const ip     = req.ip || req.connection?.remoteAddress || 'Unknown IP';
    await user.addLoginHistory(isMatch ? 'success' : 'failed', device, ip);

    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    // ── Log activity ──────────────────────────────────────────────────────────
    await user.logActivity('Logged in', '#22C55E');

    // ── Sign token ────────────────────────────────────────────────────────────
    const token = signToken(user._id);

    // Strip password before sending
    const userData = user.toJSON();

    res.json({ message: 'Login successful.', token, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /api/auth/register (optional, admin use) ───────────────────────────
export const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email, and password are required.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered.' });

    const user  = await User.create({ name, email, password, role, phone, department });
    const token = signToken(user._id);

    res.status(201).json({ message: 'User created.', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};