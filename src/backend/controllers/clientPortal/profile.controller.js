import Customer from '../../models/Customer.js';
import User from '../../models/User.js';
import Job from '../../models/Job.js';
import Invoice from '../../models/Invoice.model.js';

const AVATAR_PALETTE = ['#3B82F6', '#EA580C', '#16A34A', '#7C3AED', '#DB2777', '#0891B2'];
const colorFor = (seed = '') => {
  const hash = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};
const initialsFor = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

// GET /client-portal/me/profile
export const getProfile = async (req, res) => {
  const customer = await Customer.findById(req.user.customer);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer record not found.' });

  res.json({
    success: true,
    data: {
      id: customer.customerId,
      name: customer.name,
      contact: req.user.name, // Customer has no separate "contact person" field — User.name is the real contact
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      type: customer.type,
      gst: customer.gst || '',
      amc: customer.amc,
      avatar: initialsFor(customer.name),
      color: colorFor(customer.customerId),
    },
  });
};

// GET /client-portal/me/profile/summary — LIVE aggregation, not cached
export const getProfileSummary = async (req, res) => {
  const customer = await Customer.findById(req.user.customer);
  if (!customer) return res.status(404).json({ success: false, message: 'Customer record not found.' });

  const [jobsDone, invoiceAgg] = await Promise.all([
    Job.countDocuments({ customer: customer._id, status: 'completed', isDeleted: false }),
    Invoice.aggregate([
      {
        $match: {
          status: 'paid',
          isDeleted: false,
          $or: [
            { customerId: customer._id },  // real ref, once backfilled
            { customer: customer.name },   // fallback for pre-backfill invoices
          ],
        },
      },
      { $group: { _id: null, totalSpent: { $sum: '$total' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      memberSince: customer.createdAt,
      units: customer.units,
      totalJobsDone: jobsDone,
      totalSpent: invoiceAgg[0]?.totalSpent || 0,
      clientType: customer.type,
      gst: customer.gst || '',
    },
  });
};

// PATCH /client-portal/me/profile
export const updateProfile = async (req, res) => {
  const allowed = ['name', 'email', 'phone', 'address'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );

  const customer = await Customer.findByIdAndUpdate(req.user.customer, updates, {
    new: true,
    runValidators: true,
  });
  if (!customer) return res.status(404).json({ success: false, message: 'Customer record not found.' });

  // "Contact Person" in the UI is really the logged-in User's own name — keep it in sync there, not on Customer
  if (req.body.contact && req.body.contact !== req.user.name) {
    await User.findByIdAndUpdate(req.user._id, { name: req.body.contact });
  }

  res.json({ success: true, data: customer });
};

// PATCH /client-portal/me/password
export const changePassword = async (req, res) => {
  const { current, newPw, confirm } = req.body;

  if (!current || !newPw || !confirm)
    return res.status(400).json({ success: false, message: 'All password fields are required.' });
  if (newPw !== confirm)
    return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
  if (newPw.length < 8)
    return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(current);
  if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

  user.password = newPw; // pre-save hook re-hashes
  await user.save();
  await user.logActivity('Changed account password', '#DC2626');

  res.json({ success: true, data: { message: 'Password updated successfully.' } });
};

// GET /client-portal/me/profile/notification-prefs
export const getNotificationPrefs = async (req, res) => {
  const customer = await Customer.findById(req.user.customer).select('notificationPrefs');
  if (!customer) return res.status(404).json({ success: false, message: 'Customer record not found.' });
  res.json({ success: true, data: customer.notificationPrefs });
};

// PATCH /client-portal/me/profile/notification-prefs
export const updateNotificationPrefs = async (req, res) => {
  const allowed = ['jobUpdates', 'invoiceReminders', 'amcReminders', 'serviceReminders', 'promotions'];
  const updates = {};
  for (const key of allowed) {
    if (typeof req.body[key] === 'boolean') updates[`notificationPrefs.${key}`] = req.body[key];
  }

  const customer = await Customer.findByIdAndUpdate(
    req.user.customer,
    { $set: updates },
    { new: true }
  ).select('notificationPrefs');

  res.json({ success: true, data: customer.notificationPrefs });
};