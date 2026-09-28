// routes/customerAccess.routes.js
// POST /api/customers  — creates a customer and, optionally, a client-portal login (User, role "client").
// Mounted in server.js BEFORE apiRoutes; all other methods/paths fall through to the generic CRUD.
import express from 'express';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { sendClientWelcomeEmail, sendClientWelcomeWhatsApp } from '../utils/clientAccessMail.js';

const router = express.Router();

// Only these fields may be set on create (blocks spoofing totalJobs, isDeleted, portalUser, etc.)
const CUSTOMER_FIELDS = [
  'name', 'type', 'phone', 'email', 'units', 'amc',
  'address', 'country', 'state', 'city', 'area', 'pincode',
  'notes', 'gst', 'tags',
];

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  const body = req.body || {};
  const wantLogin        = body.loginAllowed === true;
  const emailNotif       = body.emailNotif !== false;      // default on
  const whatsappNotif    = body.whatsappNotif === true;    // default off
  const tempPassword     = typeof body.tempPassword === 'string' ? body.tempPassword : '';
  // NOTE: body.userRole is deliberately ignored — a portal login is always role "client".

  const data = pick(body, CUSTOMER_FIELDS);
  if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase();
  if (!data.email) delete data.email;

  try {
    // ── Pre-checks (nothing is written until these pass) ─────────────────────
    if (wantLogin) {
      if (!['admin', 'manager'].includes(req.user?.role))
        return res.status(403).json({ message: 'Only an admin or manager can grant client-portal access.' });
      if (!data.email || !EMAIL_RE.test(data.email))
        return res.status(400).json({ message: 'A valid email is required to grant app access.' });
      if (tempPassword.length < 8)
        return res.status(400).json({ message: 'Temporary password must be at least 8 characters.' });
      if (await User.findOne({ email: data.email }).select('_id'))
        return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // ── 1. Customer ──────────────────────────────────────────────────────────
    const customer = await Customer.create({
      ...data,
      emailNotifications:    emailNotif,
      whatsappNotifications: whatsappNotif,
    });

    const access = { created: false, emailSent: false, whatsappSent: false, note: '' };

    // ── 2. Client login (User) ───────────────────────────────────────────────
    if (wantLogin) {
      let user;
      try {
        user = await User.create({
          name:               customer.name,
          email:              data.email,
          password:           tempPassword,          // hashed by User pre-save hook
          role:               'client',
          customer:           customer._id,
          phone:              customer.phone,
          isActive:           true,
          mustChangePassword: true,
          // Shown in the Users table:
          empId:              customer.customerId,   // e.g. C005 instead of EMP-###
          department:         'Client',
          roleLevel:          'Client',
          location:           [customer.city, customer.state].filter(Boolean).join(', '),
          permissions:        ['Client Portal Access'],
          notifications:      { emailDigest: emailNotif },
        });
      } catch (err) {
        // Don't leave a half-created customer behind
        await Customer.findByIdAndDelete(customer._id);
        const dup = err?.code === 11000;
        return res.status(dup ? 409 : 400).json({
          message: dup ? 'A user with this email already exists.' : err.message,
        });
      }

      customer.portalAccess = true;
      customer.portalUser   = user._id;
      await customer.save();
      access.created = true;

      // ── 3. Send credentials ────────────────────────────────────────────────
      const notes = [];

      if (emailNotif) {
        try {
          await sendClientWelcomeEmail({
            to: data.email,
            name: customer.name,
            customerId: customer.customerId,
            email: data.email,
            tempPassword,
          });
          access.emailSent = true;
        } catch (err) {
          console.error('[customer-access] welcome email failed:', err.message);
          notes.push('email could not be sent — share the password manually');
        }
      } else {
        notes.push('email notifications are off — share the password manually');
      }

      if (whatsappNotif) {
        try {
          await sendClientWelcomeWhatsApp({
            phone: customer.phone,
            name: customer.name,
            email: data.email,
            tempPassword,
          });
          access.whatsappSent = true;
        } catch (err) {
          console.error('[customer-access] welcome WhatsApp failed:', err.message);
          notes.push('WhatsApp message could not be sent');
        }
      }

      access.note = notes.join('; ');
    }

    return res.status(201).json({ ...customer.toJSON(), access });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

export default router;